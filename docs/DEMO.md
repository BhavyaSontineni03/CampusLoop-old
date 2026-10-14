# Functional demo walkthrough

This is an operating guide, not a customer pitch or slide script. Write your own story and narration for the assignment.

1. Open http://127.0.0.1:5173 and select **Maya · rider**. Default search is Decatur → Atlanta campus, 8:00 AM, Monday/Wednesday/Friday.
2. Request Alex's ride. Deselect Friday and send the Monday/Wednesday request. It appears as **Awaiting approval**; no seat has been reserved yet.
3. Switch to **Alex · driver**. Open **My commutes → Requests**, accept Maya, and open **I'm driving**. Monday and Wednesday each have one seat available; Friday still has two.
4. Switch back to Maya and open **My commutes**. The recurring arrangement is confirmed and its upcoming dates are visible.
5. Cancel one future Wednesday using **Manage → Cancel this date**. Confirm the prompt. Only that date becomes canceled. The next Wednesday stays scheduled. Alex sees the released capacity for that particular date.
6. For attendance, select another date's **Manage → Rehearse this ride day**. The visible rehearsal clock moves to five minutes after departure. Use **Check in**, **Mark completed**, or **Report driver no-show**. Only that date changes.
7. Switch to the driver and check in on a date the rider reported as a no-show to demonstrate a disputed report. Switch to **Campus reviewer** to inspect and record review notes. No automatic penalty is applied.
8. Return to real time using the rehearsal banner. To repeat from a clean starting point, choose **Campus reviewer → Reset demo**. The latest reset can be undone.

Additional checks:

- **Maya → Offer a ride** explains that vehicle approval is required.
- **Profile & checks** accepts synthetic PDF/JPEG/PNG registration and insurance evidence. Reviewer decisions include approve, needs changes, reject, and suspend.
- **Alex → Offer a ride** publishes an additional non-overlapping weekly schedule. A driver cannot publish conflicting offers within one hour on a shared weekday.
- **Pause new requests** preserves existing confirmed arrangements. **Cancel series** explicitly cancels future arrangements.
- Empty search states are real: try a neighborhood with no active drivers.
- Digital credential status remains **Not verified** when unavailable. The mailbox and seeded vehicle labels explicitly say they are demo data.

Before recording: close unrelated tabs, restore a fresh demo, set your browser to a readable size, test the intended sequence, and check that the rehearsal banner is shown whenever using simulated time. Reviewers can run their own copy using the README instructions.
