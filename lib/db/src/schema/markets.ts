import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const marketsTable = pgTable("markets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("open"), // open | closed | resolved
  outcome: text("outcome"), // yes | no | null
  yesPrice: numeric("yes_price", { precision: 6, scale: 4 }).notNull().default("0.5000"),
  noPrice: numeric("no_price", { precision: 6, scale: 4 }).notNull().default("0.5000"),
  totalVolume: numeric("total_volume", { precision: 14, scale: 2 }).notNull().default("0.00"),
  betCount: integer("bet_count").notNull().default(0),
  creatorId: integer("creator_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
});

export const insertMarketSchema = createInsertSchema(marketsTable).omit({ id: true, createdAt: true, status: true, outcome: true, yesPrice: true, noPrice: true, totalVolume: true, betCount: true });
export type InsertMarket = z.infer<typeof insertMarketSchema>;
export type Market = typeof marketsTable.$inferSelect;
