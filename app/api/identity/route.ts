import { env } from "cloudflare:workers";
import { context, mutate, json, error } from "@/lib/server";
import { RuleError } from "@/lib/commutes.mjs";
const base = "https://credenceid.com/cloudsdk/playground";
function config(request: Request) {
  const e = env as unknown as Record<string, string>;
  const origin = new URL(request.url).origin;
  return {
    key: e.CREDENCE_LICENSE_KEY,
    profile: e.CREDENCE_PROFILE_ID,
    origin,
    ready:
      !!e.CREDENCE_LICENSE_KEY &&
      !!e.CREDENCE_PROFILE_ID &&
      e.CREDENCE_REGISTERED_ORIGIN === origin,
  };
}
async function provider(
  path: string,
  origin: string,
  token?: string,
  body?: unknown,
) {
  const r = await fetch(base + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) {
    const data = (await r.json().catch(() => ({}))) as any;
    const reason = String(data.error || "");
    throw new RuleError(
      reason.includes("DOMAIN")
        ? "The SDK key is not registered to this app’s domain."
        : reason.includes("PROFILE")
          ? "The credential profile is unavailable for this flow."
          : "Credential verification is unavailable. No verification was recorded.",
      503,
    );
  }
  return r.json() as Promise<any>;
}
export async function GET(request: Request) {
  try {
    await context(request);
    const c = config(request);
    return json({
      available: c.ready,
      reason: c.ready
        ? "Ready for a supported wallet."
        : "Live credential verification has not been configured. You can explore the rest of the demo.",
      profile: "Age Check Profile 2.0",
    });
  } catch (e) {
    return error(e);
  }
}
export async function POST(request: Request) {
  try {
    const { workspace, actor, db } = await context(request);
    const c = config(request);
    if (!c.ready)
      throw new RuleError(
        "Verification unavailable: register this app’s HTTPS domain with Credence before using a wallet.",
        503,
      );
    const text = await request.text();
    if (text.length > 200000)
      throw new RuleError("Credential response is too large.");
    const body = JSON.parse(text);
    if (body.action === "start") {
      const flow = body.flow === "google" ? "google" : "apple";
      let cache = await db
        .prepare(
          "SELECT token FROM verification_sessions WHERE workspace = ? AND actor = ? AND flow = 'auth' AND expires > ? LIMIT 1",
        )
        .bind(workspace, actor, Date.now() + 60000)
        .first<{ token: string }>();
      if (!cache) {
        const auth = await provider("/v1/setup", c.origin, undefined, {
          licenseKey: c.key,
          profileId: c.profile,
        });
        if (typeof auth.accessToken !== "string")
          throw new RuleError(
            "The verification provider returned an invalid session.",
            503,
          );
        cache = { token: auth.accessToken };
        await db
          .prepare(
            "INSERT INTO verification_sessions (id,workspace,actor,token,flow,expires) VALUES (?,?,?,?,?,?)",
          )
          .bind(
            crypto.randomUUID(),
            workspace,
            actor,
            cache.token,
            "auth",
            Date.now() + Math.min(Number(auth.expiresIn) || 900, 900) * 1000,
          )
          .run();
      }
      const initiated = await provider(
        flow === "google"
          ? "/dcapi/openid4vp/v1/initiate"
          : "/v1/getDocRequest",
        c.origin,
        cache.token,
      );
      if (!initiated.sessionId)
        throw new RuleError(
          "The provider could not start a wallet session.",
          503,
        );
      await db
        .prepare("DELETE FROM verification_sessions WHERE expires < ?")
        .bind(Date.now())
        .run();
      await db
        .prepare(
          "INSERT INTO verification_sessions (id,workspace,actor,token,flow,expires) VALUES (?,?,?,?,?,?)",
        )
        .bind(
          initiated.sessionId,
          workspace,
          actor,
          cache.token,
          flow,
          Date.now() + 5 * 60000,
        )
        .run();
      return json({
        sessionId: initiated.sessionId,
        protocol: flow === "google" ? "openid4vp" : "org-iso-mdoc",
        data:
          flow === "google"
            ? initiated.payload
            : initiated.dcRequest?.deviceRequest,
      });
    }
    if (body.action === "finish") {
      const session = await db
        .prepare(
          "DELETE FROM verification_sessions WHERE id = ? AND workspace = ? AND actor = ? AND flow != 'auth' AND expires > ? RETURNING token,flow",
        )
        .bind(String(body.sessionId), workspace, actor, Date.now())
        .first<{ token: string; flow: string }>();
      if (!session)
        throw new RuleError(
          "This wallet session expired or was already used. Please start again.",
          409,
        );
      if (typeof body.data !== "string")
        throw new RuleError("No supported credential was returned.");
      const result = await provider(
        session.flow === "google"
          ? "/dcapi/openid4vp/v1/validate"
          : "/v1/verifyDocRequest",
        c.origin,
        session.token,
        { sessionId: body.sessionId, data: body.data },
      );
      if (result.cancelled)
        return json({
          status: "canceled",
          message: "You canceled verification. No status was changed.",
        });
      if (result.res !== true)
        return json({
          status: "failed",
          message: "The credential could not be verified.",
        });
      await mutate(workspace, (state) => {
        const p = state.profiles.find((p: any) => p.id === actor);
        p.identity = "credential_verified";
        p.identityCheckedAt = new Date().toISOString();
        state.audit.push({
          id: crypto.randomUUID(),
          actorId: actor,
          type: "live_credential_check",
          at: p.identityCheckedAt,
        });
      });
      return json({
        status: "verified",
        message:
          "Credential cryptography checked by Credence. Driving entitlement is still not checked.",
      });
    }
    throw new RuleError("Invalid verification action.");
  } catch (e) {
    return error(e);
  }
}
