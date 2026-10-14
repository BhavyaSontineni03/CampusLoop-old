import { context, readState, json, error } from "@/lib/server";
import { publicState } from "@/lib/commutes.mjs";
export async function GET(request: Request) {
  try {
    const { workspace, actor } = await context(request);
    const { state, revision } = await readState(workspace);
    return json({
      ...publicState(state, actor, new Date(state.demoTime || Date.now())),
      revision,
    });
  } catch (e) {
    return error(e);
  }
}
