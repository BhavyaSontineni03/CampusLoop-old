import handler from "vinext/server/fetch-handler";
import { isLocalRequest } from "./lib/local-request.mjs";

export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    if (!isLocalRequest(request)) {
      return Response.json(
        { error: "This demo is available only on localhost." },
        { status: 403 },
      );
    }
    return handler.fetch(request, env, ctx);
  },
};
