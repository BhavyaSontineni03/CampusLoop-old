import test from "node:test";
import assert from "node:assert/strict";
import { isLocalRequest } from "../lib/local-request.mjs";

test("local demo accepts loopback and same-origin requests", () => {
  for (const host of ["localhost", "127.0.0.1", "[::1]"]) {
    const origin = `http://${host}:5173`;
    assert.equal(isLocalRequest(new Request(`${origin}/api/state`)), true);
    assert.equal(
      isLocalRequest(
        new Request(`${origin}/api/actions`, { headers: { origin } }),
      ),
      true,
    );
  }
});
test("local demo rejects remote hosts and cross-site requests", () => {
  assert.equal(
    isLocalRequest(new Request("https://example.com/api/state")),
    false,
  );
  for (const headers of [
    { origin: "https://example.com" },
    { origin: "null" },
    { "sec-fetch-site": "cross-site" },
  ]) {
    assert.equal(
      isLocalRequest(
        new Request("http://127.0.0.1:5173/api/state", { headers }),
      ),
      false,
    );
  }
});
