"use client";
import {
  ArrowRight,
  MapPin,
  Check,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";
import {
  timeLabel,
  Avatar,
  Days,
  Field,
  Modal,
} from "@/components/campus/shared";
import { useCampus } from "@/components/campus/state";
export function CampusDialogs() {
  const {
    setPage,
    error,
    busy,
    booking,
    setBooking,
    bookingDays,
    setBookingDays,
    confirm,
    setConfirm,
    help,
    setHelp,
    report,
    setReport,
    reportNote,
    setReportNote,
    setCommuteTab,
    review,
    setReview,
    reviewReason,
    setReviewReason,
    reviewStatus,
    setReviewStatus,
    person,
    act,
  } = useCampus();
  return (
    <>
      {" "}
      {booking && (
        <Modal
          title="Make this your weekly ride"
          onClose={() => !busy && setBooking(null)}
        >
          <div className="modal-body">
            <div className="person-line">
              <Avatar person={person(booking.driverId)} />
              <div>
                <h3>
                  {booking.area} to {booking.campus}
                </h3>
                <p>
                  {timeLabel(booking.time)} with{" "}
                  {person(booking.driverId)?.name}
                </p>
              </div>
            </div>
            <div className="soft-notice">
              <MapPin size={18} />
              {booking.pickup}
            </div>
            <Field label="Which days work for you?">
              <Days
                value={bookingDays}
                allowed={booking.days.filter(
                  (d: string) => booking.availability[d] > 0,
                )}
                onChange={setBookingDays}
              />
            </Field>
            <p>
              One seat on each selected weekday, repeating weekly. Your driver
              needs to accept before you have a confirmed seat.
            </p>
            <p className="form-note">
              Departure time is not a guaranteed arrival time. Confirm your
              pickup plan before traveling.
            </p>
            {error && (
              <div role="alert" className="error-banner">
                {error}
              </div>
            )}
            <button
              className="primary full"
              disabled={busy || !bookingDays.length}
              onClick={async () => {
                if (
                  await act(
                    { type: "request", offerId: booking.id, days: bookingDays },
                    "Request sent. You can follow its status in My commutes.",
                  )
                ) {
                  setBooking(null);
                  setPage("commutes");
                  setCommuteTab("riding");
                }
              }}
            >
              {busy ? (
                <LoaderCircle size={17} className="spin" />
              ) : (
                <ArrowRight size={17} />
              )}
              Send weekly request
            </button>
          </div>
        </Modal>
      )}
      {confirm && (
        <Modal title={confirm.title} onClose={() => !busy && setConfirm(null)}>
          <div className="modal-body">
            <p>{confirm.detail}</p>
            {error && (
              <div role="alert" className="error-banner">
                {error}
              </div>
            )}
            <div className="button-row">
              <button className="secondary" onClick={() => setConfirm(null)}>
                Keep my plan
              </button>
              <button
                className="primary destructive"
                disabled={busy}
                onClick={async () => {
                  if (await act(confirm.command, "Your change was saved."))
                    setConfirm(null);
                }}
              >
                {confirm.label || "Confirm cancellation"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {review && (
        <Modal
          title={`Review ${person(review.profileId)?.name}’s application`}
          onClose={() => !busy && setReview(null)}
        >
          <form
            className="modal-body"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await act(
                  {
                    type: "review",
                    applicationId: review.id,
                    status: reviewStatus,
                    reason: reviewReason,
                  },
                  "Review decision saved.",
                )
              )
                setReview(null);
            }}
          >
            <p>
              Record what you reviewed. Approval is a manual decision, not
              verification by an insurer or motor vehicle authority.
            </p>
            <Field label="Decision">
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
              >
                <option value="approved">Approve</option>
                <option value="needs_changes">Request changes</option>
                <option value="rejected">Reject</option>
                <option value="suspended">Suspend</option>
              </select>
            </Field>
            <Field label="Reason / review notes">
              <textarea
                required
                minLength={1}
                maxLength={300}
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
              />
            </Field>
            {error && (
              <div role="alert" className="error-banner">
                {error}
              </div>
            )}
            <button className="primary" disabled={busy}>
              Save decision
              <Check size={17} />
            </button>
          </form>
        </Modal>
      )}
      {report && (
        <Modal
          title={report.admin ? "Review this report" : "Report a concern"}
          onClose={() => !busy && setReport(null)}
        >
          <form
            className="modal-body"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await act(
                  report.admin
                    ? {
                        type: "reviewReport",
                        reportId: report.id,
                        note: reportNote,
                      }
                    : {
                        type: "report",
                        requestId: report.id,
                        note: reportNote,
                      },
                  "Report saved for manual review.",
                )
              )
                setReport(null);
            }}
          >
            <div className="soft-notice">
              This demo is not monitored in real time. In an emergency, contact
              local emergency services. For campus assistance, use official GSU
              support channels.
            </div>
            <Field label={report.admin ? "Review notes" : "What happened?"}>
              <textarea
                required
                maxLength={500}
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
              />
            </Field>
            {error && (
              <div className="error-banner" role="alert">
                {error}
              </div>
            )}
            <button disabled={busy} className="primary">
              {report.admin ? "Mark reviewed" : "Submit report"}
              <ArrowRight size={17} />
            </button>
          </form>
        </Modal>
      )}
      {help && (
        <Modal
          title="A shared ride. A clear plan."
          onClose={() => setHelp(false)}
        >
          <div className="modal-body help-content">
            <h3>Find your weekly match</h3>
            <p>
              Choose a campus, pickup neighborhood, departure time, and
              weekdays. Matches use the same neighborhood and campus,
              overlapping days, and departure times within 30 minutes.
            </p>
            <h3>Request, then confirm</h3>
            <p>
              Your request reserves a seat only when the driver accepts. Seat
              counts are checked separately for each weekday. Pausing an offer
              keeps existing confirmations intact.
            </p>
            <h3>Plans can change</h3>
            <p>
              Cancel one date or your entire recurring arrangement. Check-in and
              no-show reports apply to that ride date only. They are
              self-reported and never an automatic penalty.
            </p>
            <h3>Trust, without overpromising</h3>
            <p>
              Campus mailbox, digital credential, and vehicle evidence checks
              are separate. None guarantees a safe ride or verifies driving
              entitlement. This local demo uses fictional student accounts and
              sample vehicle reviews.
            </p>
            <div className="soft-notice">
              <LockKeyhole size={18} />
              Not a live transportation service.
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
