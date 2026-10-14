# Architecture and boundaries

## Request boundary

The app runs on loopback with no sign-in. API requests must target localhost, 127.0.0.1 or IPv6 loopback; cross-origin and cross-site requests are rejected. The built server applies the same boundary to all requests. These checks limit accidental network exposure; they are not user authentication.

Every local request uses the `local-demo` workspace. `actor=maya|alex|jordan|admin` selects a fictional persona. Domain commands check ownership and reviewer status, but anyone using the local demo can intentionally switch personas. Do not expose this architecture as live student accounts. A public pilot needs real identity, server-issued roles and tenant isolation.

## Storage and atomic capacity

D1 stores one JSON state aggregate plus revision per workspace. A command reads revision N, validates every rule, and attempts `UPDATE ... WHERE revision = N`, advancing the revision by one. If another writer won, the command re-reads and revalidates against the new state, at most eight times. This is an atomic compare-and-swap, so accepted seat totals cannot exceed capacity even across Worker instances. All requested weekdays are committed together or none are. Duplicate acceptance/cancellation is idempotent; repeated overlapping seat requests are rejected.

For this small demo, aggregate-level contention is a deliberate tradeoff for a compact, auditable transaction boundary. It is not the proposed university-scale storage model. A pilot should normalize users, offers, weekly seat allocations, occurrences and participants, apply appropriate transaction isolation, and test sustained load. In D1, per-workspace aggregates are bounded by practical database/Worker limits; no claim of unlimited scale is made.

## Recurrence and ride dates

A recurring request allocates one seat on each accepted weekday. Pending requests allocate none. Individual dated exceptions record cancellations and attendance; they never change the weekly pattern. Departures are derived for a rolling 28-day view in `America/New_York`, preserving the local wall-clock time over daylight saving changes. No occurrence is generated before a booking's acceptance. Holidays are not inferred.

A rider cancellation frees that dated seat without opening a new recurring seat. CampusLoop intentionally has no one-off replacement-booking feature. Driver cancellation marks the entire dated departure canceled. Series cancellation releases future weekly allocations and retains prior exception/audit data. Attendance windows open 30 minutes before departure and close 12 hours after; no-show/completion reports begin at departure.

Check-in and reports are self-reported, not GPS evidence. Contradictory outcomes are marked disputed and never reduce a badge or impose a penalty automatically. The reviewer can record resolution notes; arbitrary historical attendance editing is not provided.

The demo rehearsal clock changes only the workspace's effective scheduling time, with a persistent visible banner. It never changes provider verification time or makes real travel occur. Reset restores fresh fictional data and keeps one previous state so it can be undone. Uploaded files are not silently deleted by reset.

## Privacy

Only minimal public driver/vehicle fields are returned to unrelated personas. Plate numbers, evidence object IDs, unrelated requests, email addresses, and report notes are stripped. Local R2 objects have random IDs scoped to the demo workspace and are served through a route that checks the selected persona's ownership or reviewer role; no public object URLs are created. Inputs enforce 5 MB per document, allowed MIME types, and basic content signatures. This is not malware scanning or authoritative evidence validation.

The local workspace is intended for synthetic documents. A real pilot still needs malware scanning, quotas, retention/deletion jobs, access reviews, incident handling, policy and university approval. Files remain in local storage, but reset does not implement a retention policy.

## Credential integration

An optional license key is read from local server configuration and never returned to the browser. No key is included. Access tokens and short-lived verification sessions are stored server-side. Wallet requests are bound to the local workspace and selected persona, expire after five minutes, and are consumed once on submission. Provider tokens are reused within their validity and setup is repeated after expiry; this demo does not keep seven-day refresh tokens. Claims returned by the provider are discarded after a successful cryptographic result; only a credential-check state and timestamp are retained. Driving entitlement remains `not checked`.

## Client consistency

The client does not announce mutation success until the server commits. It refreshes every 20 seconds and on window focus. The refreshed server time also causes matching to rerun; the Find a ride button is not programmatically clicked. Filter changes trigger a debounced search. Revision numbers prevent a late older response from overwriting newer state for the same persona. Failed actions surface a visible error without optimistic seat changes. A real notification service, offline mutation queue, SMS and chat are outside this prototype.

## Known scope gaps relative to the original plan

- Real university mailbox sign-up/confirmation: not connected; seeded mailbox status is explicitly labeled.
- Supabase and SQL RLS: omitted; local D1 persists a single demo workspace with persona-based projections.
- Dated occurrences: derived dates plus persisted exceptions rather than a pre-materialized occurrences table.
- Campus operational membership, moderation staffing, authoritative license/insurance checks, incident SLAs, legal policies and load testing: not supplied.
- Live SDK verification: implemented but only end-to-end testable after domain registration and a real supported wallet.
- Sharing: source runs locally. There is no hosted preview or production authentication in this edition.
