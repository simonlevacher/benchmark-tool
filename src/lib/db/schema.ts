import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  company_name: text("company_name").notNull(),
  report: jsonb("report").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
