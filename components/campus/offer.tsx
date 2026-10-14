"use client";
import {
  ArrowRight,
  CalendarDays,
  Car,
  ShieldCheck,
  Plus,
  LoaderCircle,
} from "lucide-react";
import { AREAS, CAMPUSES } from "@/lib/commutes.mjs";
import { Badge, Days, Field } from "@/components/campus/shared";
import { useCampus } from "@/components/campus/state";
export function OfferRide() {
  const {
    setPage,
    data,
    busy,
    setCommuteTab,
    offer,
    setOffer,
    myApplication,
    act,
    nav,
  } = useCampus();
  if (!data) return null;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Offer a ride</h1>
          <p>Your usual journey could make someone else’s week.</p>
        </div>
        <span className="icon-tile">
          <Car size={25} />
        </span>
      </div>
      {myApplication?.status === "approved" &&
      myApplication.insuranceExpiry >= data.today ? (
        <div className="form-layout">
          <form
            className="panel form-panel"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await act(
                  { type: "offer", ...offer },
                  "Your weekly ride is now open for requests.",
                )
              ) {
                setPage("commutes");
                setCommuteTab("driving");
              }
            }}
          >
            <h2>Set your weekly route</h2>
            <p>One departure time. The days that work for you.</p>
            <div className="form-grid">
              <Field label="Pickup neighborhood">
                <select
                  value={offer.area}
                  onChange={(e) => setOffer({ ...offer, area: e.target.value })}
                >
                  {AREAS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Destination campus">
                <select
                  value={offer.campus}
                  onChange={(e) =>
                    setOffer({ ...offer, campus: e.target.value })
                  }
                >
                  {CAMPUSES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field
              label="Public meeting point"
              hint="Use a station, library, or another easy-to-find public place. Never a home address."
            >
              <input
                required
                maxLength={120}
                placeholder="e.g. Decatur MARTA · station entrance"
                value={offer.pickup}
                onChange={(e) => setOffer({ ...offer, pickup: e.target.value })}
              />
            </Field>
            <div className="form-grid">
              <Field label="Departure time · Eastern">
                <input
                  type="time"
                  required
                  value={offer.time}
                  onChange={(e) => setOffer({ ...offer, time: e.target.value })}
                />
              </Field>
              <Field label="Passenger seats">
                <input
                  type="number"
                  min="1"
                  max={myApplication.seats}
                  required
                  value={offer.seats}
                  onChange={(e) =>
                    setOffer({
                      ...offer,
                      seats: Number(e.target.value),
                    })
                  }
                />
              </Field>
            </div>
            <Field label="Your recurring weekdays">
              <Days
                value={offer.days}
                onChange={(days) => setOffer({ ...offer, days })}
              />
            </Field>
            <div className="soft-notice">
              <CalendarDays size={18} />
              This repeats weekly until you cancel. Holidays are not
              automatically excluded.
            </div>
            <button className="primary" disabled={busy || !offer.days.length}>
              {busy ? (
                <LoaderCircle size={17} className="spin" />
              ) : (
                <Plus size={17} />
              )}
              Publish weekly ride
            </button>
          </form>
          <aside>
            <section className="panel vehicle-summary">
              <span className="icon-tile">
                <Car />
              </span>
              <h3>
                {myApplication.make} {myApplication.model}
              </h3>
              <p>
                {myApplication.color} · {myApplication.seats} passenger seats
              </p>
              <Badge status="approved">Vehicle evidence reviewed</Badge>
              <hr />
              <p>
                You decide who joins. Requests stay pending until you accept.
              </p>
              <p>Need a day off? Cancel just that date in My commutes.</p>
            </section>
          </aside>
        </div>
      ) : (
        <div className="panel eligibility">
          <span className="icon-tile">
            <ShieldCheck size={28} />
          </span>
          <h2>First, let’s get your vehicle reviewed.</h2>
          <p>
            Tell us about your vehicle and submit registration and insurance
            evidence. A reviewer checks your application before you can publish.
          </p>
          {myApplication && (
            <>
              <Badge status={myApplication.status} />
              <p>{myApplication.reason}</p>
            </>
          )}
          <button className="primary" onClick={() => nav("profile")}>
            {myApplication ? "View my application" : "Start driver application"}
            <ArrowRight size={17} />
          </button>
        </div>
      )}
    </>
  );
}
