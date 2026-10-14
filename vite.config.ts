import "./scripts/local-env.mjs";
import vinext from "vinext";
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    watch: { usePolling: true },
  },
  plugins: [
    vinext(),
    cloudflare({
      configPath: "wrangler.jsonc",
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
      inspectorPort: false,
    }),
  ],
});
