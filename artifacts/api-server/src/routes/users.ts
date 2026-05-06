import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, usersTable, betsTable } from "@workspace/db";
import {
  CreateUserBody,
  GetUserParams,
  GetUserPortfolioParams,
  GetLeaderboardResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.username);
  res.json(users.map(formatUser));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    username: parsed.data.username,
    avatarUrl: parsed.data.avatarUrl,
  }).returning();

  res.status(201).json(formatUser(user));
});

router.get("/users/:userId", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

router.get("/users/:userId/portfolio", async (req, res): Promise<void> => {
  const params = GetUserPortfolioParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const positions = await db.select().from(betsTable).where(eq(betsTable.userId, params.data.userId)).orderBy(desc(betsTable.createdAt));

  const totalInvested = positions.reduce((sum, b) => sum + Number(b.amount), 0);
  const wonBets = positions.filter(b => b.status === "won");
  const totalPayout = wonBets.reduce((sum, b) => sum + (b.payout ? Number(b.payout) : 0), 0);
  const netPnl = totalPayout - totalInvested;
  const resolvedBets = positions.filter(b => b.status !== "pending");
  const winRate = resolvedBets.length > 0 ? wonBets.length / resolvedBets.length : 0;

  res.json({
    user: formatUser(user),
    totalInvested,
    totalPayout,
    netPnl,
    winRate,
    positions: positions.map(b => ({
      id: b.id,
      marketId: b.marketId,
      userId: b.userId,
      position: b.position,
      amount: Number(b.amount),
      price: Number(b.price),
      payout: b.payout != null ? Number(b.payout) : null,
      status: b.status,
      createdAt: b.createdAt.toISOString(),
    })),
  });
});

router.get("/leaderboard", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.balance)).limit(20);

  const leaderboard = await Promise.all(users.map(async (user, idx) => {
    const bets = await db.select().from(betsTable).where(eq(betsTable.userId, user.id));
    const totalInvested = bets.reduce((sum, b) => sum + Number(b.amount), 0);
    const wonBets = bets.filter(b => b.status === "won");
    const totalPayout = wonBets.reduce((sum, b) => sum + (b.payout ? Number(b.payout) : 0), 0);
    const netPnl = totalPayout - totalInvested;
    const resolvedBets = bets.filter(b => b.status !== "pending");
    const winRate = resolvedBets.length > 0 ? wonBets.length / resolvedBets.length : 0;

    return {
      rank: idx + 1,
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl ?? null,
      netPnl,
      totalBets: user.totalBets,
      winRate,
      balance: Number(user.balance),
    };
  }));

  res.json(GetLeaderboardResponse.parse(leaderboard));
});

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    username: u.username,
    avatarUrl: u.avatarUrl ?? null,
    balance: Number(u.balance),
    totalBets: u.totalBets,
    totalWins: u.totalWins,
    createdAt: u.createdAt.toISOString(),
  };
}

export default router;
