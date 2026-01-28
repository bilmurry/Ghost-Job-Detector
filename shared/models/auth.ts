import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, integer } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job analyses table for saving analysis history
export const analyses = pgTable(
  "analyses",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id),
    jobTitle: varchar("job_title").notNull(),
    company: varchar("company").notNull(),
    ghostScore: integer("ghost_score").notNull(),
    riskLevel: varchar("risk_level").notNull(),
    confidence: integer("confidence").notNull(),
    recommendation: varchar("recommendation", { length: 1000 }).notNull(),
    redFlagsCount: integer("red_flags_count").notNull(),
    jobPosting: jsonb("job_posting").notNull(),
    analysisResult: jsonb("analysis_result").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("IDX_analyses_user_id").on(table.userId)]
);

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertAnalysis = typeof analyses.$inferInsert;
export type Analysis = typeof analyses.$inferSelect;
