import { context, readState, json, error } from "@/lib/server";
import { matchOffers } from "@/lib/commutes.mjs";
export async function GET(request: Request) {
  try {
    const { workspace, actor } = await context(request);
    const params = new URL(request.url).searchParams;
    const { state } = await readState(workspace);
    return json(
      matchOffers(
        state,
        actor,
        {
          campus: params.get("campus"),
          area: params.get("area"),
          time: params.get("time") || "08:00",
          days: params.has("days")
            ? (params.get("days") || "").split(",").filter(Boolean)
            : ["Mon", "Wed", "Fri"],
        },
        new Date(state.demoTime || Date.now()),
      ),
    );
  } catch (e) {
    return error(e);
  }
}
