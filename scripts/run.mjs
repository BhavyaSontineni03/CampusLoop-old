import "./local-env.mjs";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const [command] = process.argv.slice(2);
if (!["dev", "build", "start"].includes(command)) {
  throw new Error("Use dev, build, or start.");
}
const cli = new URL(
  command === "start"
    ? "../node_modules/wrangler/bin/wrangler.js"
    : "../node_modules/vinext/dist/cli.js",
  import.meta.url,
);
const args =
  command === "start"
    ? [
        "dev",
        "--config",
        "dist/server/wrangler.json",
        "--local",
        "--persist-to",
        ".wrangler/state",
        "--ip",
        "127.0.0.1",
        "--port",
        "5173",
        "--inspector-port",
        "0",
      ]
    : [
        command,
        ...(command === "dev"
          ? ["--hostname", "127.0.0.1", "--port", "5173"]
          : []),
      ];
if (command === "start") {
  const child = spawn(process.execPath, [fileURLToPath(cli), ...args], {
    stdio: "inherit",
  });
  child.on("error", (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => child.kill(signal));
  }
} else {
  process.argv = [process.execPath, fileURLToPath(cli), ...args];
  await import(cli.href);
}
