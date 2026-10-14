import { test } from "node:test";
import assert from "node:assert/strict";
import {
  seed,
  applyCommand,
  capacity,
  dateCapacity,
  matchOffers,
  publicState,
  departureInstant,
  isEligible,
  futureDates,
} from "../lib/commutes.mjs";
const now = new Date("2026-10-12T11:00:00Z");
const setup = () => seed(now);
const request = (
  s,
  actor = "maya",
  days = ["Mon", "Wed"],
  offerId = "ride-alex",
) => {
  const result = applyCommand(
    s,
    actor,
    { type: "request", offerId, days },
    now,
  );
  return s.requests.find((r) => r.id === result.id);
};
const accept = (s, r) =>
  applyCommand(
    s,
    "alex",
    { type: "decide", requestId: r.id, status: "accepted" },
    now,
  );
const filters = {
  campus: "Atlanta campus",
  area: "Decatur",
  time: "08:00",
  days: ["Mon", "Wed", "Fri"],
};
test("matching is deterministic, exact campus/area, overlapping days and ±30 minutes", () => {
  const s = setup();
  const rides = matchOffers(s, "maya", filters, now);
  assert.deepEqual(
    rides.map((o) => o.id),
    ["ride-alex", "ride-jordan"],
  );
  assert.deepEqual(rides[1].matchingDays, ["Mon", "Wed"]);
  assert.equal(
    matchOffers(s, "maya", { ...filters, area: "West End" }, now).length,
    0,
  );
  assert.equal(
    matchOffers(s, "maya", { ...filters, time: "08:46" }, now).length,
    0,
  );
  assert.equal(matchOffers(s, "maya", { ...filters, days: [] }, now).length, 0);
});
test("pending does not consume a seat; acceptance is per weekday", () => {
  const s = setup(),
    r = request(s);
  assert.equal(capacity(s, s.offers[0], "Mon"), 2);
  accept(s, r);
  assert.equal(capacity(s, s.offers[0], "Mon"), 1);
  assert.equal(capacity(s, s.offers[0], "Wed"), 1);
  assert.equal(capacity(s, s.offers[0], "Fri"), 2);
});
test("pending and accepted overlap duplicates and self-bookings are blocked", () => {
  const s = setup(),
    r = request(s);
  assert.throws(() => request(s), /already/);
  accept(s, r);
  assert.throws(() => request(s), /already/);
  assert.throws(() => request(s, "alex"), /own ride/);
  assert.throws(() => request(s, "maya", ["Tue"]), /only days/);
});
test("two pending requests compete for the last seat: only one can accept", () => {
  const s = setup();
  s.offers[0].seats = 1;
  const a = request(s),
    b = request(s, "jordan");
  accept(s, a);
  assert.throws(() => accept(s, b), /no longer a seat/);
  assert.equal(s.requests.filter((r) => r.status === "accepted").length, 1);
});
test("actor cannot approve another driver’s request or review applications", () => {
  const s = setup(),
    r = request(s);
  assert.throws(
    () =>
      applyCommand(
        s,
        "maya",
        { type: "decide", requestId: r.id, status: "accepted" },
        now,
      ),
    /Only this/,
  );
  assert.throws(
    () =>
      applyCommand(
        s,
        "maya",
        {
          type: "review",
          applicationId: "app-alex",
          status: "approved",
          reason: "test",
        },
        now,
      ),
    /Reviewer/,
  );
});
test("campus access gates mutations", () => {
  const s = setup();
  s.profiles[0].emailVerified = false;
  assert.throws(() => request(s), /Verify/);
  s.profiles[0].emailVerified = true;
  s.profiles[0].email = "maya@evilstudent.gsu.edu";
  assert.throws(() => request(s), /Verify/);
});
test("unapproved or expired driver cannot publish or accept", () => {
  const s = setup(),
    r = request(s);
  s.applications[0].insuranceExpiry = "2026-10-11";
  assert.equal(isEligible(s, "alex", now), false);
  assert.throws(() => accept(s, r), /not currently/);
  assert.throws(
    () => applyCommand(s, "maya", { type: "offer" }, now),
    /approved driver/,
  );
});
test("suspension hides offers and flags existing rides without silent cancellation", () => {
  const s = setup(),
    r = request(s);
  accept(s, r);
  applyCommand(
    s,
    "admin",
    {
      type: "review",
      applicationId: "app-alex",
      status: "suspended",
      reason: "Evidence needs review",
    },
    now,
  );
  assert.equal(r.status, "accepted");
  assert.equal(publicState(s, "maya", now).offers[0].eligible, false);
  assert.equal(
    matchOffers(s, "maya", filters, now).some((o) => o.id === "ride-alex"),
    false,
  );
});
test("pause blocks new requests and acceptances but keeps confirmed bookings", () => {
  const s = setup(),
    r = request(s);
  accept(s, r);
  const pending = request(s, "jordan");
  applyCommand(
    s,
    "alex",
    { type: "offerStatus", offerId: "ride-alex", status: "paused" },
    now,
  );
  assert.equal(r.status, "accepted");
  assert.equal(capacity(s, s.offers[0], "Mon"), 1);
  assert.throws(() => accept(s, pending), /not currently/);
});
test("withdrawal cannot be accepted and repeat cancellation is idempotent", () => {
  const s = setup(),
    r = request(s);
  applyCommand(s, "maya", { type: "cancelRequest", requestId: r.id }, now);
  assert.throws(() => accept(s, r), /already changed/);
  assert.deepEqual(
    applyCommand(s, "maya", { type: "cancelRequest", requestId: r.id }, now),
    { unchanged: true },
  );
});
test("repeat acceptance is idempotent", () => {
  const s = setup(),
    r = request(s);
  accept(s, r);
  assert.deepEqual(accept(s, r), { unchanged: true });
  assert.equal(capacity(s, s.offers[0], "Mon"), 1);
});
test("one-date cancellation releases only that date and preserves recurring capacity", () => {
  const s = setup(),
    r = request(s);
  accept(s, r);
  applyCommand(
    s,
    "maya",
    {
      type: "occurrence",
      requestId: r.id,
      date: "2026-10-14",
      status: "canceled",
    },
    now,
  );
  assert.equal(dateCapacity(s, s.offers[0], "2026-10-14"), 2);
  assert.equal(dateCapacity(s, s.offers[0], "2026-10-21"), 1);
  assert.equal(capacity(s, s.offers[0], "Wed"), 1);
  assert.equal(r.status, "accepted");
});
test("driver dated cancellation affects all passengers, not future weeks", () => {
  const s = setup(),
    a = request(s),
    b = request(s, "jordan");
  accept(s, a);
  accept(s, b);
  applyCommand(
    s,
    "alex",
    {
      type: "occurrence",
      requestId: a.id,
      date: "2026-10-14",
      status: "canceled",
    },
    now,
  );
  assert.equal(dateCapacity(s, s.offers[0], "2026-10-14"), 0);
  assert.equal(dateCapacity(s, s.offers[0], "2026-10-21"), 0);
  assert.equal(s.exceptions.length, 1);
  assert.equal(
    s.requests.every((r) => r.status === "accepted"),
    true,
  );
});
test("no-show stays on a single dated participation; contradictory reports are disputed", () => {
  const s = setup(),
    r = request(s);
  accept(s, r);
  const rideTime = new Date("2026-10-14T12:05:00Z");
  applyCommand(
    s,
    "maya",
    {
      type: "occurrence",
      requestId: r.id,
      date: "2026-10-14",
      status: "reported_no_show",
    },
    rideTime,
  );
  assert.equal(r.status, "accepted");
  assert.equal(s.reports[0].status, "open");
  applyCommand(
    s,
    "alex",
    {
      type: "occurrence",
      requestId: r.id,
      date: "2026-10-14",
      status: "checked_in",
    },
    rideTime,
  );
  assert.equal(s.reports[0].status, "disputed");
  assert.equal(
    s.exceptions.every((e) => e.date === "2026-10-14"),
    true,
  );
});
test("check-in before the allowed window, future no-show and past cancellation fail", () => {
  const s = setup(),
    r = request(s);
  accept(s, r);
  assert.throws(
    () =>
      applyCommand(
        s,
        "maya",
        {
          type: "occurrence",
          requestId: r.id,
          date: "2026-10-14",
          status: "checked_in",
        },
        now,
      ),
    /open 30 minutes/,
  );
  assert.throws(
    () =>
      applyCommand(
        s,
        "maya",
        {
          type: "occurrence",
          requestId: r.id,
          date: "2026-10-12",
          status: "reported_no_show",
        },
        new Date("2026-10-12T11:40:00Z"),
      ),
    /after/,
  );
  assert.throws(
    () =>
      applyCommand(
        s,
        "maya",
        {
          type: "occurrence",
          requestId: r.id,
          date: "2026-10-12",
          status: "canceled",
        },
        new Date("2026-10-12T12:05:00Z"),
      ),
    /past/,
  );
});
test("unrelated actor cannot change occurrence or cancel reservation", () => {
  const s = setup(),
    r = request(s);
  accept(s, r);
  assert.throws(
    () =>
      applyCommand(
        s,
        "jordan",
        {
          type: "occurrence",
          requestId: r.id,
          date: "2026-10-14",
          status: "canceled",
        },
        now,
      ),
    /another/,
  );
  assert.throws(
    () =>
      applyCommand(s, "alex", { type: "cancelRequest", requestId: r.id }, now),
    /Only the rider/,
  );
});
test("private fields are stripped and rider cannot read other reservations", () => {
  const s = setup();
  request(s);
  request(s, "jordan");
  const publicData = publicState(s, "maya", now);
  const driver = publicData.applications.find((a) => a.profileId === "alex");
  assert.equal(driver.plate, undefined);
  assert.equal(driver.insurance, undefined);
  assert.equal(
    publicData.profiles.find((p) => p.id === "alex").email,
    undefined,
  );
  assert.equal(publicData.requests.length, 1);
  assert.equal(publicState(s, "admin", now).applications[0].plate, "DEMO-101");
});
test("series cancellation releases all future seats", () => {
  const s = setup(),
    r = request(s);
  accept(s, r);
  applyCommand(
    s,
    "alex",
    { type: "offerStatus", offerId: "ride-alex", status: "canceled" },
    now,
  );
  assert.equal(r.status, "canceled");
  assert.equal(capacity(s, s.offers[0], "Mon"), 2);
});
test("overlapping offers, invalid times and capacity are rejected", () => {
  const s = setup();
  const offer = {
    type: "offer",
    area: "Decatur",
    campus: "Atlanta campus",
    pickup: "Station entrance",
    time: "08:15",
    days: ["Mon"],
    seats: 2,
  };
  assert.throws(() => applyCommand(s, "alex", offer, now), /one hour/);
  assert.throws(
    () => applyCommand(s, "alex", { ...offer, time: "25:00" }, now),
    /valid departure/,
  );
  assert.throws(
    () => applyCommand(s, "alex", { ...offer, time: "10:00", seats: 3 }, now),
    /fit your/,
  );
});
test("manual approval requires evidence and current expiry", () => {
  const s = setup();
  s.applications[0].insurance = "";
  assert.throws(
    () =>
      applyCommand(
        s,
        "admin",
        {
          type: "review",
          applicationId: "app-alex",
          status: "approved",
          reason: "Reviewed",
        },
        now,
      ),
    /required/,
  );
});
test("DST keeps the local departure at 8 AM when UTC offset changes", () => {
  assert.equal(
    departureInstant("2026-10-30", "08:00"),
    "2026-10-30T12:00:00.000Z",
  );
  assert.equal(
    departureInstant("2026-11-02", "08:00"),
    "2026-11-02T13:00:00.000Z",
  );
  assert.equal(futureDates(["Mon"], now).length, 4);
});
test("incidents require a participant and preserve review notes", () => {
  const s = setup(),
    r = request(s);
  assert.throws(
    () =>
      applyCommand(
        s,
        "jordan",
        { type: "report", requestId: r.id, note: "Test" },
        now,
      ),
    /own arrangement/,
  );
  applyCommand(
    s,
    "maya",
    { type: "report", requestId: r.id, note: "Pickup concern" },
    now,
  );
  applyCommand(
    s,
    "admin",
    {
      type: "reviewReport",
      reportId: s.reports[0].id,
      note: "Reviewed manually",
    },
    now,
  );
  assert.equal(s.reports[0].status, "reviewed");
  assert.equal(s.reports[0].adminNote, "Reviewed manually");
});

