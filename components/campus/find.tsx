"use client";
import {
  ArrowRight,
  Search,
  CalendarDays,
  ShieldCheck,
  MapPin,
  Clock3,
  Users,
  Check,
  LoaderCircle,
  GraduationCap,
  SlidersHorizontal,
} from "lucide-react";
import { DAYS, AREAS, CAMPUSES } from "@/lib/commutes.mjs";
import {
  timeLabel,
  Avatar,
  Days,
  Field,
  Empty,
  CampusArt,
} from "@/components/campus/shared";
import { useCampus } from "@/components/campus/state";
export function FindRide() {
  const {
    data,
    filters,
    setFilters,
    matches,
    searching,
    searched,
    setBooking,
    setBookingDays,
    person,
    find,
    nav,
    riding,
    confirmed,
  } = useCampus();
  if (!data) return null;
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="dot" />
            WEEKLY CAMPUS RIDES
          </span>
          <h1>
            A familiar face.
            <br />A better commute.
          </h1>
          <p>Choose your weekdays and find a recurring campus ride.</p>
        </div>
        <CampusArt />
      </section>
      <section className="search-panel" aria-label="Find your weekly ride">
        <div className="section-title">
          <h2>Find your weekly ride</h2>
          <span>All times Eastern</span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            find();
          }}
        >
          <div className="filter-grid">
            <Field label="LEAVING FROM">
              <div className="input-icon">
                <MapPin size={18} />
                <select
                  value={filters.area}
                  onChange={(e) =>
                    setFilters({ ...filters, area: e.target.value })
                  }
                >
                  {AREAS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
            </Field>
            <Field label="HEADING TO">
              <div className="input-icon">
                <GraduationCap size={19} />
                <select
                  value={filters.campus}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      campus: e.target.value,
                    })
                  }
                >
                  {CAMPUSES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
            </Field>
            <Field label="DEPARTURE TIME">
              <div className="input-icon">
                <Clock3 size={18} />
                <input
                  aria-label="Preferred departure time"
                  required
                  type="time"
                  value={filters.time}
                  onChange={(e) =>
                    setFilters({ ...filters, time: e.target.value })
                  }
                />
              </div>
            </Field>
            <button
              className="primary search-button"
              disabled={searching || !filters.days.length}
            >
              {searching ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <Search size={18} />
              )}
              Find a ride
            </button>
          </div>
          <div className="days-row">
            <span>My commute days</span>
            <Days
              value={filters.days}
              onChange={(days) => setFilters({ ...filters, days })}
            />
            <small>
              <CalendarDays size={14} />
              Repeats every week
            </small>
          </div>
        </form>
      </section>
      <div className="results-layout">
        <section className="results">
          <div className="results-title">
            <div>
              <h2>
                People going your way{" "}
                <span className="result-count">{matches.length}</span>
              </h2>
              <p>Same neighborhood. Compatible days. Within 30 minutes.</p>
            </div>
            <span className="sort-label">
              <SlidersHorizontal size={14} />
              Best day match
            </span>
          </div>
          {searching && !searched ? (
            <div className="loading-state">
              <LoaderCircle className="spin" />
            </div>
          ) : matches.length ? (
            matches.map((o, index) => {
              const driver = person(o.driverId),
                app = data.applications.find((a) => a.profileId === o.driverId);
              const existing = riding.some(
                (r) =>
                  r.offerId === o.id &&
                  ["pending", "accepted"].includes(r.status),
              );
              return (
                <article className="ride-card" key={o.id}>
                  <div className="ride-card-top">
                    <div className="person-line">
                      <Avatar person={driver} />
                      <div>
                        <h3>{driver.name}</h3>
                        <span>
                          {app?.color} {app?.make} {app?.model}
                        </span>
                      </div>
                    </div>
                    {index === 0 && (
                      <span className="match-tag">
                        <Check size={13} />
                        {o.matchingDays.length} matching days
                      </span>
                    )}
                  </div>
                  <div className="route-line">
                    <div>
                      <span className="route-caption">
                        <span className="route-dot" />
                        PICKUP AREA
                      </span>
                      <strong>{o.area}</strong>
                      <small>{o.pickup.split(" · ")[0]}</small>
                    </div>
                    <span className="route-connector">
                      <span />
                      <ArrowRight size={18} />
                    </span>
                    <div>
                      <span className="route-caption">
                        <MapPin size={11} />
                        DESTINATION
                      </span>
                      <strong>
                        GSU ·{" "}
                        {o.campus === "Atlanta campus"
                          ? "Atlanta"
                          : o.campus.split(" · ")[1]}
                      </strong>
                      <small>{o.campus}</small>
                    </div>
                    <div className="departure">
                      <strong>{timeLabel(o.time)}</strong>
                      <small>Departure</small>
                    </div>
                  </div>
                  <div className="ride-meta">
                    <Days value={o.days} />
                    <span>
                      <Users size={15} />
                      {Math.min(
                        ...o.matchingDays.map((d: string) => o.availability[d]),
                      )}{" "}
                      seats on matching days
                    </span>
                  </div>
                  <div className="ride-footer">
                    <span>
                      <ShieldCheck size={15} />
                      Vehicle evidence reviewed{" "}
                      <span className="sample-label">DEMO</span>
                    </span>
                    <button
                      className="ride-action"
                      onClick={() => {
                        setBooking(o);
                        setBookingDays(o.matchingDays);
                      }}
                    >
                      {existing ? "View request options" : "Request a seat"}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <Empty
              title="No rides for this routine yet"
              detail="Try another neighborhood, departure time, or weekday. We only show real schedule matches."
              action={
                <button
                  className="secondary"
                  onClick={() =>
                    setFilters({
                      campus: CAMPUSES[0],
                      area: "Decatur",
                      time: "08:00",
                      days: ["Mon", "Wed", "Fri"],
                    })
                  }
                >
                  Try the demo route
                </button>
              }
            />
          )}
          <p className="results-note">
            <MapPin size={14} />
            Pickup is a shared public place. No home addresses are shown.
          </p>
        </section>
        <aside className="right-rail">
          <section className="week-card">
            <div className="section-title">
              <span className="icon-tile">
                <CalendarDays size={20} />
              </span>
              <span className="small-cap">YOUR ROUTINE</span>
            </div>
            <h3>
              {confirmed.length
                ? "Your confirmed days"
                : "Your weekly schedule"}
            </h3>
            <div className="week-strip">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className={
                    confirmed.some((r) => r.days.includes(d)) ? "filled" : ""
                  }
                >
                  <span>{d[0]}</span>
                  <i>
                    {confirmed.some((r) => r.days.includes(d)) ? (
                      <Check size={13} />
                    ) : (
                      <span />
                    )}
                  </i>
                </div>
              ))}
            </div>
            <p>
              {confirmed.length
                ? "Your confirmed commute days, all in one place."
                : "Once a driver accepts, your weekly rides will show up here."}
            </p>
            <button onClick={() => nav("commutes")}>
              View my commutes
              <ArrowRight size={16} />
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}
