# CampusLoop

Recurring rides for campus life.

![CampusLoop](docs/preview.png)

## About

The commute repeats. The planning often does not. Someone who needs a ride every Monday and Wednesday still has to ask who is driving, whether a seat is open, and what happens when one day falls through.

CampusLoop keeps that week in one place. A match shares the pickup area and campus, overlaps on at least one weekday, and leaves within 30 minutes of the time you want. Sending a request does not hold a seat. The seat is reserved only when the driver accepts, and capacity is checked again then, so two people cannot take the last seat.

After that, the routine stays on the schedule. You can cancel one date without dropping the rest of the week. Drivers post a weekly offer after a vehicle review. Credential checks stay separate from that review: the Credence wallet adapter is built in, and it is not turned on in this copy, so the credential stays unverified. An age check is not a license to drive. A campus reviewer can read reports and documents. Nothing applies a penalty on its own.

## What you can do

- Find a ride by neighborhood, campus, weekdays, and departure time.
- Request the days you actually need. Pending requests reserve no seats.
- Accept a request and see the seat count change for those weekdays only.
- Cancel one date, or the whole series. Check in, mark a ride complete, or report a no-show for that date.
- Offer a weekly ride once a vehicle is reviewed.
- Review reports and vehicle documents from the campus reviewer account.

Sample people are already in the app: Maya (rider), Alex (driver), Jordan (driver), and a campus reviewer. Everyone on this computer shares that same workspace. Switching accounts is part of the demo. There is no separate login.

## Run

Install Node.js 22.13 or newer, then:

```sh
npm ci
npm run setup
npm run dev
```

Open http://127.0.0.1:5173.

`npm run setup` builds the app and creates the local database. You can run it again. After that, `npm run dev` is enough. Stop the server with Ctrl+C. For the built app instead of the dev server, use `npm start`. Run only one server at a time.

The app stays on your computer. It does not need a Cloudflare or Supabase account. Saved rides and uploads live in `.wrangler/`, which is not committed.

## Try a ride

1. Stay on Maya. The default search is Decatur to Atlanta campus, 8:00 AM, Monday / Wednesday / Friday.
2. Request Alex's ride. Turn Friday off and send Monday and Wednesday. It shows as awaiting approval. No seat is held yet.
3. Switch to Alex. Open My commutes, accept Maya, then check the driving list. Monday and Wednesday each have one seat left. Friday still has two.
4. Switch back to Maya. My commutes shows the weekly plan and the upcoming dates.
5. Cancel one future Wednesday from Manage. Only that date is canceled. The next Wednesday stays on the schedule, and Alex gets that seat back.
6. On another date, choose Manage, then rehearse that ride day. The clock moves to five minutes after departure. Check in, mark it complete, or report a driver no-show. Only that date changes.
7. If the rider reports a no-show and the driver checks in, the campus reviewer can read it and add a note.
8. Leave rehearsal from the banner. To start clean, switch to the campus reviewer and reset the demo. The latest reset can be undone.

A few other things worth clicking:

- Maya cannot offer a ride until a vehicle is approved.
- Profile & checks accepts a PDF, JPEG, or PNG for registration and insurance. The reviewer can approve, ask for changes, reject, or suspend.
- Alex can post another weekly offer if it does not overlap. Two offers cannot leave within an hour on the same weekday.
- Pause new requests keeps rides that are already confirmed. Cancel series drops future dates.
- A neighborhood with no drivers shows an empty search. That is expected.

## Credence

Credence is the optional wallet check on **Profile & checks**. The button is **Verify with Credence**, under Digital credential. It is off in this copy of the app, and the button stays disabled until it is configured.

The empty placeholders are in `.dev.vars.example`:

- `CREDENCE_LICENSE_KEY`
- `CREDENCE_PROFILE_ID`
- `CREDENCE_REGISTERED_ORIGIN`

Copy that file to `.dev.vars`, fill in your own values, and restart the server. `.dev.vars` is not committed. The registered origin has to match the address you open in the browser.

The server code is `app/api/identity/route.ts`. Longer setup notes are in [docs/CREDENCE.md](docs/CREDENCE.md).

## Checks

```sh
npm test
npm run typecheck
npm run build
```

With the server running:

```sh
npm run test:api
```

The API check changes the sample data. Reset the demo from the campus reviewer when you are done.

## Code

| Path | What it is |
| --- | --- |
| `components/campus-loop.tsx` | App shell and navigation |
| `components/campus/` | Screens, dialogs, and client state |
| `app/globals.css` | Styles |
| `lib/commutes.mjs` | Matching, weekly rides, and seat rules |
| `lib/server.ts` | Saved workspace and database updates |
| `app/api/identity/route.ts` | Credence wallet check |
| `app/api/` | Search, actions, and documents |
| `db/`, `drizzle/` | Schema and migrations |
| `scripts/` | Local launch and database setup |
| `tests/` | Domain and API checks |

Mailbox checks, vehicle reviews, and the people in the app are sample data. Real student login is not built. More detail on how matching and storage work is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
