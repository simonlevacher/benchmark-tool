import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "./schema";

if (!process.env.POSTGRES_URL) {
  console.warn(
    "[DB] POSTGRES_URL not configured. Database features will not work. " +
      "Set up Vercel Postgres in your Vercel dashboard: Storage → Create Database → Postgres"
  );
}

export const db = drizzle(sql, { schema });

export type Report = typeof schema.reports.$inferSelect;
export type NewReport = typeof schema.reports.$inferInsert;
