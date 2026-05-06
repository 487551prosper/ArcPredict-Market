import { useAllMarkets } from "@/hooks/useChain";
import { Trophy, Activity, Info } from "lucide-react";
import { useAccount } from "wagmi";
import { WalletConnect } from "@/components/wallet-connect";

export function Leaderboard() {
  const { markets, isLoading } = useAllMarkets();
  const { isConnected, address } = useAccount();

  const openCount = markets.filter((m) => m.status === "open").length;
  const resolvedCount = markets.filter(
    (m) => m.status === "resolved_yes" || m.status === "resolved_no"
  ).length;
  const totalVolume = markets.reduce((s, m) => s + m.totalVolume, 0);

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
          <p className="text-sm text-muted-foreground">On-chain prediction market stats</p>
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

      {/* Markets by volume */}
      {markets.length > 0 ? (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Markets by Volume
          </h2>
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
        </section>
      ) : (
        <div className="border border-border rounded py-16 text-center">
          <Trophy className="w-10 h-10 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No markets yet.</p>
        </div>
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
            <p className="text-sm text-muted-foreground">Connect wallet to track your positions</p>
            <WalletConnect />
          </div>
        )}
      </div>
    </div>
  );
}
