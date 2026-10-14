import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
process.env.CLOUDFLARE_CF_FETCH_ENABLED = "false";
process.env.WRANGLER_SEND_METRICS = "false";
process.env.WRANGLER_WRITE_LOGS = "false";
process.env.WRANGLER_LOG_PATH = resolve(root, ".wrangler/logs");
process.env.WRANGLER_REGISTRY_PATH = resolve(root, ".wrangler/dev-registry");
process.env.MINIFLARE_REGISTRY_PATH = resolve(root, ".wrangler/registry");
