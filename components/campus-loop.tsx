"use client";
import {
  ArrowUpRight,
  CalendarDays,
  X,
  CircleHelp,
  RefreshCw,
  LoaderCircle,
  AlertCircle,
  Menu,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";
import { Avatar } from "@/components/campus/shared";
import { useCampus } from "@/components/campus/state";
import { CampusProvider } from "./campus/state";
import { CampusDialogs } from "./campus/dialogs";
import { FindRide } from "./campus/find";
import { MyCommutes } from "./campus/commutes";
import { OfferRide } from "./campus/offer";
import { Profile } from "./campus/profile";
import { ReviewCenter } from "./campus/review";
function CampusShell() {
  const {
    page,
    setPage,
    actor,
    setActor,
    data,
    error,
    setError,
    busy,
    loading,
    toast,
    setToast,
    mobile,
    setMobile,
    setHelp,
    setCommuteTab,
    me,
    refresh,
    act,
    nav,
    incoming,
    navItems,
  } = useCampus();
  return (
    <div className="app-shell">
      <aside
        id="campus-navigation"
        className={`sidebar ${mobile ? "mobile-open" : ""}`}
      >
        <a className="brand" href="/" aria-label="CampusLoop home">
          <span className="brand-mark">
            <ArrowUpRight />
          </span>
          campusloop<span className="brand-dot">.</span>
        </a>
        <div className="campus-switch">
          <span className="campus-icon">
            <GraduationCap size={21} />
          </span>
          <div>
            <strong>Georgia State</strong>
            <small>Atlanta, Georgia</small>
          </div>
        </div>
        <nav>
          {navItems.map(([id, Icon, label]) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => nav(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === "commutes" && incoming.length > 0 && (
                <b className="count">{incoming.length}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className="help-link"
            onClick={() => refresh()}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? "spin" : ""} />
            Refresh saved state
          </button>
          <button className="help-link" onClick={() => setHelp(true)}>
            <CircleHelp size={18} />
            How CampusLoop works
            <ArrowUpRight size={15} />
          </button>
          <div className="sidebar-user">
            <Avatar person={me} small />
            <div>
              <strong>{me?.name || "Loading…"}</strong>
              <small>
                Demo {me?.role === "admin" ? "reviewer" : "student"}
              </small>
            </div>
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-shell">
        <div className="demo-bar">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            aria-expanded={mobile}
            aria-controls="campus-navigation"
            onClick={() => setMobile(!mobile)}
          >
            <Menu size={20} />
          </button>
          <span>
            <span className="demo-label">DEMO</span>
            <span className="demo-copy">
              Fictional accounts · Changes are saved.
            </span>
          </span>
          <label>
            <select
              aria-label="Demo account"
              value={actor}
              disabled={busy}
              onChange={(e) => {
                setActor(e.target.value);
                setPage(e.target.value === "admin" ? "review" : "find");
                setCommuteTab("riding");
              }}
            >
              <option value="maya">Maya · rider</option>
              <option value="alex">Alex · driver</option>
              <option value="jordan">Jordan · driver</option>
              <option value="admin">Campus reviewer</option>
            </select>
          </label>
        </div>
        <main className="content" id="main-content">
          {data?.demoTime && (
            <div className="rehearsal-banner">
              <CalendarDays size={17} />
              <span>
                Rehearsal clock ·{" "}
                {new Date(data.demoTime).toLocaleString("en-US", {
                  timeZone: "America/New_York",
                })}{" "}
                ET. Attendance here is demo data.
              </span>
              <button
                disabled={busy}
                onClick={() =>
                  act(
                    { type: "demoClock", reset: true },
                    "Returned to the real date and time.",
                  )
                }
              >
                Return to real time
              </button>
            </div>
          )}
          {error && (
            <div className="error-banner" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {!data ? (
            <div className="loading-state">
              <LoaderCircle className="spin" />
              <h3>Getting your campus ready…</h3>
              {error && (
                <button className="secondary" onClick={() => refresh()}>
                  Try again
                </button>
              )}
            </div>
          ) : (
            <>
              {page === "find" && <FindRide />}
              {page === "commutes" && <MyCommutes />}
              {page === "offer" && <OfferRide />}
              {page === "profile" && <Profile />}
              {page === "review" && me.role === "admin" && <ReviewCenter />}
            </>
          )}
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={20} />
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      <CampusDialogs />
    </div>
  );
}
export default function CampusLoop() {
  return (
    <CampusProvider>
      <CampusShell />
    </CampusProvider>
  );
}
