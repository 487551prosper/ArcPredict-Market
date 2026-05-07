import { Link } from "wouter";
import { useAllMarkets, useTokenBalance, useUsdcBalance } from "@/hooks/useChain";
import { ArrowLeft, Wallet, Activity, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet } from "@/lib/wallet";
import type { ChainMarket } from "@/hooks/useChain";

export function Portfolio() {
  const { address, isConnected } = useWallet();
  const { markets, isLoading } = useAllMarkets();
  const { formatted: usdcBalance } = useUsdcBalance(address);

  if (!isConnected) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
        <h2 className="text-lg font-bold uppercase tracking-wider mb-2">Connect Wallet</h2>
        <p className="text-sm text-muted-foreground">Connect your MetaMask to view your portfolio.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-muted rounded" />)}
        </div>
        <div className="h-48 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500 space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
        <ArrowLeft className="w-4 h-4" /> Markets
      </Link>

      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold uppercase">
          {address?.slice(2, 4)}
        </div>
        <div>
          <div className="font-bold text-lg font-mono">{address?.slice(0, 6)}…{address?.slice(-4)}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest">Arc Testnet</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border border-border bg-card rounded p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">USDC Balance</div>
          <div className="text-2xl font-bold font-mono">
            {usdcBalance != null ? `$${usdcBalance.toFixed(2)}` : "—"}
          </div>
        </div>
        <div className="border border-border bg-card rounded p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Markets</div>
          <div className="text-2xl font-bold font-mono">{markets.length}</div>
        </div>
      </div>

      {markets.length === 0 ? (
        <div className="border border-border rounded py-16 text-center">
          <Activity className="w-10 h-10 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No markets exist yet.</p>
          <Link href="/markets/new" className="mt-3 inline-block text-primary text-xs uppercase tracking-wider font-semibold hover:underline">
            Create First Market
          </Link>
        </div>
      ) : (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Your Positions</h2>
          <div className="space-y-3">
            {markets.map((market) => (
              <MarketPosition key={market.address} market={market} userAddress={address!} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MarketPosition({
  market,
  userAddress,
}: {
  market: ChainMarket;
  userAddress: `0x${string}`;
}) {
  const { raw: yesRaw, formatted: yesFormatted } = useTokenBalance(market.yesToken, userAddress);
  const { raw: noRaw, formatted: noFormatted } = useTokenBalance(market.noToken, userAddress);

  const hasPosition = (yesRaw && yesRaw > 0n) || (noRaw && noRaw > 0n);
  if (!hasPosition) return null;

  const isResolved = market.status === "resolved_yes" || market.status === "resolved_no";
  const won =
    (market.status === "resolved_yes" && yesRaw && yesRaw > 0n) ||
    (market.status === "resolved_no" && noRaw && noRaw > 0n);

  return (
    <Link
      href={`/markets/${market.address}`}
      className="block border border-border bg-card rounded p-4 hover:border-primary/50 transition-colors group"
    >
      <div className="flex justify-between items-start gap-4 mb-3">
        <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {market.question}
        </h3>
        {isResolved && (
          <span className={cn(
            "flex-shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
            won ? "bg-market-yes/10 text-market-yes" : "bg-market-no/10 text-market-no"
          )}>
            {won ? "Won" : "Lost"}
          </span>
        )}
      </div>

      <div className="flex gap-6 text-sm">
        {yesRaw != null && yesRaw > 0n && (
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">YES Tokens</div>
            <div className="font-bold text-market-yes font-mono flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {yesFormatted?.toFixed(4)}
            </div>
          </div>
        )}
        {noRaw != null && noRaw > 0n && (
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">NO Tokens</div>
            <div className="font-bold text-market-no font-mono flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              {noFormatted?.toFixed(4)}
            </div>
          </div>
        )}
        <div className="ml-auto text-right">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</div>
          <div className="text-xs font-semibold uppercase tracking-wider">
            {market.status === "open" ? "Open" : market.status === "ended" ? "Ended" : "Resolved"}
          </div>
        </div>
      </div>
    </Link>
  );
}
