import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  state: text("state").notNull(),
  revision: integer("revision").notNull().default(0),
});
export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  workspace: text("workspace").notNull(),
  actor: text("actor").notNull(),
  name: text("name").notNull(),
  mime: text("mime").notNull(),
  createdAt: text("created_at").notNull(),
});
export const verificationSessions = sqliteTable("verification_sessions", {
  id: text("id").primaryKey(),
  workspace: text("workspace").notNull(),
  actor: text("actor").notNull(),
  token: text("token").notNull(),
  flow: text("flow").notNull(),
  expires: integer("expires").notNull(),
});