test("a booking made after departure does not acquire a past occurrence", () => {
  const s = setup(),
    r = request(s);
  applyCommand(
    s,
    "alex",
    { type: "decide", requestId: r.id, status: "accepted" },
    new Date("2026-10-12T19:00:00Z"),
  );
  assert.equal(dateCapacity(s, s.offers[0], "2026-10-12"), 2);
  assert.throws(
    () =>
      applyCommand(
        s,
        "maya",
        {
          type: "occurrence",
          requestId: r.id,
          date: "2026-10-12",
          status: "completed",
        },
        new Date("2026-10-12T19:05:00Z"),
      ),
    /upcoming date/,
  );
});

test("demo reset is reviewer-only and can be undone without losing arrangements", () => {
  const s = setup(),
    r = request(s);
  accept(s, r);
  assert.throws(
    () => applyCommand(s, "maya", { type: "resetDemo" }, now),
    /reviewer/,
  );
  applyCommand(s, "admin", { type: "resetDemo" }, now);
  assert.equal(s.requests.length, 0);
  assert.equal(publicState(s, "admin").canUndoReset, true);
  assert.equal(publicState(s, "maya").previous, undefined);
  applyCommand(s, "admin", { type: "undoReset" }, now);
  assert.equal(s.requests[0].status, "accepted");
  assert.equal(s.requests[0].id, r.id);
});
