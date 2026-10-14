export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const AREAS = [
  "Decatur",
  "Midtown",
  "East Atlanta",
  "Sandy Springs",
  "West End",
  "Brookhaven",
];
export const CAMPUSES = [
  "Atlanta campus",
  "Perimeter · Decatur",
  "Perimeter · Dunwoody",
];
export class RuleError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const fail = (message, status = 400) => {
  throw new RuleError(message, status);
};
const id = () => crypto.randomUUID();
export function localDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function minutes(time) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
    fail("Choose a valid departure time.");
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
}
export function weekday(date) {
  return ["Sun", ...DAYS, "Sat"][new Date(date + "T12:00:00Z").getUTCDay()];
}
export function futureDates(days, now = new Date()) {
  const start = localDate(now);
  return Array.from({ length: 28 }, (_, i) => {
    const d = new Date(start + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  }).filter((d) => days.includes(weekday(d)));
}
export function departureInstant(date, time) {
  const target = Date.parse(`${date}T${time}:00Z`);
  let instant = target;
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      })
        .formatToParts(new Date(instant))
        .map((p) => [p.type, p.value]),
    );
    const rendered = Date.parse(
      `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00Z`,
    );
    instant += target - rendered;
  }
  return new Date(instant).toISOString();
}
export function seed(now = new Date()) {
  const expiry = new Date(now);
  expiry.setUTCFullYear(expiry.getUTCFullYear() + 1);
  return {
    version: 1,
    profiles: [
      {
        id: "maya",
        name: "Maya Patel",
        initials: "MP",
        email: "maya.demo@student.gsu.edu",
        role: "student",
        emailVerified: true,
        identity: "not_verified",
        color: "peach",
      },
      {
        id: "alex",
        name: "Alex Morgan",
        initials: "AM",
        email: "alex.demo@student.gsu.edu",
        role: "student",
        emailVerified: true,
        identity: "not_verified",
        color: "blue",
      },
      {
        id: "jordan",
        name: "Jordan Lee",
        initials: "JL",
        email: "jordan.demo@student.gsu.edu",
        role: "student",
        emailVerified: true,
        identity: "not_verified",
        color: "lavender",
      },
      {
        id: "admin",
        name: "Campus reviewer",
        initials: "CR",
        email: "reviewer.demo@student.gsu.edu",
        role: "admin",
        emailVerified: true,
        identity: "not_verified",
        color: "green",
      },
    ],
    applications: [
      {
        id: "app-alex",
        profileId: "alex",
        make: "Toyota",
        model: "Corolla",
        color: "Silver",
        plate: "DEMO-101",
        seats: 2,
        insuranceExpiry: expiry.toISOString().slice(0, 10),
        registration: "sample-registration",
        insurance: "sample-insurance",
        status: "approved",
        reason: "Fictional evidence reviewed for this demo.",
        sample: true,
      },
      {
        id: "app-jordan",
        profileId: "jordan",
        make: "Honda",
        model: "Civic",
        color: "Blue",
        plate: "DEMO-202",
        seats: 3,
        insuranceExpiry: expiry.toISOString().slice(0, 10),
        registration: "sample-registration",
        insurance: "sample-insurance",
        status: "approved",
        reason: "Fictional evidence reviewed for this demo.",
        sample: true,
      },
    ],
    offers: [
      {
        id: "ride-alex",
        driverId: "alex",
        campus: CAMPUSES[0],
        area: "Decatur",
        pickup: "Decatur MARTA · station entrance",
        time: "08:00",
        days: ["Mon", "Wed", "Fri"],
        seats: 2,
        status: "active",
        createdAt: now.toISOString(),
      },
      {
        id: "ride-jordan",
        driverId: "jordan",
        campus: CAMPUSES[0],
        area: "Decatur",
        pickup: "Decatur Square · public library entrance",
        time: "08:15",
        days: ["Mon", "Tue", "Wed", "Thu"],
        seats: 3,
        status: "active",
        createdAt: now.toISOString(),
      },
      {
        id: "ride-jordan-midtown",
        driverId: "jordan",
        campus: CAMPUSES[0],
        area: "Midtown",
        pickup: "Arts Center MARTA · main entrance",
        time: "09:15",
        days: ["Tue", "Thu"],
        seats: 3,
        status: "active",
        createdAt: now.toISOString(),
      },
    ],
    requests: [],
    exceptions: [],
    reports: [],
    audit: [],
  };
}
export function isEligible(state, driverId, now = new Date()) {
  const p = state.profiles.find((p) => p.id === driverId);
  const a = state.applications.find((a) => a.profileId === driverId);
  return (
    !!p?.emailVerified &&
    /@student\.gsu\.edu$/i.test(p.email) &&
    a?.status === "approved" &&
    a.insuranceExpiry >= localDate(now)
  );
}
export function capacity(state, offer, day) {
  return (
    offer.seats -
    state.requests.filter(
      (r) =>
        r.offerId === offer.id &&
        r.status === "accepted" &&
        r.days.includes(day),
    ).length
  );
}
export function requestDates(request, offer, now = new Date()) {
  return futureDates(request.days, now).filter(
    (date) =>
      departureInstant(date, offer.time) >=
      (request.decidedAt || request.createdAt),
  );
}
export function dateCapacity(state, offer, date) {
  const departure = departureInstant(date, offer.time);
  if (
    (offer.canceledAt && offer.canceledAt <= departure) ||
    state.exceptions.some(
      (e) =>
        e.offerId === offer.id &&
        e.date === date &&
        e.actorId === offer.driverId &&
        e.status === "canceled",
    )
  )
    return 0;
  return (
    offer.seats -
    state.requests.filter(
      (r) =>
        r.offerId === offer.id &&
        r.days.includes(weekday(date)) &&
        (r.decidedAt || r.createdAt) <= departure &&
        (r.status === "accepted" ||
          (r.status === "canceled" && r.canceledAt > departure)) &&
        !state.exceptions.some(
          (e) =>
            e.requestId === r.id &&
            e.date === date &&
            e.actorId === r.riderId &&
            e.status === "canceled",
        ),
    ).length
  );
}
export function matchOffers(state, actor, filters, now = new Date()) {
  const time = minutes(filters.time);
  return state.offers
    .filter(
      (o) =>
        o.status === "active" &&
        o.driverId !== actor &&
        isEligible(state, o.driverId, now) &&
        o.campus === filters.campus &&
        o.area === filters.area &&
        Math.abs(minutes(o.time) - time) <= 30,
    )
    .map((o) => ({
      ...o,
      matchingDays: o.days.filter(
        (d) => filters.days.includes(d) && capacity(state, o, d) > 0,
      ),
      availability: Object.fromEntries(
        o.days.map((d) => [d, capacity(state, o, d)]),
      ),
    }))
    .filter((o) => o.matchingDays.length)
    .sort(
      (a, b) =>
        b.matchingDays.length - a.matchingDays.length ||
        Math.abs(minutes(a.time) - time) - Math.abs(minutes(b.time) - time) ||
        a.id.localeCompare(b.id),
    );
}
function clean(value, max = 100) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    fail("Please complete every required field.");
  return value.trim();
}
function selectedDays(days) {
  if (
    !Array.isArray(days) ||
    !days.length ||
    days.length > 5 ||
    new Set(days).size !== days.length ||
    days.some((d) => !DAYS.includes(d))
  )
    fail("Select at least one valid weekday.");
  return DAYS.filter((d) => days.includes(d));
}
export function applyCommand(state, actorId, command, now = new Date()) {
  const actor = state.profiles.find((p) => p.id === actorId);
  if (!actor) fail("Account not found.", 403);
  if (!actor.emailVerified || !/@student\.gsu\.edu$/i.test(actor.email))
    fail("Verify an eligible campus mailbox before continuing.", 403);
  const timestamp = now.toISOString();
  const c = command;
  let result = {};
  const getOffer = (offerId) => {
    const o = state.offers.find((o) => o.id === offerId);
    if (!o) fail("Ride not found.", 404);
    return o;
  };
  const getRequest = (requestId) => {
    const r = state.requests.find((r) => r.id === requestId);
    if (!r) fail("Request not found.", 404);
    return r;
  };
  const eligible = (o) => {
    if (o.status !== "active" || !isEligible(state, o.driverId, now))
      fail("This driver is not currently accepting new arrangements.", 409);
  };
  switch (c.type) {
    case "resetDemo": {
      if (actor.role !== "admin")
        fail("Use the reviewer account to reset the demo.", 403);
      const previous = structuredClone(state);
      delete previous.previous;
      for (const key of Object.keys(state)) delete state[key];
      Object.assign(state, seed(), { previous });
      break;
    }
    case "undoReset": {
      if (actor.role !== "admin" || !state.previous)
        fail("No demo reset is available to undo.", 403);
      const previous = state.previous;
      for (const key of Object.keys(state)) delete state[key];
      Object.assign(state, previous);
      break;
    }

    case "demoClock": {
      if (c.reset) {
        delete state.demoTime;
        break;
      }
      const r = getRequest(c.requestId);
      const o = getOffer(r.offerId);
      if (![r.riderId, o.driverId].includes(actorId) || r.status !== "accepted")
        fail("Choose one of your confirmed demo rides.", 403);
      if (!requestDates(r, o, new Date()).includes(c.date))
        fail("Choose a date in the next four weeks.");
      state.demoTime = new Date(
        Date.parse(departureInstant(c.date, o.time)) + 5 * 60000,
      ).toISOString();
      break;
    }

    case "request": {
      const o = getOffer(c.offerId);
      eligible(o);
      if (o.driverId === actorId) fail("You cannot request your own ride.");
      const days = selectedDays(c.days);
      if (days.some((d) => !o.days.includes(d)))
        fail("Select only days offered by this driver.");
      if (
        state.requests.some(
          (r) =>
            r.riderId === actorId &&
            r.offerId === o.id &&
            ["pending", "accepted"].includes(r.status) &&
            r.days.some((d) => days.includes(d)),
        )
      )
        fail("You already have a request for one of these days.", 409);
      if (days.some((d) => capacity(state, o, d) < 1))
        fail("A selected day is full. Try another day.", 409);
      const r = {
        id: id(),
        offerId: o.id,
        riderId: actorId,
        days,
        status: "pending",
        createdAt: timestamp,
      };
      state.requests.push(r);
      result = { id: r.id };
      break;
    }
    case "decide": {
      const r = getRequest(c.requestId);
      const o = getOffer(r.offerId);
      if (o.driverId !== actorId)
        fail("Only this ride’s driver can decide requests.", 403);
      if (!["accepted", "rejected"].includes(c.status))
        fail("Invalid decision.");
      if (r.status === c.status) return { unchanged: true };
      if (r.status !== "pending")
        fail(
          "This request has already changed. Refresh to see its status.",
          409,
        );
      if (c.status === "accepted") {
        eligible(o);
        if (r.days.some((d) => capacity(state, o, d) < 1))
          fail("There is no longer a seat on every requested day.", 409);
        const conflict = state.requests.some(
          (other) =>
            other.riderId === r.riderId &&
            other.status === "accepted" &&
            other.id !== r.id &&
            other.days.some((d) => r.days.includes(d)) &&
            Math.abs(minutes(getOffer(other.offerId).time) - minutes(o.time)) <
              60,
        );
        if (conflict)
          fail("This rider already has an overlapping confirmed commute.", 409);
      }
      r.status = c.status;
      r.decidedAt = timestamp;
      break;
    }
    case "cancelRequest": {
      const r = getRequest(c.requestId);
      if (r.riderId !== actorId)
        fail("Only the rider can cancel this arrangement.", 403);
      if (r.status === "canceled") return { unchanged: true };
      if (!["accepted", "pending"].includes(r.status))
        fail("This request is no longer active.");
      r.status = "canceled";
      r.canceledAt = timestamp;
      break;
    }
    case "offer": {
      if (!isEligible(state, actorId, now))
        fail(
          "An approved driver application with current insurance is required.",
          403,
        );
      const a = state.applications.find((a) => a.profileId === actorId);
      const days = selectedDays(c.days);
      minutes(c.time);
      if (!CAMPUSES.includes(c.campus) || !AREAS.includes(c.area))
        fail("Choose a listed campus and neighborhood.");
      if (!Number.isInteger(c.seats) || c.seats < 1 || c.seats > a.seats)
        fail("Seat count must fit your reviewed vehicle.");
      if (
        state.offers.some(
          (o) =>
            o.driverId === actorId &&
            o.status !== "canceled" &&
            o.days.some((d) => days.includes(d)) &&
            Math.abs(minutes(o.time) - minutes(c.time)) < 60,
        )
      )
        fail(
          "You already offer a ride within one hour on an overlapping day.",
          409,
        );
      const o = {
        id: id(),
        driverId: actorId,
        campus: c.campus,
        area: c.area,
        pickup: clean(c.pickup, 120),
        time: c.time,
        days,
        seats: c.seats,
        status: "active",
        createdAt: timestamp,
      };
      state.offers.push(o);
      result = { id: o.id };
      break;
    }
    case "offerStatus": {
      const o = getOffer(c.offerId);
      if (o.driverId !== actorId)
        fail("Only the driver can manage this offer.", 403);
      if (!["active", "paused", "canceled"].includes(c.status))
        fail("Invalid offer status.");
      if (o.status === "canceled")
        fail("Create a new offer to restart a canceled series.");
      if (c.status === "active" && !isEligible(state, actorId, now))
        fail("Driver approval needs attention.", 403);
      o.status = c.status;
      if (c.status === "canceled") {
        o.canceledAt = timestamp;
        state.requests
          .filter(
            (r) =>
              r.offerId === o.id && ["accepted", "pending"].includes(r.status),
          )
          .forEach((r) => {
            r.status = "canceled";
            r.canceledAt = timestamp;
          });
      }
      break;
    }
    case "application": {
      const current = state.applications.find((a) => a.profileId === actorId);
      if (current?.status === "approved" || current?.status === "suspended")
        fail(
          "Contact the reviewer to update an approved or suspended application.",
        );
      if (!Number.isInteger(c.seats) || c.seats < 1 || c.seats > 7)
        fail("Choose between 1 and 7 passenger seats.");
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(c.insuranceExpiry) ||
        c.insuranceExpiry < localDate(now)
      )
        fail("Insurance evidence must have a current expiry date.");
      const a = {
        id: current?.id || id(),
        profileId: actorId,
        make: clean(c.make, 40),
        model: clean(c.model, 40),
        color: clean(c.color, 30),
        plate: clean(c.plate, 20),
        seats: c.seats,
        insuranceExpiry: c.insuranceExpiry,
        registration: clean(c.registration, 250),
        insurance: clean(c.insurance, 250),
        status: "pending",
        reason: "",
        sample: false,
      };
      state.applications = state.applications.filter(
        (a) => a.profileId !== actorId,
      );
      state.applications.push(a);
      break;
    }
    case "review": {
      if (actor.role !== "admin") fail("Reviewer access is required.", 403);
      const a = state.applications.find((a) => a.id === c.applicationId);
      if (!a) fail("Application not found.", 404);
      if (a.profileId === actorId)
        fail("You cannot review your own application.");
      if (
        !["approved", "rejected", "needs_changes", "suspended"].includes(
          c.status,
        )
      )
        fail("Invalid review status.");
      if (
        c.status === "approved" &&
        (!a.registration || !a.insurance || a.insuranceExpiry < localDate(now))
      )
        fail("Current insurance and registration evidence are required.");
      a.status = c.status;
      a.reason = clean(c.reason, 300);
      a.reviewedAt = timestamp;
      break;
    }
    case "occurrence": {
      const r = getRequest(c.requestId);
      const o = getOffer(r.offerId);
      if (![r.riderId, o.driverId].includes(actorId))
        fail("This ride date belongs to another arrangement.", 403);
      if (r.status !== "accepted")
        fail("This arrangement is no longer confirmed.", 409);
      if (!requestDates(r, o, now).includes(c.date))
        fail("Choose an upcoming date from this arrangement.");
      const dep = Date.parse(departureInstant(c.date, o.time));
      if (c.status === "canceled" && dep <= now.getTime())
        fail("This departure is in the past. You can report an issue instead.");
      if (
        !["canceled", "checked_in", "completed", "reported_no_show"].includes(
          c.status,
        )
      )
        fail("Invalid attendance status.");
      if (
        c.status !== "canceled" &&
        (now.getTime() < dep - 30 * 60000 || now.getTime() > dep + 12 * 3600000)
      )
        fail(
          "Check-in and attendance reports open 30 minutes before departure and close 12 hours after.",
        );
      if (
        ["completed", "reported_no_show"].includes(c.status) &&
        now.getTime() < dep
      )
        fail("Report the outcome after the scheduled departure.");
      if (
        state.exceptions.some(
          (e) =>
            e.offerId === o.id &&
            e.date === c.date &&
            e.status === "canceled" &&
            (e.actorId === o.driverId || e.requestId === r.id),
        )
      )
        fail("This ride date was canceled.", 409);
      const existing = state.exceptions.find(
        (e) =>
          e.requestId === r.id && e.date === c.date && e.actorId === actorId,
      );
      if (existing?.status === c.status) return { unchanged: true };
      state.exceptions = state.exceptions.filter(
        (e) =>
          !(e.requestId === r.id && e.date === c.date && e.actorId === actorId),
      );
      state.exceptions.push({
        id: id(),
        offerId: o.id,
        requestId: r.id,
        date: c.date,
        actorId,
        status: c.status,
        at: timestamp,
      });
      if (c.status === "reported_no_show") {
        const other = state.exceptions.find(
          (e) =>
            e.requestId === r.id &&
            e.date === c.date &&
            e.actorId !== actorId &&
            ["checked_in", "completed", "reported_no_show"].includes(e.status),
        );
        state.reports.push({
          id: id(),
          requestId: r.id,
          date: c.date,
          reporterId: actorId,
          subjectId: actorId === r.riderId ? o.driverId : r.riderId,
          type: "no_show",
          status: other ? "disputed" : "open",
          note: "Self-reported; requires manual review.",
          createdAt: timestamp,
        });
      }
      if (["checked_in", "completed", "reported_no_show"].includes(c.status)) {
        state.reports
          .filter(
            (q) =>
              q.requestId === r.id &&
              q.date === c.date &&
              q.reporterId !== actorId &&
              q.type === "no_show",
          )
          .forEach((q) => (q.status = "disputed"));
      }
      break;
    }
    case "report": {
      const r = getRequest(c.requestId);
      const o = getOffer(r.offerId);
      if (![r.riderId, o.driverId].includes(actorId))
        fail("You can only report your own arrangement.", 403);
      state.reports.push({
        id: id(),
        requestId: r.id,
        date: localDate(now),
        reporterId: actorId,
        subjectId: actorId === r.riderId ? o.driverId : r.riderId,
        type: "concern",
        status: "open",
        note: clean(c.note, 500),
        createdAt: timestamp,
      });
      break;
    }
    case "reviewReport": {
      if (actor.role !== "admin") fail("Reviewer access is required.", 403);
      const report = state.reports.find((r) => r.id === c.reportId);
      if (!report) fail("Report not found.", 404);
      report.status = "reviewed";
      report.adminNote = clean(c.note, 500);
      break;
    }
    case "profile":
      actor.name = clean(c.name, 60);
      actor.initials = actor.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("");
      break;
    default:
      fail("Unknown action.");
  }
  state.audit.push({
    id: id(),
    actorId,
    type: c.type,
    at: timestamp,
    ...(c.date
      ? { date: c.date, requestId: c.requestId, status: c.status }
      : {}),
  });
  if (state.audit.length > 1000) state.audit = state.audit.slice(-1000);
  return result;
}
export function publicState(state, actorId, now = new Date()) {
  const actor = state.profiles.find((p) => p.id === actorId);
  if (!actor) fail("Unknown demo account.", 403);
  const admin = actor.role === "admin";
  const requests = state.requests.filter(
    (r) =>
      admin ||
      r.riderId === actorId ||
      state.offers.find((o) => o.id === r.offerId)?.driverId === actorId,
  );
  return {
    profiles: state.profiles.map(({ email, ...p }) => ({
      ...p,
      ...(p.id === actorId || admin ? { email } : {}),
    })),
    actorId,
    applications: state.applications.map((a) =>
      a.profileId === actorId || admin
        ? a
        : {
            id: a.id,
            profileId: a.profileId,
            make: a.make,
            model: a.model,
            color: a.color,
            seats: a.seats,
            status: a.status,
            insuranceExpiry: a.insuranceExpiry,
            sample: a.sample,
          },
    ),
    offers: state.offers.map((o) => ({
      ...o,
      eligible: isEligible(state, o.driverId, now),
      availability: Object.fromEntries(
        o.days.map((d) => [d, capacity(state, o, d)]),
      ),
      dateAvailability: Object.fromEntries(
        futureDates(o.days, now).map((date) => [
          date,
          dateCapacity(state, o, date),
        ]),
      ),
    })),
    requests,
    exceptions: state.exceptions.filter(
      (e) =>
        requests.some((r) => r.id === e.requestId) ||
        e.actorId === state.offers.find((o) => o.id === e.offerId)?.driverId,
    ),
    reports: state.reports.filter((r) => admin || r.reporterId === actorId),
    audit: admin ? state.audit.slice(-30) : [],
    today: localDate(now),
    serverTime: now.toISOString(),
    demoTime: state.demoTime || null,
    canUndoReset: !!state.previous,
    demo: true,
  };
}
