"use client";
import {
  ArrowRight,
  Car,
  ShieldCheck,
  LoaderCircle,
  GraduationCap,
  LockKeyhole,
} from "lucide-react";
import { Badge, Avatar, Field } from "@/components/campus/shared";
import { useCampus } from "@/components/campus/state";
export function Profile() {
  const {
    data,
    busy,
    identity,
    wallet,
    setWallet,
    application,
    setApplication,
    files,
    name,
    setName,
    me,
    myApplication,
    act,
    upload,
    verify,
  } = useCampus();
  if (!data) return null;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Profile & checks</h1>
          <p>Know what’s been checked, and what each check means.</p>
        </div>
      </div>
      <div className="profile-layout">
        <div className="stack">
          <section className="panel form-panel">
            <div className="person-line">
              <Avatar person={me} />
              <div>
                <h2>{me.name}</h2>
                <p>{me.email}</p>
              </div>
            </div>
            <form
              className="inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                act({ type: "profile", name }, "Your profile was updated.");
              }}
            >
              <Field label="Display name">
                <input
                  required
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <button className="secondary" disabled={busy}>
                Save
              </button>
            </form>
          </section>
          <section className="panel form-panel">
            <div className="section-title">
              <h2>Driver application</h2>
              {myApplication && <Badge status={myApplication.status} />}
            </div>
            {myApplication && (
              <div className="application-summary">
                <h3>
                  {myApplication.make} {myApplication.model} ·{" "}
                  {myApplication.color}
                </h3>
                <p>
                  {myApplication.seats} passenger seats · Insurance evidence
                  expires {myApplication.insuranceExpiry}
                </p>
                <p>
                  {myApplication.reason ||
                    "Your evidence is awaiting reviewer approval."}
                </p>
                {myApplication.sample && (
                  <small>
                    Seeded fictional vehicle and evidence for the interview
                    demo.
                  </small>
                )}
              </div>
            )}
            {!myApplication ||
            ["rejected", "needs_changes"].includes(myApplication.status) ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await act(
                    { type: "application", ...application },
                    "Application submitted. A reviewer can now check your evidence.",
                  );
                }}
              >
                <p>
                  Documents are private to you and the reviewer. Use sample
                  documents in this demo.
                </p>
                <div className="form-grid">
                  <Field label="Vehicle make">
                    <input
                      required
                      maxLength={40}
                      placeholder="Toyota"
                      value={application.make}
                      onChange={(e) =>
                        setApplication({
                          ...application,
                          make: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Model">
                    <input
                      required
                      maxLength={40}
                      placeholder="Corolla"
                      value={application.model}
                      onChange={(e) =>
                        setApplication({
                          ...application,
                          model: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Color">
                    <input
                      required
                      maxLength={30}
                      placeholder="Silver"
                      value={application.color}
                      onChange={(e) =>
                        setApplication({
                          ...application,
                          color: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="License plate · private">
                    <input
                      required
                      maxLength={20}
                      value={application.plate}
                      onChange={(e) =>
                        setApplication({
                          ...application,
                          plate: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Passenger seats">
                    <input
                      required
                      type="number"
                      min="1"
                      max="7"
                      value={application.seats}
                      onChange={(e) =>
                        setApplication({
                          ...application,
                          seats: Number(e.target.value),
                        })
                      }
                    />
                  </Field>
                  <Field label="Insurance expiry">
                    <input
                      required
                      type="date"
                      min={data.today}
                      value={application.insuranceExpiry}
                      onChange={(e) =>
                        setApplication({
                          ...application,
                          insuranceExpiry: e.target.value,
                        })
                      }
                    />
                  </Field>
                </div>
                {["registration", "insurance"].map((kind) => (
                  <Field
                    key={kind}
                    label={`${kind === "registration" ? "Vehicle registration" : "Insurance evidence"} · private`}
                    hint={files[kind] || "PDF, JPG, or PNG · up to 5 MB"}
                  >
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      disabled={busy}
                      onChange={(e) => upload(kind, e.target.files?.[0])}
                    />
                  </Field>
                ))}
                <button
                  className="primary"
                  disabled={
                    busy || !application.registration || !application.insurance
                  }
                >
                  Submit for review
                  <ArrowRight size={17} />
                </button>
              </form>
            ) : (
              <div className="soft-notice">
                <ShieldCheck size={18} />
                Document review does not confirm DMV records, insurance
                coverage, or driving entitlement.
              </div>
            )}
          </section>
        </div>
        <aside className="stack">
          <section className="panel checks">
            <h2>Your checks, clearly explained</h2>
            <div className="check-row">
              <span className="check-icon">
                <GraduationCap size={20} />
              </span>
              <div>
                <h3>Campus mailbox</h3>
                <Badge>Seeded demo account</Badge>
                <p>
                  Mailbox verification is simulated for this fictional account.
                  It is not proof of enrollment.
                </p>
              </div>
            </div>
            <div className="check-row">
              <span className="check-icon">
                <ShieldCheck size={20} />
              </span>
              <div>
                <h3>Digital credential</h3>
                <Badge
                  status={
                    me.identity === "credential_verified" ? "accepted" : ""
                  }
                >
                  {me.identity === "credential_verified"
                    ? "Credential checked"
                    : "Not verified"}
                </Badge>
                <p>Credence ID · Age Check Profile 2.0</p>
                <p>
                  {identity?.reason || "Checking verification availability…"}
                </p>
                <select
                  aria-label="Wallet type"
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                >
                  <option value="apple">Apple Wallet</option>
                  <option value="google">Google Wallet</option>
                </select>
                <button
                  className="secondary"
                  disabled={busy || !identity?.available}
                  onClick={verify}
                >
                  {busy ? (
                    <LoaderCircle size={15} className="spin" />
                  ) : (
                    <LockKeyhole size={15} />
                  )}
                  Verify with Credence
                </button>
              </div>
            </div>
            <div className="check-row">
              <span className="check-icon">
                <Car size={20} />
              </span>
              <div>
                <h3>Driving entitlement</h3>
                <Badge>Not checked</Badge>
                <p>
                  An identity or age credential does not establish a valid
                  license, driving history, or fitness to drive.
                </p>
              </div>
            </div>
          </section>
          <p className="privacy-note">
            <LockKeyhole size={16} />
            Government ID numbers and raw wallet claims are not retained by
            CampusLoop.
          </p>
        </aside>
      </div>
    </>
  );
}
