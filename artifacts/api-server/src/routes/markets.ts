import { Router, type IRouter } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
import { db, marketsTable, betsTable, usersTable } from "@workspace/db";
import {
  ListMarketsQueryParams,
  CreateMarketBody,
  GetMarketParams,
  ResolveMarketParams,
  ResolveMarketBody,
  PlaceBetParams,
  PlaceBetBody,
  GetMarketBetsParams,
  ListMarketsResponse,
  GetMarketStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/markets", async (req, res): Promise<void> => {
  const parsed = ListMarketsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { status, category, limit, offset } = parsed.data;

  const conditions = [];
  if (status) conditions.push(eq(marketsTable.status, status));
  if (category) conditions.push(eq(marketsTable.category, category));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [markets, totalResult] = await Promise.all([
    db.select().from(marketsTable).where(whereClause).orderBy(desc(marketsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(marketsTable).where(whereClause),
  ]);

  res.json(ListMarketsResponse.parse({ markets: markets.map(formatMarket), total: Number(totalResult[0].count) }));
});

router.post("/markets", async (req, res): Promise<void> => {
  const parsed = CreateMarketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [market] = await db.insert(marketsTable).values({
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    closesAt: new Date(parsed.data.closesAt),
    creatorId: parsed.data.creatorId,
  }).returning();

  res.status(201).json(formatMarket(market));
});

router.get("/markets/trending", async (_req, res): Promise<void> => {
  const markets = await db
    .select()
    .from(marketsTable)
    .where(eq(marketsTable.status, "open"))
    .orderBy(desc(marketsTable.totalVolume))
    .limit(5);

  res.json(markets.map(formatMarket));
});

router.get("/markets/stats", async (_req, res): Promise<void> => {
  const [
    totalMarketsResult,
    openMarketsResult,
    totalBetsResult,
    totalVolumeResult,
    totalUsersResult,
    categoryRows,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(marketsTable),
    db.select({ count: sql<number>`count(*)` }).from(marketsTable).where(eq(marketsTable.status, "open")),
    db.select({ count: sql<number>`count(*)` }).from(betsTable),
    db.select({ sum: sql<string>`coalesce(sum(amount), 0)` }).from(betsTable),
    db.select({ count: sql<number>`count(*)` }).from(usersTable),
    db.select({
      category: marketsTable.category,
      count: sql<number>`count(*)`,
      volume: sql<string>`coalesce(sum(${marketsTable.totalVolume}), 0)`,
    }).from(marketsTable).groupBy(marketsTable.category),
  ]);

  res.json(GetMarketStatsResponse.parse({
    totalMarkets: Number(totalMarketsResult[0].count),
    openMarkets: Number(openMarketsResult[0].count),
    totalBets: Number(totalBetsResult[0].count),
    totalVolume: Number(totalVolumeResult[0].sum),
    totalUsers: Number(totalUsersResult[0].count),
    categoryBreakdown: categoryRows.map(r => ({
      category: r.category,
      count: Number(r.count),
      volume: Number(r.volume),
    })),
  }));
});

router.get("/markets/:marketId", async (req, res): Promise<void> => {
  const params = GetMarketParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [market] = await db.select().from(marketsTable).where(eq(marketsTable.id, params.data.marketId));
  if (!market) {
    res.status(404).json({ error: "Market not found" });
    return;
  }

  const [recentBets, creator] = await Promise.all([
    db.select({
      id: betsTable.id,
      marketId: betsTable.marketId,
      userId: betsTable.userId,
      username: usersTable.username,
      position: betsTable.position,
      amount: betsTable.amount,
      price: betsTable.price,
      payout: betsTable.payout,
      status: betsTable.status,
      createdAt: betsTable.createdAt,
    }).from(betsTable).leftJoin(usersTable, eq(betsTable.userId, usersTable.id)).where(eq(betsTable.marketId, params.data.marketId)).orderBy(desc(betsTable.createdAt)).limit(10),
    db.select().from(usersTable).where(eq(usersTable.id, market.creatorId)).then(r => r[0]),
  ]);

  res.json({
    ...formatMarket(market),
    recentBets: recentBets.map(formatBet),
    creator: creator ? formatUser(creator) : null,
  });
});

