"use client";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { Search, CalendarDays, Car, ShieldCheck, FileText } from "lucide-react";
import { CAMPUSES, requestDates, departureInstant } from "@/lib/commutes.mjs";
import type { Data, Page } from "@/components/campus/types";
import { createContext, useContext } from "react";
function useController() {
  const [page, setPage] = useState<Page>("find"),
    [actor, setActor] = useState("maya"),
    [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false),
    [toast, setToast] = useState(""),
    [mobile, setMobile] = useState(false);
  const [filters, setFilters] = useState({
      campus: CAMPUSES[0],
      area: "Decatur",
      time: "08:00",
      days: ["Mon", "Wed", "Fri"],
    }),
    [matches, setMatches] = useState<any[]>([]),
    [searching, setSearching] = useState(false),
    [searched, setSearched] = useState(false);
  const [booking, setBooking] = useState<any>(null),
    [bookingDays, setBookingDays] = useState<string[]>([]),
    [confirm, setConfirm] = useState<{
      title: string;
      detail: string;
      command: any;
      label?: string;
    } | null>(null),
    [help, setHelp] = useState(false),
    [report, setReport] = useState<any>(null),
    [reportNote, setReportNote] = useState("");
  const [commuteTab, setCommuteTab] = useState("riding"),
    [identity, setIdentity] = useState<any>(null),
    [wallet, setWallet] = useState("apple"),
    [review, setReview] = useState<any>(null),
    [reviewReason, setReviewReason] = useState(""),
    [reviewStatus, setReviewStatus] = useState("approved");
  const [offer, setOffer] = useState({
    campus: CAMPUSES[0],
    area: "Decatur",
    time: "08:00",
    days: ["Mon", "Wed", "Fri"],
    seats: 1,
    pickup: "",
  });
  const [application, setApplication] = useState({
      make: "",
      model: "",
      color: "",
      plate: "",
      seats: 2,
      insuranceExpiry: "",
      registration: "",
      insurance: "",
    }),
    [files, setFiles] = useState<Record<string, string>>({}),
    [name, setName] = useState("");
  const searchSeq = useRef(0);
  const activeActor = useRef(actor);
  activeActor.current = actor;
  const person = (id: string) => data?.profiles.find((p) => p.id === id);
  const me = data?.profiles.find((p) => p.id === actor),
    myApplication = data?.applications.find((a) => a.profileId === actor);
  const notify = (message: string) => {
    setToast(message);
  };
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 6500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const api = useCallback(
    async (path: string, options?: RequestInit) => {
      const response = await fetch(
        `/api/${path}${path.includes("?") ? "&" : "?"}actor=${actor}`,
        {
          ...options,
          headers: {
            ...(options?.body instanceof FormData
              ? {}
              : { "Content-Type": "application/json" }),
            ...options?.headers,
          },
        },
      );
      const result: any = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to connect. Please try again.");
      return result;
    },
    [actor],
  );
  const refresh = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const next = await api("state");
        if (activeActor.current !== next.actorId) return;
        setData((previous) =>
          previous &&
          previous.actorId === next.actorId &&
          previous.revision > next.revision
            ? previous
            : next,
        );
        setError("");
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );
  useEffect(() => {
    searchSeq.current++;
    setData(null);
    setMatches([]);
    setSearched(false);
    refresh();
    setApplication({
      make: "",
      model: "",
      color: "",
      plate: "",
      seats: 2,
      insuranceExpiry: "",
      registration: "",
      insurance: "",
    });
    setFiles({});
    setIdentity(null);
  }, [refresh]);
  useEffect(() => {
    const timer = setInterval(() => refresh(true), 20000);
    const focus = () => refresh(true);
    window.addEventListener("focus", focus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [refresh]);
  const find = useCallback(async () => {
    const seq = ++searchSeq.current;
    setSearching(true);
    try {
      const params = new URLSearchParams({
        campus: filters.campus,
        area: filters.area,
        time: filters.time,
        days: filters.days.join(","),
      });
      const rides = await api("search?" + params);
      if (seq === searchSeq.current && activeActor.current === actor) {
        setMatches(rides);
        setSearched(true);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (seq === searchSeq.current) setSearching(false);
    }
  }, [api, filters]);
  useEffect(() => {
    if (data && page === "find") {
      const t = setTimeout(find, 180);
      return () => clearTimeout(t);
    }
  }, [find, !!data, page, data?.serverTime]);
  useEffect(() => {
    if (page === "profile" && data) {
      setName(me?.name || "");
      api("identity")
        .then(setIdentity)
        .catch(() =>
          setIdentity({
            available: false,
            reason: "Verification service is unavailable.",
          }),
        );
    }
  }, [page, actor, !!data]);
  async function act(command: any, message: string) {
    if (busy) return false;
    setBusy(true);
    setError("");
    try {
      const next = await api("actions", {
        method: "POST",
        body: JSON.stringify(command),
      });
      setData((previous) =>
        previous &&
        previous.actorId === next.actorId &&
        previous.revision > next.revision
          ? previous
          : next,
      );
      notify(message);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function upload(kind: string, file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await api("documents", { method: "POST", body: form });
      setApplication((a) => ({ ...a, [kind]: result.id }));
      setFiles((f) => ({ ...f, [kind]: result.name }));
      notify("Document saved privately.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    setBusy(true);
    try {
      if (!window.isSecureContext || !("DigitalCredential" in window))
        throw new Error(
          "This browser does not support digital credentials. Try a supported browser and wallet.",
        );
      const start = await api("identity", {
        method: "POST",
        body: JSON.stringify({ action: "start", flow: wallet }),
      });
      const credential: any = await navigator.credentials.get({
        digital: { requests: [{ protocol: start.protocol, data: start.data }] },
        mediation: "required",
      } as any);
      if (!credential?.data)
        throw new Error("Verification canceled. No status was changed.");
      const result = await api("identity", {
        method: "POST",
        body: JSON.stringify({
          action: "finish",
          sessionId: start.sessionId,
          data: credential.data,
        }),
      });
      notify(result.message);
      await refresh(true);
    } catch (e) {
      setError(
        (e as Error).name === "NotAllowedError"
          ? "Verification canceled. No status was changed."
          : (e as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  const nav = (p: Page) => {
    setPage(p);
    setMobile(false);
    setError("");
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const incoming =
    data?.requests.filter(
      (r) =>
        r.status === "pending" &&
        data.offers.find((o) => o.id === r.offerId)?.driverId === actor,
    ) || [];
  const riding = data?.requests.filter((r) => r.riderId === actor) || [];
  const confirmed = riding.filter((r) => r.status === "accepted");
  const driving = data?.offers.filter((o) => o.driverId === actor) || [];
  const upcoming = confirmed
    .flatMap((r) => {
      const o = data!.offers.find((o) => o.id === r.offerId);
      return requestDates(r, o, new Date(data!.serverTime)).map((date) => ({
        r,
        o,
        date,
        at: departureInstant(date, o.time),
      }));
    })
    .filter((x) => Date.parse(x.at) > Date.parse(data!.serverTime))
    .sort((a, b) => a.at.localeCompare(b.at));
  function occurrenceStatus(r: any, o: any, date: string) {
    if (o.status === "canceled") return "canceled";
    if (!o.eligible) return "Driver approval needs attention";
    const exceptions = data!.exceptions.filter(
      (e) =>
        e.date === date &&
        (e.requestId === r.id ||
          (e.offerId === o.id &&
            e.actorId === o.driverId &&
            e.status === "canceled")),
    );
    if (exceptions.some((e) => e.status === "canceled")) return "canceled";
    const own = exceptions.find((e) => e.actorId === actor);
    return own?.status || "scheduled";
  }
  const navItems: any[] = [
    ["find", Search, "Find a ride"],
    ["commutes", CalendarDays, "My commutes"],
    ["offer", Car, "Offer a ride"],
    ["profile", ShieldCheck, "Profile & checks"],
  ];
  if (me?.role === "admin")
    navItems.push(["review", FileText, "Review center"]);

  return {
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
    filters,
    setFilters,
    matches,
    searching,
    searched,
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
    commuteTab,
    setCommuteTab,
    identity,
    wallet,
    setWallet,
    review,
    setReview,
    reviewReason,
    setReviewReason,
    reviewStatus,
    setReviewStatus,
    offer,
    setOffer,
    application,
    setApplication,
    files,
    name,
    setName,
    person,
    me,
    myApplication,
    api,
    refresh,
    find,
    act,
    upload,
    verify,
    nav,
    incoming,
    riding,
    confirmed,
    driving,
    upcoming,
    occurrenceStatus,
    navItems,
  };
}
type CampusState = ReturnType<typeof useController>;
const CampusContext = createContext<CampusState | null>(null);
export function CampusProvider({ children }: { children: ReactNode }) {
  const state = useController();
  return (
    <CampusContext.Provider value={state}>{children}</CampusContext.Provider>
  );
}
export function useCampus() {
  const state = useContext(CampusContext);
  if (!state) throw new Error("CampusProvider is required.");
  return state;
}
