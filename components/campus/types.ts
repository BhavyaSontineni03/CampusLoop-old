export type Data = {
  profiles: any[];
  actorId: string;
  applications: any[];
  offers: any[];
  requests: any[];
  exceptions: any[];
  reports: any[];
  audit: any[];
  today: string;
  serverTime: string;
  demoTime?: string;
  canUndoReset?: boolean;
  revision: number;
  demo: boolean;
};
export type Page = "find" | "commutes" | "offer" | "profile" | "review";
