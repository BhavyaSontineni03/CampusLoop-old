"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X, Route } from "lucide-react";
import { DAYS } from "@/lib/commutes.mjs";
export const timeLabel = (v: string) =>
  new Date(`2000-01-01T${v}:00`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
export const dateLabel = (v: string) =>
  new Date(v + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
export const statusLabel = (s: string) =>
  ({
    accepted: "Confirmed",
    pending: "Awaiting approval",
    canceled: "Canceled",
    rejected: "Not accepted",
    needs_changes: "Changes requested",
    approved: "Approved",
    active: "Accepting requests",
    paused: "Paused",
    checked_in: "Checked in",
    reported_no_show: "No-show reported",
    credential_verified: "Credential checked",
  })[s] || s.replaceAll("_", " ");
export function Badge({
  status,
  children,
}: {
  status?: string;
  children?: ReactNode;
}) {
  return (
    <span className={`badge ${status || ""}`}>
      {children || statusLabel(status || "")}
    </span>
  );
}
export function Avatar({
  person,
  small = false,
}: {
  person: any;
  small?: boolean;
}) {
  return (
    <span
      className={`avatar ${person?.color || "green"} ${small ? "small" : ""}`}
    >
      {person?.initials || "CL"}
    </span>
  );
}
export function Days({
  value,
  onChange,
  allowed = DAYS,
}: {
  value: string[];
  onChange?: (v: string[]) => void;
  allowed?: string[];
}) {
  return (
    <div className="days" aria-label="Weekdays">
      {DAYS.map((d) =>
        onChange ? (
          <button
            type="button"
            aria-label={d}
            aria-pressed={value.includes(d)}
            disabled={!allowed.includes(d)}
            className={value.includes(d) ? "selected" : ""}
            key={d}
            onClick={() =>
              onChange(
                value.includes(d)
                  ? value.filter((x) => x !== d)
                  : DAYS.filter((x) => [...value, d].includes(x)),
              )
            }
          >
            {d}
          </button>
        ) : (
          <span className={value.includes(d) ? "selected" : ""} key={d}>
            {d}
          </span>
        ),
      )}
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Empty({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Route size={27} />
      </span>
      <h3>{title}</h3>
      <p>{detail}</p>
      {action}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function CampusArt() {
  return (
    <svg
      className="campus-art"
      viewBox="0 0 500 260"
      role="img"
      aria-label="Illustration of a car following a leafy route to campus"
    >
      <defs>
        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="#bbd0bd" strokeWidth=".5" />
        </pattern>
      </defs>
      <rect width="500" height="260" fill="url(#grid)" />
      <circle cx="386" cy="78" r="51" fill="#ecf0b9" />
      <path
        d="M-20 207H142Q197 207 197 159V121Q197 81 242 81H510"
        fill="none"
        stroke="#bbd0bb"
        strokeWidth="39"
      />
      <path
        d="M-20 207H142Q197 207 197 159V121Q197 81 242 81H510"
        fill="none"
        stroke="#f5f8ed"
        strokeWidth="32"
      />
      <path
        d="M-20 207H142Q197 207 197 159V121Q197 81 242 81H510"
        fill="none"
        stroke="#9db49d"
        strokeWidth="1.5"
        strokeDasharray="7 7"
      />
      <g transform="translate(308 120)">
        <rect x="0" y="28" width="139" height="69" rx="2" fill="#f7f4e9" />
        <path d="M-9 28 70-7 149 28Z" fill="#547864" />
        <path d="M9 28 70 2 131 28Z" fill="#dce5cb" />
        <path
          d="M16 44H29V85H16ZM49 44H62V85H49ZM82 44H95V85H82ZM115 44H128V85H115Z"
          fill="#aec3a5"
        />
        <path d="M-6 98H145M-12 105H151" stroke="#547864" strokeWidth="6" />
        <rect x="62" y="-40" width="3" height="37" fill="#547864" />
        <path d="M65-40H98L89-29 98-19H65Z" fill="#698653" />
        <text x="72" y="-25" fontSize="10" fill="white" fontFamily="sans-serif">
          GSU
        </text>
      </g>
      <g transform="translate(96 177)">
        <rect x="0" y="0" width="70" height="36" rx="12" fill="#245c49" />
        <path d="M18 4H47L56 15H10Z" fill="#c9dcba" />
        <path d="M33 4V15" stroke="#245c49" strokeWidth="3" />
        <circle cx="14" cy="34" r="7" fill="#244333" />
        <circle cx="56" cy="34" r="7" fill="#244333" />
        <rect x="1" y="21" width="8" height="6" rx="2" fill="#e3eda8" />
        <rect x="61" y="21" width="8" height="6" rx="2" fill="#e3eda8" />
      </g>
      {[
        [64, 105],
        [258, 188],
        [452, 34],
        [276, 35],
        [42, 152],
      ].map(([x, y], i) => (
        <g key={i}>
          <path d={`M${x} ${y}v23`} stroke="#799276" strokeWidth="3" />
          <ellipse
            cx={x}
            cy={y - 4}
            rx="13"
            ry="20"
            fill={i % 2 ? "#9eb886" : "#749978"}
          />
        </g>
      ))}
      <g transform="translate(201 11)">
        <rect width="108" height="33" rx="16" fill="#fff" />
        <circle cx="17" cy="16" r="5" fill="#719261" />
        <text
          x="29"
          y="21"
          fontSize="11"
          fontFamily="sans-serif"
          fill="#345641"
        >
          See you on campus
        </text>
      </g>
    </svg>
  );
}
