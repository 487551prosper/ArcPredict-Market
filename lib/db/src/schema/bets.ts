import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { marketsTable } from "./markets";

export const betsTable = pgTable("bets", {
  id: serial("id").primaryKey(),
  marketId: integer("market_id").notNull().references(() => marketsTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  position: text("position").notNull(), // yes | no
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  price: numeric("price", { precision: 6, scale: 4 }).notNull(), // price at time of bet
  payout: numeric("payout", { precision: 12, scale: 2 }), // null until resolved
  status: text("status").notNull().default("pending"), // pending | won | lost
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBetSchema = createInsertSchema(betsTable).omit({ id: true, createdAt: true, payout: true, status: true });
export type InsertBet = z.infer<typeof insertBetSchema>;
export type Bet = typeof betsTable.$inferSelect;
