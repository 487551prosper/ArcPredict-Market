import { useAllMarkets, useMarketCount } from "@/hooks/useChain";
import { Link } from "wouter";
import { Activity, Clock, Plus, TrendingUp, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { ChainMarket } from "@/hooks/useChain";
import { useWallet } from "@/lib/wallet";

export function Home() {
  const { markets, isLoading } = useAllMarkets();
  const { data: marketCount } = useMarketCount();
  const { isConnected } = useWallet();

  const openMarkets = markets.filter((m) => m.status === "open");
  const totalVolume = markets.reduce((s, m) => s + m.totalVolume, 0);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-48 bg-muted rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Open Markets" value={openMarkets.length.toString()} icon={<Activity className="w-4 h-4" />} />
        <StatCard label="Total Volume" value={`$${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<TrendingUp className="w-4 h-4" />} />
        <StatCard label="Total Markets" value={(marketCount ? Number(marketCount) : markets.length).toString()} icon={<Zap className="w-4 h-4" />} />
      </div>

      {/* Empty state */}
      {markets.length === 0 && (
        <div className="border border-border rounded-lg py-24 text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-primary/30" />
          <h2 className="text-lg font-bold uppercase tracking-wider mb-2">No Markets Yet</h2>
          <p className="text-sm text-muted-foreground mb-6">
            ArcPredict is live on Arc Testnet — be the first to create a market.
          </p>
          {isConnected ? (
            <Link href="/markets/new" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Create First Market
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Connect wallet to create a market</p>
          )}
        </div>
      )}

      {/* Open Markets */}
      {openMarkets.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-primary">
              <Activity className="h-5 w-5" />
              <h2 className="text-lg font-bold uppercase tracking-wider">Open Markets</h2>
            </div>
            {isConnected && (
              <Link href="/markets/new" className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
                <Plus className="w-3 h-3" /> New
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {openMarkets.map((m) => <MarketCard key={m.address} market={m} />)}
          </div>
        </section>
      )}

      {/* Ended/Resolved */}
      {markets.filter((m) => m.status !== "open").length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Ended Markets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {markets.filter((m) => m.status !== "open").map((m) => <MarketCard key={m.address} market={m} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="border border-border bg-card p-4 rounded flex flex-col gap-2 hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest">
        {icon}{label}
      </div>
      <span className="text-2xl font-bold text-foreground font-mono">{value}</span>
    </div>
  );
}

function MarketCard({ market }: { market: ChainMarket }) {
  const yesProb = Math.round(market.yesPrice * 100);
  const noProb = Math.round(market.noPrice * 100);
  const isResolved = market.status === "resolved_yes" || market.status === "resolved_no";
  const endDate = new Date(Number(market.endTime) * 1000);

  return (
    <Link
      href={`/markets/${market.address}`}
      className="block group border border-border bg-card rounded p-5 hover:border-primary transition-all hover:shadow-[0_0_15px_rgba(0,255,255,0.07)] relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-border/50 flex">
        <div className="h-full bg-market-yes transition-all" style={{ width: `${yesProb}%` }} />
        <div className="h-full bg-market-no transition-all" style={{ width: `${noProb}%` }} />
      </div>

      <div className="flex justify-between items-start mb-3 mt-1">
        <StatusBadge status={market.status} />
        <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
          <Clock className="w-3 h-3" />
          {endDate > new Date()
            ? formatDistanceToNow(endDate, { addSuffix: true })
            : formatDistanceToNow(endDate, { addSuffix: true })}
        </div>
      </div>

      <h3 className="font-bold text-base mb-4 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
        {market.question}
      </h3>

      {isResolved ? (
        <div className={cn(
          "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded inline-block",
          market.status === "resolved_yes" ? "bg-market-yes/10 text-market-yes" : "bg-market-no/10 text-market-no"
        )}>
          Resolved: {market.status === "resolved_yes" ? "YES" : "NO"}
        </div>
      ) : (
        <div className="flex justify-between items-end">
          <div className="flex gap-4">
            <div>
              <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Yes</div>
              <div className="text-xl font-bold text-market-yes font-mono">{yesProb}%</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">No</div>
              <div className="text-xl font-bold text-market-no font-mono">{noProb}%</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            ${market.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} vol
          </div>
        </div>
      )}
    </Link>
  );
}

function StatusBadge({ status }: { status: ChainMarket["status"] }) {
  if (status === "open") return (
    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-market-yes/10 text-market-yes border border-market-yes/20">
      Live
    </span>
  );
  if (status === "ended") return (
    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
      Ended
    </span>
  );
  return (
    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
      Resolved
    </span>
  );
}
