import { useGetLeaderboard } from "@workspace/api-client-react";
import { Trophy, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

export function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">Ranked by current balance</p>
        </div>
      </div>

      <div className="border border-border rounded overflow-hidden">
        <div className="bg-secondary/50 border-b border-border px-4 py-3 grid grid-cols-12 gap-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-4">Trader</div>
          <div className="col-span-2 text-right">Balance</div>
          <div className="col-span-2 text-right">P&amp;L</div>
          <div className="col-span-2 text-right">Win Rate</div>
          <div className="col-span-1 text-right">Bets</div>
        </div>

        <div className="divide-y divide-border">
          {leaderboard?.length === 0 && (
            <div className="py-16 text-center text-muted-foreground text-sm">
              No users yet.
            </div>
          )}
          {leaderboard?.map((entry) => {
            const isPositive = entry.netPnl >= 0;
            const isTop3 = entry.rank <= 3;

            return (
              <Link
                key={entry.userId}
                href={`/portfolio/${entry.userId}`}
                className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-muted/30 transition-colors items-center group"
              >
                <div className="col-span-1 text-center">
                  {isTop3 ? (
                    <span className={cn(
                      "inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold",
                      entry.rank === 1 && "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30",
                      entry.rank === 2 && "bg-slate-400/20 text-slate-400 border border-slate-400/30",
                      entry.rank === 3 && "bg-amber-700/20 text-amber-700 border border-amber-700/30",
                    )}>
                      {entry.rank}
                    </span>
                  ) : (
                    <span className="text-muted-foreground font-mono text-sm">{entry.rank}</span>
                  )}
                </div>

                <div className="col-span-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase flex-shrink-0">
                    {entry.username.substring(0, 2)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm group-hover:text-primary transition-colors">{entry.username}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Predictor</div>
                  </div>
                </div>

                <div className="col-span-2 text-right font-mono font-bold">
                  ${entry.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                <div className={cn("col-span-2 text-right font-mono font-bold flex items-center justify-end gap-1", isPositive ? "text-market-yes" : "text-market-no")}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? "+" : ""}{entry.netPnl.toFixed(2)}
                </div>

                <div className="col-span-2 text-right">
                  <div className="font-mono font-bold text-sm">{(entry.winRate * 100).toFixed(0)}%</div>
                  <div className="w-full bg-secondary rounded-full h-1 mt-1">
                    <div
                      className="h-1 rounded-full bg-primary transition-all"
                      style={{ width: `${entry.winRate * 100}%` }}
                    />
                  </div>
                </div>

                <div className="col-span-1 text-right">
                  <div className="flex items-center justify-end gap-1 text-muted-foreground text-sm font-mono">
                    <Activity className="w-3 h-3" />
                    {entry.totalBets}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
