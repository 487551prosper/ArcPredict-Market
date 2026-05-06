import { useGetMarketStats, useGetTrendingMarkets, useListMarkets } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Activity, ArrowRight, Clock, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function Home() {
  const { data: stats } = useGetMarketStats();
  const { data: trending } = useGetTrendingMarkets();
  const { data: listData } = useListMarkets({ status: "open", limit: 20 });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Volume" value={`$${stats.totalVolume.toLocaleString()}`} />
          <StatCard label="Open Markets" value={stats.openMarkets.toString()} />
          <StatCard label="Total Bets" value={stats.totalBets.toLocaleString()} />
          <StatCard label="Active Users" value={stats.totalUsers.toLocaleString()} />
        </div>
      )}

      {trending && trending.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4 text-primary">
            <Activity className="h-5 w-5" />
            <h2 className="text-lg font-bold uppercase tracking-wider">Trending Markets</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trending.slice(0, 2).map(market => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold uppercase tracking-wider text-muted-foreground">All Open Markets</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listData?.markets.map(market => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card p-4 rounded flex flex-col justify-between hover:border-primary/50 transition-colors">
      <span className="text-xs text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className="text-2xl font-bold mt-2 text-foreground">{value}</span>
    </div>
  );
}

function MarketCard({ market }: { market: any }) {
  const yesProb = Math.round(market.yesPrice * 100);
  const noProb = Math.round(market.noPrice * 100);

  return (
    <Link href={`/markets/${market.id}`} className="block group border border-border bg-card rounded p-5 hover:border-primary transition-all hover:shadow-[0_0_15px_rgba(0,255,255,0.1)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-border/50 flex">
        <div className="h-full bg-market-yes transition-all" style={{ width: `${yesProb}%` }} />
        <div className="h-full bg-market-no transition-all" style={{ width: `${noProb}%` }} />
      </div>
      
      <div className="flex justify-between items-start mb-3 mt-1">
        <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-1 rounded uppercase">
          {market.category}
        </span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(market.closesAt), { addSuffix: true })}
        </div>
      </div>
      
      <h3 className="font-bold text-base mb-4 line-clamp-2 group-hover:text-primary transition-colors">
        {market.title}
      </h3>

      <div className="flex justify-between items-end">
        <div className="flex gap-4">
          <div>
            <div className="text-[10px] text-muted-foreground mb-1 uppercase">Yes</div>
            <div className="text-xl font-bold text-market-yes">{yesProb}%</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground mb-1 uppercase">No</div>
            <div className="text-xl font-bold text-market-no">{noProb}%</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            ${market.totalVolume.toLocaleString()}
          </div>
        </div>
      </div>
    </Link>
  );
}
