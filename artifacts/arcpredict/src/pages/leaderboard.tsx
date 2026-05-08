import { useState } from "react";
import { useAllMarkets } from "@/hooks/useChain";
import { Activity, Info, Medal, Trophy, Zap } from "lucide-react";
import { useWallet } from "@/lib/wallet";
import { getAllLeaderboard } from "@/lib/points";
import { cn } from "@/lib/utils";

type Tab = "points" | "markets";

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Medal className="w-4 h-4 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-slate-400" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
  return <span className="text-muted-foreground font-mono text-xs w-4 text-center">{rank}</span>;
}

export function Leaderboard() {
  const { markets, isLoading } = useAllMarkets();
  const { isConnected, address } = useWallet();
  const [tab, setTab] = useState<Tab>("points");

  const openCount = markets.filter((m) => m.status === "open").length;
  const resolvedCount = markets.filter(
    (m) => m.status === "resolved_yes" || m.status === "resolved_no"
  ).length;
  const totalVolume = markets.reduce((s, m) => s + m.totalVolume, 0);

  const pointsBoard = getAllLeaderboard();
  const myEntry = address
    ? pointsBoard.find((p) => p.address === address.toLowerCase())
    : null;
  const myRank = myEntry
    ? pointsBoard.findIndex((p) => p.address === address?.toLowerCase()) + 1
    : null;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded" />)}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500 space-y-8">
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">Rankings across prediction markets</p>
        </div>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border border-border bg-card rounded p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Total Volume</div>
          <div className="text-2xl font-bold font-mono">${totalVolume.toFixed(2)}</div>
        </div>
        <div className="border border-border bg-card rounded p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Open Markets</div>
          <div className="text-2xl font-bold font-mono">{openCount}</div>
        </div>
        <div className="border border-border bg-card rounded p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Resolved</div>
          <div className="text-2xl font-bold font-mono">{resolvedCount}</div>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex border border-border rounded overflow-hidden">
        {(["points", "markets"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors",
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            )}
          >
            {t === "points" ? "Points Rankings" : "Markets by Volume"}
          </button>
        ))}
      </div>

      {tab === "points" && (
        <section className="space-y-4">
          {/* My stats if connected */}
          {isConnected && myEntry && (
            <div className="border border-primary/30 bg-primary/5 rounded p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {myRank !== null && <MedalIcon rank={myRank} />}
                  <span className="text-xs text-muted-foreground font-mono">#{myRank}</span>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Your Ranking</div>
                  <div className="text-sm font-mono">{address?.slice(0, 8)}…{address?.slice(-4)}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold font-mono text-primary flex items-center gap-1">
                    <Zap className="w-4 h-4" />{myEntry.total.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase">Points</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold font-mono text-orange-400">🔥{myEntry.streak}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Streak</div>
                </div>
              </div>
            </div>
          )}

          {pointsBoard.length === 0 ? (
            <div className="border border-border rounded py-16 text-center">
              <Zap className="w-10 h-10 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">No points earned yet on this device.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Complete the onboarding and check in daily to appear here.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded overflow-hidden">
              <div className="bg-secondary/50 border-b border-border px-4 py-3 grid grid-cols-12 gap-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Address</div>
                <div className="col-span-2 text-center">Handle</div>
                <div className="col-span-2 text-right">Points</div>
                <div className="col-span-2 text-right">Streak</div>
              </div>
              <div className="divide-y divide-border">
                {pointsBoard.map((entry, idx) => {
                  const isMe = entry.address === address?.toLowerCase();
                  return (
                    <div
                      key={entry.address}
                      className={cn(
                        "grid grid-cols-12 gap-4 px-4 py-3 items-center text-sm transition-colors",
                        isMe ? "bg-primary/5" : "hover:bg-muted/20"
                      )}
                    >
                      <div className="col-span-1 flex items-center">
                        <MedalIcon rank={idx + 1} />
                      </div>
                      <div className="col-span-5 font-mono text-xs truncate">
                        {entry.address.slice(0, 8)}…{entry.address.slice(-4)}
                        {isMe && <span className="ml-1 text-primary font-bold">(you)</span>}
                      </div>
                      <div className="col-span-2 text-center text-xs text-muted-foreground font-mono truncate">
                        {entry.xHandle ? `@${entry.xHandle}` : "—"}
                      </div>
                      <div className="col-span-2 text-right font-bold font-mono text-primary">
                        {entry.total.toLocaleString()}
                      </div>
                      <div className="col-span-2 text-right font-mono text-orange-400">
                        {entry.streak > 0 ? `🔥${entry.streak}` : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {tab === "markets" && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Markets by Volume
          </h2>
          {markets.length > 0 ? (
            <div className="border border-border rounded overflow-hidden">
              <div className="bg-secondary/50 border-b border-border px-4 py-3 grid grid-cols-12 gap-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <div className="col-span-1">#</div>
                <div className="col-span-6">Market</div>
                <div className="col-span-2 text-right">Volume</div>
                <div className="col-span-2 text-right">YES%</div>
                <div className="col-span-1 text-right">Status</div>
              </div>
              <div className="divide-y divide-border">
                {[...markets]
                  .sort((a, b) => b.totalVolume - a.totalVolume)
                  .map((market, idx) => {
                    const yesProb = Math.round(market.yesPrice * 100);
                    const isResolved = market.status === "resolved_yes" || market.status === "resolved_no";
                    return (
                      <a
                        key={market.address}
                        href={`/markets/${market.address}`}
                        className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-muted/30 transition-colors items-center text-sm"
                      >
                        <div className="col-span-1 text-muted-foreground font-mono">{idx + 1}</div>
                        <div className="col-span-6 font-medium line-clamp-1 leading-tight">{market.question}</div>
                        <div className="col-span-2 text-right font-mono">${market.totalVolume.toFixed(2)}</div>
                        <div className="col-span-2 text-right font-mono text-primary">{yesProb}%</div>
                        <div className="col-span-1 text-right">
                          <span className={
                            market.status === "open"
                              ? "text-market-yes text-[10px] font-bold uppercase"
                              : isResolved
                              ? "text-primary text-[10px] font-bold uppercase"
                              : "text-muted-foreground text-[10px] font-bold uppercase"
                          }>
                            {market.status === "open" ? "Live" : isResolved ? "Done" : "End"}
                          </span>
                        </div>
                      </a>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="border border-border rounded py-16 text-center">
              <Trophy className="w-10 h-10 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">No markets yet.</p>
            </div>
          )}
        </section>
      )}

      {/* Your wallet card */}
      <div className="border border-border rounded p-6 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Wallet</h3>
        </div>
        {isConnected ? (
          <div>
            <div className="font-mono text-sm mb-1">{address?.slice(0, 10)}…{address?.slice(-6)}</div>
            <div className="text-xs text-muted-foreground">Connected to Arc Testnet · View your positions in Portfolio</div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Connect wallet via the header to track your positions</p>
          </div>
        )}
      </div>
    </div>
  );
}
