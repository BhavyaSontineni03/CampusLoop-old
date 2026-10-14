"use client";
import { ArrowRight, FileText, CheckCircle2 } from "lucide-react";
import { dateLabel, Badge, Avatar } from "@/components/campus/shared";
import { useCampus } from "@/components/campus/state";
export function ReviewCenter() {
  const {
    actor,
    data,
    busy,
    setConfirm,
    setReport,
    setReportNote,
    setReview,
    setReviewReason,
    setReviewStatus,
    person,
    act,
  } = useCampus();
  if (!data) return null;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Review center</h1>
          <p>Review submitted evidence. Keep every decision clear.</p>
        </div>
        <div className="button-row">
          <Badge>
            {data.applications.filter((a) => a.status === "pending").length}{" "}
            pending
          </Badge>
          <button
            className="secondary"
            disabled={busy}
            onClick={() =>
              setConfirm({
                title: "Start a fresh demo?",
                detail:
                  "This resets fictional rides, requests, and application statuses. Uploaded files stay private. You can undo the latest reset from this screen.",
                command: { type: "resetDemo" },
                label: "Reset demo",
              })
            }
          >
            Reset demo
          </button>
          {data.canUndoReset && (
            <button
              className="text-button"
              disabled={busy}
              onClick={() =>
                act({ type: "undoReset" }, "Previous demo restored.")
              }
            >
              Undo reset
            </button>
          )}
        </div>
      </div>
      <section className="stack">
        {data.applications.map((a) => (
          <article className="panel review-card" key={a.id}>
            <div className="person-line">
              <Avatar person={person(a.profileId)} />
              <div>
                <h3>{person(a.profileId)?.name}</h3>
                <p>
                  {a.color} {a.make} {a.model} · {a.seats} seats
                </p>
              </div>
              <Badge status={a.status} />
            </div>
            <div className="review-facts">
              <span>
                Private plate<strong>{a.plate}</strong>
              </span>
              <span>
                Insurance expires
                <strong>{a.insuranceExpiry}</strong>
              </span>
              <span>
                Evidence source
                <strong>
                  {a.sample ? "Fictional demo evidence" : "Privately uploaded"}
                </strong>
              </span>
            </div>
            {a.sample ? (
              <div className="soft-notice">
                This is a seeded sample review, not an authoritative vehicle or
                insurance check.
              </div>
            ) : (
              <div className="button-row">
                {["registration", "insurance"].map((k) => (
                  <a
                    className="secondary"
                    key={k}
                    href={`/api/documents?actor=${actor}&id=${a[k]}`}
                  >
                    <FileText size={16} />
                    Open {k}
                  </a>
                ))}
              </div>
            )}
            <div className="arrangement-footer">
              <p>{a.reason || "Awaiting review"}</p>
              <button
                className="secondary"
                onClick={() => {
                  setReview(a);
                  setReviewReason("");
                  setReviewStatus("approved");
                }}
              >
                Review application
                <ArrowRight size={16} />
              </button>
            </div>
          </article>
        ))}
      </section>
      <section className="panel incident-panel">
        <h2>Reports & concerns</h2>
        <p>
          Self-reported outcomes need human review. No automatic penalties are
          applied.
        </p>
        {data.reports.length ? (
          data.reports.map((r) => (
            <div className="report-row" key={r.id}>
              <div>
                <strong>
                  {person(r.reporterId)?.name} ·{" "}
                  {r.type === "no_show" ? "No-show report" : "Concern"}
                </strong>
                <p>{r.note}</p>
                <small>
                  {dateLabel(r.date)} · {r.adminNote}
                </small>
              </div>
              <Badge status={r.status} />
              {r.status !== "reviewed" && (
                <button
                  className="secondary"
                  onClick={() => {
                    setReport({ ...r, admin: true });
                    setReportNote("");
                  }}
                >
                  Review
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="soft-notice">
            <CheckCircle2 size={17} />
            No reports to review.
          </p>
        )}
      </section>
      <details className="panel audit">
        <summary>Recent audit activity</summary>
        {data.audit.length ? (
          data.audit
            .slice()
            .reverse()
            .map((a) => (
              <p key={a.id}>
                {person(a.actorId)?.name} · {a.type.replaceAll("_", " ")}{" "}
                <small>{new Date(a.at).toLocaleString()}</small>
              </p>
            ))
        ) : (
          <p>No actions yet.</p>
        )}
      </details>
    </>
  );
}
