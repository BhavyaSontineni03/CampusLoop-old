"use client";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Clock3,
  Check,
  AlertCircle,
  Flag,
} from "lucide-react";
import { requestDates, departureInstant } from "@/lib/commutes.mjs";
import {
  timeLabel,
  dateLabel,
  Badge,
  Avatar,
  Days,
  Empty,
} from "@/components/campus/shared";
import { useCampus } from "@/components/campus/state";
export function MyCommutes() {
  const {
    data,
    busy,
    setConfirm,
    setReport,
    setReportNote,
    commuteTab,
    setCommuteTab,
    person,
    act,
    nav,
    incoming,
    riding,
    driving,
    upcoming,
    occurrenceStatus,
  } = useCampus();
  if (!data) return null;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>My commutes</h1>
          <p>One plan for the week. Room for life to happen.</p>
        </div>
      </div>
      <div className="tabs">
        <button
          className={commuteTab === "riding" ? "selected" : ""}
          onClick={() => setCommuteTab("riding")}
        >
          I’m riding{" "}
          <span>
            {
              riding.filter((r) => ["accepted", "pending"].includes(r.status))
                .length
            }
          </span>
        </button>
        <button
          className={commuteTab === "driving" ? "selected" : ""}
          onClick={() => setCommuteTab("driving")}
        >
          I’m driving <span>{driving.length}</span>
        </button>
        <button
          className={commuteTab === "requests" ? "selected" : ""}
          onClick={() => setCommuteTab("requests")}
        >
          Requests {incoming.length > 0 && <span>{incoming.length}</span>}
        </button>
      </div>
      {commuteTab === "riding" && (
        <>
          {upcoming[0] && (
            <div className="next-ride">
              <span className="icon-tile">
                <CalendarDays />
              </span>
              <div>
                <span className="small-cap">NEXT SCHEDULED DEPARTURE</span>
                <h3>
                  {dateLabel(upcoming[0].date)} ·{" "}
                  {timeLabel(upcoming[0].o.time)}
                </h3>
                <p>
                  {upcoming[0].o.area} to {upcoming[0].o.campus} with{" "}
                  {person(upcoming[0].o.driverId)?.name}
                </p>
              </div>
              <Badge
                status={occurrenceStatus(
                  upcoming[0].r,
                  upcoming[0].o,
                  upcoming[0].date,
                )}
              />
            </div>
          )}
          {!riding.length ? (
            <Empty
              title="Your routine starts with one ride"
              detail="Find a weekly ride, choose your days, and send your first request."
              action={
                <button className="primary" onClick={() => nav("find")}>
                  Find my ride
                  <ArrowRight size={17} />
                </button>
              }
            />
          ) : (
            <div className="stack">
              {[...riding].reverse().map((r) => {
                const o = data.offers.find((o) => o.id === r.offerId);
                return (
                  <article className="panel arrangement" key={r.id}>
                    <div className="arrangement-head">
                      <div className="person-line">
                        <Avatar person={person(o.driverId)} />
                        <div>
                          <h3>
                            {o.area} <ArrowRight size={15} /> {o.campus}
                          </h3>
                          <p>
                            With {person(o.driverId)?.name} ·{" "}
                            {timeLabel(o.time)}
                          </p>
                        </div>
                      </div>
                      <Badge status={r.status} />
                    </div>
                    <div className="arrangement-meta">
                      <Days value={r.days} />
                      <span>
                        <MapPin size={14} />
                        {o.pickup}
                      </span>
                    </div>
                    {r.status === "pending" && (
                      <div className="soft-notice">
                        <Clock3 size={17} />
                        Your request is with the driver. A seat is reserved only
                        after acceptance.
                      </div>
                    )}
                    {r.status === "accepted" && (
                      <>
                        {!o.eligible && (
                          <div className="error-banner">
                            <AlertCircle size={17} />
                            Driver approval needs attention. Do not rely on this
                            ride; arrange other transport.
                          </div>
                        )}
                        {o.status === "paused" && (
                          <div className="soft-notice">
                            New requests are paused. Your confirmed arrangement
                            is still active.
                          </div>
                        )}
                        <details className="dates-details" open>
                          <summary>
                            Upcoming ride dates <span>Next four weeks</span>
                          </summary>
                          <div className="date-list">
                            {requestDates(r, o, new Date(data.serverTime))
                              .filter(
                                (date) =>
                                  Date.parse(departureInstant(date, o.time)) +
                                    12 * 3600000 >
                                  Date.parse(data.serverTime),
                              )
                              .slice(0, 8)
                              .map((date) => {
                                const status = occurrenceStatus(r, o, date);
                                return (
                                  <div className="date-row" key={date}>
                                    <div>
                                      <strong>{dateLabel(date)}</strong>
                                      <small>{timeLabel(o.time)} ET</small>
                                    </div>
                                    <Badge status={status} />
                                    {status !== "canceled" && (
                                      <div className="date-actions">
                                        <button
                                          disabled={busy || !o.eligible}
                                          onClick={() =>
                                            act(
                                              {
                                                type: "occurrence",
                                                requestId: r.id,
                                                date,
                                                status: "checked_in",
                                              },
                                              "Your check-in was saved. It is self-reported.",
                                            )
                                          }
                                        >
                                          Check in
                                        </button>
                                        <select
                                          aria-label={`Manage ${dateLabel(date)}`}
                                          value=""
                                          disabled={busy}
                                          onChange={(e) => {
                                            if (e.target.value === "rehearse") {
                                              act(
                                                {
                                                  type: "demoClock",
                                                  requestId: r.id,
                                                  date,
                                                },
                                                "Rehearsal clock moved to this departure. No real ride is taking place.",
                                              );
                                            } else if (
                                              e.target.value === "canceled"
                                            )
                                              setConfirm({
                                                title: "Skip this ride date?",
                                                detail: `Only ${dateLabel(date)} will be canceled. Your other weekly rides stay confirmed.`,
                                                command: {
                                                  type: "occurrence",
                                                  requestId: r.id,
                                                  date,
                                                  status: "canceled",
                                                },
                                              });
                                            else
                                              act(
                                                {
                                                  type: "occurrence",
                                                  requestId: r.id,
                                                  date,
                                                  status: e.target.value,
                                                },
                                                "Your self-reported outcome was saved.",
                                              );
                                          }}
                                        >
                                          <option value="" disabled>
                                            Manage
                                          </option>
                                          <option value="rehearse">
                                            Rehearse this ride day
                                          </option>
                                          <option value="canceled">
                                            Cancel this date
                                          </option>
                                          <option value="completed">
                                            Mark completed
                                          </option>
                                          <option value="reported_no_show">
                                            Report driver no-show
                                          </option>
                                        </select>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                          <small className="form-note">
                            Check-in opens 30 minutes before departure.
                            Attendance is self-reported, not location verified.
                          </small>
                        </details>
                      </>
                    )}
                    <div className="arrangement-footer">
                      {["accepted", "pending"].includes(r.status) && (
                        <button
                          className="text-button danger"
                          onClick={() =>
                            setConfirm({
                              title:
                                r.status === "pending"
                                  ? "Withdraw this request?"
                                  : "Cancel the weekly arrangement?",
                              detail:
                                "All future days in this arrangement will be released. Past ride records stay in your history.",
                              command: {
                                type: "cancelRequest",
                                requestId: r.id,
                              },
                            })
                          }
                        >
                          {r.status === "pending"
                            ? "Withdraw request"
                            : "Cancel weekly arrangement"}
                        </button>
                      )}
                      <button
                        className="text-button"
                        onClick={() => {
                          setReport(r);
                          setReportNote("");
                        }}
                      >
                        <Flag size={14} />
                        Report a concern
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
      {commuteTab === "driving" &&
        (!driving.length ? (
          <Empty
            title="Make room for a campus neighbor"
            detail="Get your vehicle evidence reviewed, then share your weekly route."
            action={
              <button className="primary" onClick={() => nav("offer")}>
                Offer a ride
              </button>
            }
          />
        ) : (
          <div className="stack">
            {driving.map((o) => (
              <article className="panel arrangement" key={o.id}>
                <div className="arrangement-head">
                  <div>
                    <h3>
                      {o.area} <ArrowRight size={16} /> {o.campus}
                    </h3>
                    <p>
                      {timeLabel(o.time)} · {o.pickup}
                    </p>
                  </div>
                  <Badge status={o.status} />
                </div>
                {!o.eligible && (
                  <div className="error-banner">
                    Driver approval needs attention. New requests and approvals
                    are blocked.
                  </div>
                )}
                <div className="capacity-grid">
                  {o.days.map((d: string) => (
                    <div key={d}>
                      <span>{d}</span>
                      <strong>
                        {o.availability[d]}
                        <small> / {o.seats}</small>
                      </strong>
                      <small>seats available</small>
                    </div>
                  ))}
                </div>
                {data.requests
                  .filter((r) => r.offerId === o.id && r.status === "accepted")
                  .map((r) => (
                    <details className="dates-details" key={r.id}>
                      <summary>
                        <span>
                          {person(r.riderId)?.name} · {r.days.join(", ")}
                        </span>
                        <Badge status="accepted" />
                      </summary>
                      {requestDates(r, o, new Date(data.serverTime))
                        .slice(0, 6)
                        .map((date) => (
                          <div className="date-row" key={date}>
                            <div>
                              <strong>{dateLabel(date)}</strong>
                              <small>
                                {o.dateAvailability?.[date] ?? 0} seats open on
                                this date
                              </small>
                            </div>
                            <Badge status={occurrenceStatus(r, o, date)} />
                            <select
                              aria-label={`Manage ${person(r.riderId)?.name} on ${date}`}
                              value=""
                              disabled={busy}
                              onChange={(e) => {
                                if (e.target.value === "rehearse") {
                                  act(
                                    {
                                      type: "demoClock",
                                      requestId: r.id,
                                      date,
                                    },
                                    "Rehearsal clock moved to this departure. No real ride is taking place.",
                                  );
                                } else if (e.target.value === "canceled")
                                  setConfirm({
                                    title: "Cancel this departure?",
                                    detail: `All riders on ${dateLabel(date)} will see this departure as canceled. Other dates stay scheduled.`,
                                    command: {
                                      type: "occurrence",
                                      requestId: r.id,
                                      date,
                                      status: "canceled",
                                    },
                                  });
                                else
                                  act(
                                    {
                                      type: "occurrence",
                                      requestId: r.id,
                                      date,
                                      status: e.target.value,
                                    },
                                    "Attendance saved for this date.",
                                  );
                              }}
                            >
                              <option value="" disabled>
                                Manage date
                              </option>
                              <option value="rehearse">
                                Rehearse this ride day
                              </option>
                              <option value="checked_in">Check in</option>
                              <option value="completed">Mark completed</option>
                              <option value="reported_no_show">
                                Report rider no-show
                              </option>
                              <option value="canceled">Cancel departure</option>
                            </select>
                          </div>
                        ))}
                    </details>
                  ))}
                {o.status !== "canceled" && (
                  <div className="arrangement-footer">
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() =>
                        act(
                          {
                            type: "offerStatus",
                            offerId: o.id,
                            status: o.status === "paused" ? "active" : "paused",
                          },
                          o.status === "paused"
                            ? "Your offer is open again."
                            : "New requests paused. Confirmed rides are unchanged.",
                        )
                      }
                    >
                      {o.status === "paused"
                        ? "Resume new requests"
                        : "Pause new requests"}
                    </button>
                    <button
                      className="text-button danger"
                      onClick={() =>
                        setConfirm({
                          title: "Cancel this entire ride series?",
                          detail:
                            "All pending requests and future confirmed arrangements on this offer will be canceled.",
                          command: {
                            type: "offerStatus",
                            offerId: o.id,
                            status: "canceled",
                          },
                        })
                      }
                    >
                      Cancel series
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        ))}
      {commuteTab === "requests" &&
        (incoming.length ? (
          <div className="stack">
            {incoming.map((r) => {
              const o = data.offers.find((o) => o.id === r.offerId);
              return (
                <article className="panel request-card" key={r.id}>
                  <div className="person-line">
                    <Avatar person={person(r.riderId)} />
                    <div>
                      <h3>{person(r.riderId)?.name}</h3>
                      <p>
                        {o.area} → {o.campus} · {timeLabel(o.time)}
                      </p>
                    </div>
                  </div>
                  <Days value={r.days} />
                  <p>
                    One recurring seat. Capacity is checked again when you
                    accept.
                  </p>
                  <div className="button-row">
                    <button
                      className="primary"
                      disabled={busy}
                      onClick={() =>
                        act(
                          {
                            type: "decide",
                            requestId: r.id,
                            status: "accepted",
                          },
                          "Seat confirmed. Both schedules are updated.",
                        )
                      }
                    >
                      <Check size={16} />
                      Accept request
                    </button>
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() =>
                        act(
                          {
                            type: "decide",
                            requestId: r.id,
                            status: "rejected",
                          },
                          "Request declined.",
                        )
                      }
                    >
                      Decline
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <Empty
            title="You’re all caught up"
            detail="New seat requests for your offers will appear here. As a demo, switch to Maya to request Alex’s ride."
          />
        ))}
    </>
  );
}