router.post("/markets/:marketId/resolve", async (req, res): Promise<void> => {
  const params = ResolveMarketParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ResolveMarketBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { outcome } = body.data;

  const [market] = await db.update(marketsTable)
    .set({ status: "resolved", outcome })
    .where(eq(marketsTable.id, params.data.marketId))
    .returning();

  if (!market) {
    res.status(404).json({ error: "Market not found" });
    return;
  }

  const bets = await db.select().from(betsTable).where(eq(betsTable.marketId, params.data.marketId));
  for (const bet of bets) {
    const won = bet.position === outcome;
    const payout = won ? Number(bet.amount) / Number(bet.price) : 0;
    await db.update(betsTable)
      .set({ status: won ? "won" : "lost", payout: payout.toFixed(2) })
      .where(eq(betsTable.id, bet.id));
    if (won) {
      await db.update(usersTable)
        .set({ balance: sql`balance + ${payout.toFixed(2)}`, totalWins: sql`total_wins + 1` })
        .where(eq(usersTable.id, bet.userId));
    }
  }

  res.json(formatMarket(market));
});

router.get("/markets/:marketId/bets", async (req, res): Promise<void> => {
  const params = GetMarketBetsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const bets = await db.select({
    id: betsTable.id,
    marketId: betsTable.marketId,
    userId: betsTable.userId,
    username: usersTable.username,
    position: betsTable.position,
    amount: betsTable.amount,
    price: betsTable.price,
    payout: betsTable.payout,
    status: betsTable.status,
    createdAt: betsTable.createdAt,
  }).from(betsTable)
    .leftJoin(usersTable, eq(betsTable.userId, usersTable.id))
    .where(eq(betsTable.marketId, params.data.marketId))
    .orderBy(desc(betsTable.createdAt));

  res.json(bets.map(formatBet));
});

router.post("/markets/:marketId/bets", async (req, res): Promise<void> => {
  const params = PlaceBetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = PlaceBetBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { userId, position, amount } = body.data;
  const marketId = params.data.marketId;

  const [market] = await db.select().from(marketsTable).where(eq(marketsTable.id, marketId));
  if (!market || market.status !== "open") {
    res.status(400).json({ error: "Market is not open for betting" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || Number(user.balance) < amount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  const price = position === "yes" ? Number(market.yesPrice) : Number(market.noPrice);

  const [bet] = await db.insert(betsTable).values({
    marketId,
    userId,
    position,
    amount: amount.toFixed(2),
    price: price.toFixed(4),
  }).returning();

  await db.update(usersTable)
    .set({
      balance: sql`balance - ${amount.toFixed(2)}`,
      totalBets: sql`total_bets + 1`,
    })
    .where(eq(usersTable.id, userId));

  const newVolume = Number(market.totalVolume) + amount;
  const betCountNew = market.betCount + 1;

  let newYesPrice = Number(market.yesPrice);
  let newNoPrice = Number(market.noPrice);
  const delta = Math.min(amount / 1000, 0.05);
  if (position === "yes") {
    newYesPrice = Math.min(0.97, newYesPrice + delta);
    newNoPrice = Math.max(0.03, 1 - newYesPrice);
  } else {
    newNoPrice = Math.min(0.97, newNoPrice + delta);
    newYesPrice = Math.max(0.03, 1 - newNoPrice);
  }

  await db.update(marketsTable)
    .set({
      totalVolume: newVolume.toFixed(2),
      betCount: betCountNew,
      yesPrice: newYesPrice.toFixed(4),
      noPrice: newNoPrice.toFixed(4),
    })
    .where(eq(marketsTable.id, marketId));

  const [userResult] = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, userId));

  res.status(201).json(formatBet({ ...bet, username: userResult?.username }));
});

function formatMarket(m: typeof marketsTable.$inferSelect) {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    category: m.category,
    status: m.status,
    outcome: m.outcome ?? null,
    yesPrice: Number(m.yesPrice),
    noPrice: Number(m.noPrice),
    totalVolume: Number(m.totalVolume),
    betCount: m.betCount,
    createdAt: m.createdAt.toISOString(),
    closesAt: m.closesAt.toISOString(),
    creatorId: m.creatorId,
  };
}

function formatBet(b: Partial<typeof betsTable.$inferSelect> & { username?: string | null }) {
  return {
    id: b.id,
    marketId: b.marketId,
    userId: b.userId,
    username: b.username ?? undefined,
    position: b.position,
    amount: Number(b.amount),
    price: Number(b.price),
    payout: b.payout != null ? Number(b.payout) : null,
    status: b.status,
    createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
  };
}

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
