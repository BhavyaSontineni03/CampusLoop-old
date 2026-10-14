import { env } from "cloudflare:workers";
import { isLocalRequest } from "./local-request.mjs";
import { seed, RuleError } from "./commutes.mjs";
export async function context(request: Request) {
  if (!isLocalRequest(request))
    throw new RuleError("This demo is available only on localhost.", 403);
  const actor = new URL(request.url).searchParams.get("actor") || "maya";
  if (!["maya", "alex", "jordan", "admin"].includes(actor))
    throw new RuleError("Unknown demo account.", 403);
  if (!env.DB)
    throw new RuleError(
      "Local database unavailable. Run npm run setup, then restart the app.",
      503,
    );
  return { workspace: "local-demo", actor, db: env.DB };
}
export async function readState(workspace: string) {
  const db = env.DB!;
  let row = await db
    .prepare("SELECT state, revision FROM workspaces WHERE id = ?")
    .bind(workspace)
    .first<{ state: string; revision: number }>();
  if (!row) {
    await db
      .prepare(
        "INSERT OR IGNORE INTO workspaces (id,state,revision) VALUES (?,?,0)",
      )
      .bind(workspace, JSON.stringify(seed()))
      .run();
    row = await db
      .prepare("SELECT state, revision FROM workspaces WHERE id = ?")
      .bind(workspace)
      .first<{ state: string; revision: number }>();
  }
  if (!row) throw new RuleError("Unable to load your demo.", 503);
  return { state: JSON.parse(row.state), revision: row.revision };
}
export async function mutate(workspace: string, fn: (state: any) => any) {
  for (let i = 0; i < 8; i++) {
    const { state, revision } = await readState(workspace);
    const result = fn(state);
    const changed = await env
      .DB!.prepare(
        "UPDATE workspaces SET state = ?, revision = revision + 1 WHERE id = ? AND revision = ?",
      )
      .bind(JSON.stringify(state), workspace, revision)
      .run();
    if (changed.meta.changes === 1)
      return { state, result, revision: revision + 1 };
  }
  throw new RuleError(
    "Another action updated this ride. Refresh and try again.",
    409,
  );
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export function error(e: unknown) {
  if (e instanceof RuleError) return json({ error: e.message }, e.status);
  console.error(
    "CampusLoop request failed",
    e instanceof Error ? e.name : "unknown",
  );
  return json(
    {
      error:
        "Something went wrong. Your action was not confirmed. Please retry.",
    },
    503,
  );
}
