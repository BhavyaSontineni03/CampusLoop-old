import { context, mutate, json, error } from "@/lib/server";
import { applyCommand, publicState, RuleError } from "@/lib/commutes.mjs";
export async function POST(request: Request) {
  try {
    const { workspace, actor, db } = await context(request);
    const text = await request.text();
    if (text.length > 12000) throw new RuleError("Request is too large.");
    let command;
    try {
      command = JSON.parse(text);
    } catch {
      throw new RuleError("Invalid request.");
    }
    if (
      !command ||
      typeof command !== "object" ||
      typeof command.type !== "string"
    )
      throw new RuleError("Invalid action.");
    if (command.type === "application") {
      for (const key of ["registration", "insurance"]) {
        const file = await db
          .prepare(
            "SELECT id FROM documents WHERE id = ? AND workspace = ? AND actor = ?",
          )
          .bind(String(command[key]), workspace, actor)
          .first();
        if (!file)
          throw new RuleError("Upload both documents before submitting.");
      }
    }
    const { state, revision } = await mutate(workspace, (s) =>
      applyCommand(s, actor, command, new Date(s.demoTime || Date.now())),
    );
    return json({
      ...publicState(state, actor, new Date(state.demoTime || Date.now())),
      revision,
    });
  } catch (e) {
    return error(e);
  }
}
