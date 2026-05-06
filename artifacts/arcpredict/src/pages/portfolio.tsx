import { useParams, Link } from "wouter";
import { useGetUserPortfolio, getGetUserPortfolioQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function Portfolio() {
  const { userId } = useParams();
  const uid = parseInt(userId || "1", 10);

  const { data: portfolio, isLoading } = useGetUserPortfolio(uid, {
    query: { enabled: !!uid, queryKey: getGetUserPortfolioQueryKey(uid) }
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-40 bg-muted rounded" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Wallet className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>Portfolio not found.</p>
      </div>
    );
  }

  const { user, totalInvested, totalPayout, netPnl, winRate, positions } = portfolio;
  const isPositive = netPnl >= 0;
  const pendingPositions = positions.filter(p => p.status === "pending");
  const resolvedPositions = positions.filter(p => p.status !== "pending");

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
        <ArrowLeft className="w-4 h-4" /> Markets
      </Link>

      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl uppercase">
          {user.username.substring(0, 2)}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.username}</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Prediction Trader</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-border bg-card rounded p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Balance</div>
          <div className="text-2xl font-bold font-mono">${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="border border-border bg-card rounded p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Net P&amp;L</div>
          <div className={cn("text-2xl font-bold font-mono flex items-center gap-1", isPositive ? "text-market-yes" : "text-market-no")}>
            {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            {isPositive ? "+" : ""}{netPnl.toFixed(2)}
          </div>
        </div>
        <div className="border border-border bg-card rounded p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Win Rate</div>
          <div className="text-2xl font-bold font-mono">{(winRate * 100).toFixed(0)}%</div>
          <div className="w-full bg-secondary rounded-full h-1 mt-2">
            <div className="h-1 rounded-full bg-primary transition-all" style={{ width: `${winRate * 100}%` }} />
          </div>
        </div>
        <div className="border border-border bg-card rounded p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Total Bets</div>
          <div className="text-2xl font-bold font-mono flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            {user.totalBets}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 border border-border rounded p-4 bg-secondary/20">
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Invested</div>
          <div className="font-bold font-mono">${totalInvested.toFixed(2)}</div>
        </div>
        <div className="text-center border-x border-border">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Returned</div>
          <div className="font-bold font-mono">${totalPayout.toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Open Bets</div>
          <div className="font-bold font-mono">{pendingPositions.length}</div>
        </div>
      </div>

      {pendingPositions.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Open Positions ({pendingPositions.length})
          </h2>
          <PositionTable positions={pendingPositions} />
        </section>
      )}

      {resolvedPositions.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Resolved Positions ({resolvedPositions.length})</h2>
          <PositionTable positions={resolvedPositions} />
        </section>
      )}

      {positions.length === 0 && (
        <div className="py-16 border border-border rounded text-center">
          <Activity className="w-10 h-10 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No positions yet.</p>
          <Link href="/" className="mt-3 inline-block text-primary text-xs uppercase tracking-wider font-semibold hover:underline">
            Browse Markets
          </Link>
        </div>
      )}
    </div>
  );
}

function PositionTable({ positions }: { positions: any[] }) {
  return (
    <div className="border border-border rounded overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-muted-foreground uppercase bg-secondary/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 font-semibold tracking-widest">Market</th>
              <th className="px-4 py-3 font-semibold tracking-widest">Position</th>
              <th className="px-4 py-3 font-semibold tracking-widest text-right">Amount</th>
              <th className="px-4 py-3 font-semibold tracking-widest text-right">Price</th>
              <th className="px-4 py-3 font-semibold tracking-widest text-right">Payout</th>
              <th className="px-4 py-3 font-semibold tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {positions.map(pos => (
              <tr key={pos.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  <Link href={`/markets/${pos.marketId}`} className="hover:text-primary transition-colors">
                    #{pos.marketId}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-bold uppercase",
                    pos.position === "yes" ? "text-market-yes bg-market-yes/10" : "text-market-no bg-market-no/10"
                  )}>
                    {pos.position}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">${Number(pos.amount).toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">{(Number(pos.price) * 100).toFixed(0)}%</td>
                <td className="px-4 py-3 text-right font-mono">
                  {pos.payout != null ? (
                    <span className={pos.status === "won" ? "text-market-yes" : "text-market-no"}>
                      ${Number(pos.payout).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {pos.status === "won" && <span className="inline-flex items-center gap-1 text-market-yes text-xs font-bold uppercase"><CheckCircle2 className="w-3 h-3" /> Won</span>}
                  {pos.status === "lost" && <span className="inline-flex items-center gap-1 text-market-no text-xs font-bold uppercase"><XCircle className="w-3 h-3" /> Lost</span>}
                  {pos.status === "pending" && <span className="inline-flex items-center gap-1 text-muted-foreground text-xs font-bold uppercase"><Clock className="w-3 h-3" /> Open</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
