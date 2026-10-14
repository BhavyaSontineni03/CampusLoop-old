import { env } from "cloudflare:workers";
import { context, readState, json, error } from "@/lib/server";
import { RuleError } from "@/lib/commutes.mjs";
export async function POST(request: Request) {
  try {
    const { workspace, actor, db } = await context(request);
    if (!env.BUCKET)
      throw new RuleError("Private uploads are unavailable.", 503);
    const length = Number(request.headers.get("content-length"));
    if (length > 6 * 1024 * 1024)
      throw new RuleError("Choose a document smaller than 5 MB.");
    const form = await request.formData();
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      file.size > 5 * 1024 * 1024 ||
      !file.size ||
      !["application/pdf", "image/jpeg", "image/png"].includes(file.type)
    )
      throw new RuleError("Upload a PDF, JPG, or PNG up to 5 MB.");
    const bytes = await file.arrayBuffer();
    const head = new Uint8Array(bytes.slice(0, 8));
    const valid =
      file.type === "application/pdf"
        ? String.fromCharCode(...head.slice(0, 5)) === "%PDF-"
        : file.type === "image/jpeg"
          ? head[0] === 255 && head[1] === 216 && head[2] === 255
          : head[0] === 137 &&
            head[1] === 80 &&
            head[2] === 78 &&
            head[3] === 71;
    if (!valid)
      throw new RuleError("The file contents do not match its format.");
    const id = crypto.randomUUID();
    await env.BUCKET.put(`${workspace}/${id}`, bytes, {
      httpMetadata: { contentType: file.type },
    });
    await db
      .prepare(
        "INSERT INTO documents (id, workspace, actor, name, mime, created_at) VALUES (?,?,?,?,?,?)",
      )
      .bind(
        id,
        workspace,
        actor,
        file.name.slice(0, 120),
        file.type,
        new Date().toISOString(),
      )
      .run();
    return json({ id, name: file.name });
  } catch (e) {
    return error(e);
  }
}
export async function GET(request: Request) {
  try {
    const { workspace, actor, db } = await context(request);
    const id = new URL(request.url).searchParams.get("id");
    const { state } = await readState(workspace);
    const profile = state.profiles.find((p: any) => p.id === actor);
    const doc = await db
      .prepare("SELECT * FROM documents WHERE id = ? AND workspace = ?")
      .bind(id, workspace)
      .first<{ actor: string; mime: string; name: string }>();
    if (!doc || (doc.actor !== actor && profile?.role !== "admin"))
      throw new RuleError("Document not found.", 404);
    const object = await env.BUCKET?.get(`${workspace}/${id}`);
    if (!object) throw new RuleError("Document not found.", 404);
    return new Response(object.body, {
      headers: {
        "Content-Type": doc.mime,
        "Content-Disposition": `attachment; filename="document.${doc.mime === "application/pdf" ? "pdf" : doc.mime === "image/png" ? "png" : "jpg"}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return error(e);
  }
}
