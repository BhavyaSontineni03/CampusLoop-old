import assert from "node:assert/strict";
const base = process.env.TEST_URL || "http://127.0.0.1:5173";
if (
  new URL(base).hostname !== "127.0.0.1" &&
  new URL(base).hostname !== "localhost"
)
  throw new Error("These mutation tests only run against a local demo.");
async function api(path, actor = "maya", command, extra = {}) {
  const r = await fetch(
    `${base}/api/${path}${path.includes("?") ? "&" : "?"}actor=${actor}`,
    {
      method: command ? "POST" : "GET",
      headers: {
        ...(command
          ? { "Content-Type": "application/json", Origin: base }
          : {}),
        ...extra,
      },
      body: command ? JSON.stringify(command) : undefined,
    },
  );
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { error: text };
  }
  return { status: r.status, data };
}
const local = await fetch(base + "/api/state");
assert.equal(local.status, 200, "Local demo opens without a login");
assert.equal(
  (
    await fetch(base + "/api/state", {
      headers: { "sec-fetch-site": "cross-site" },
    })
  ).status,
  403,
);
assert.equal((await api("state", "invalid")).status, 403);
assert.equal(
  (
    await api(
      "actions",
      "maya",
      { type: "profile", name: "Test" },
      { Origin: "https://untrusted.example" },
    )
  ).status,
  403,
);
assert.equal(
  (
    await api("actions", "maya", {
      type: "review",
      applicationId: "app-alex",
      status: "approved",
      reason: "Unpermitted",
    })
  ).status,
  403,
);
assert.equal((await api("actions", "maya", { type: "offer" })).status, 403);
let state = (await api("state", "alex")).data;
const old = state.offers.find(
  (o) => o.pickup === "API concurrency fixture" && o.status !== "canceled",
);
if (old)
  assert.equal(
    (
      await api("actions", "alex", {
        type: "offerStatus",
        offerId: old.id,
        status: "canceled",
      })
    ).status,
    200,
  );
const added = await api("actions", "alex", {
  type: "offer",
  campus: "Atlanta campus",
  area: "West End",
  pickup: "API concurrency fixture",
  time: "11:00",
  days: ["Tue"],
  seats: 1,
});
assert.equal(added.status, 200, JSON.stringify(added.data));
const offer = added.data.offers.find(
  (o) => o.pickup === "API concurrency fixture" && o.status === "active",
);
const pending = await Promise.all(
  ["maya", "jordan"].map((actor) =>
    api("actions", actor, {
      type: "request",
      offerId: offer.id,
      days: ["Tue"],
    }),
  ),
);
assert.deepEqual(
  pending.map((r) => r.status),
  [200, 200],
);
state = (await api("state", "alex")).data;
const requests = state.requests.filter((r) => r.offerId === offer.id);
const accepted = await Promise.all(
  requests.map((r) =>
    api("actions", "alex", {
      type: "decide",
      requestId: r.id,
      status: "accepted",
    }),
  ),
);
assert.deepEqual(
  accepted.map((r) => r.status).sort(),
  [200, 409],
  "Exactly one concurrent request must win",
);
state = (await api("state", "alex")).data;
assert.equal(
  state.requests.filter(
    (r) => r.offerId === offer.id && r.status === "accepted",
  ).length,
  1,
);
assert.equal(state.offers.find((o) => o.id === offer.id).availability.Tue, 0);
const winner = state.requests.find(
  (r) => r.offerId === offer.id && r.status === "accepted",
);
assert.equal(
  (
    await api("actions", "alex", {
      type: "decide",
      requestId: winner.id,
      status: "accepted",
    })
  ).status,
  200,
);
assert.equal(
  (
    await api("actions", winner.riderId, {
      type: "request",
      offerId: offer.id,
      days: ["Tue"],
    })
  ).status,
  409,
);
const form = new FormData();
form.append(
  "file",
  new Blob(["%PDF-1.4\n% Synthetic test-only document\n%%EOF"], {
    type: "application/pdf",
  }),
  "sample-test.pdf",
);
const uploaded = await fetch(base + "/api/documents?actor=maya", {
  method: "POST",
  headers: { Origin: base },
  body: form,
});
assert.equal(uploaded.status, 200);
const file = await uploaded.json();
assert.equal(
  (await fetch(`${base}/api/documents?actor=alex&id=${file.id}`, {})).status,
  404,
);
assert.equal(
  (await fetch(`${base}/api/documents?actor=admin&id=${file.id}`, {})).status,
  200,
);
const badForm = new FormData();
badForm.append(
  "file",
  new Blob(["not an image"], { type: "image/png" }),
  "not-image.png",
);
assert.equal(
  (
    await fetch(base + "/api/documents?actor=maya", {
      method: "POST",
      headers: { Origin: base },
      body: badForm,
    })
  ).status,
  400,
);
assert.equal(
  (
    await api("actions", "maya", {
      type: "application",
      make: "Toyota",
      model: "Corolla",
      color: "Blue",
      plate: "TEST",
      seats: 2,
      insuranceExpiry: "2028-01-01",
      registration: file.id,
      insurance: file.id,
    })
  ).status,
  200,
);
assert.equal(
  (
    await api("actions", "admin", {
      type: "review",
      applicationId: (await api("state", "admin")).data.applications.find(
        (a) => a.profileId === "maya",
      ).id,
      status: "needs_changes",
      reason: "Synthetic test document is not valid vehicle evidence.",
    })
  ).status,
  200,
);
assert.equal((await api("identity")).data.available, false);
assert.equal(
  (
    await api("actions", "alex", {
      type: "offerStatus",
      offerId: offer.id,
      status: "canceled",
    })
  ).status,
  200,
);
console.log(
  "PASS: local access and role/CSRF gates; real D1 concurrent last-seat acceptance; idempotency; duplicate prevention; private upload ACL and magic-byte validation; application and reviewer workflow; unavailable SDK state.",
);
