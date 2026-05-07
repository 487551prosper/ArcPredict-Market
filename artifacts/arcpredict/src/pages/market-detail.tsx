import { useParams, Link } from "wouter";
import { useMarket, usePlaceBet, useClaimWinnings, useUsdcBalance, useTokenBalance } from "@/hooks/useChain";
import { formatDistanceToNow, format } from "date-fns";
import { Activity, ArrowLeft, CheckCircle2, XCircle, AlertCircle, ExternalLink, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useWallet } from "@/lib/wallet";
import { fromUsdc } from "@/lib/contracts";

export function MarketDetail() {
  const { address: marketAddr } = useParams();
  const marketAddress = marketAddr as `0x${string}` | undefined;
  const { address: userAddress, isConnected } = useWallet();

  const { market, isLoading } = useMarket(marketAddress);
  const { placeBet, isPending: betPending, isSuccess: betSuccess, error: betError } = usePlaceBet(marketAddress);
  const { claim, isPending: claimPending, isSuccess: claimSuccess, error: claimError } = useClaimWinnings(marketAddress);
  const { formatted: usdcBalance } = useUsdcBalance(userAddress);
  const { formatted: yesBalance, raw: yesRaw } = useTokenBalance(market?.yesToken, userAddress);
  const { formatted: noBalance, raw: noRaw } = useTokenBalance(market?.noToken, userAddress);

  const [position, setPosition] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("10");

  useEffect(() => {
    if (betSuccess) {
      toast.success("Bet placed successfully!");
      setAmount("");
    }
  }, [betSuccess]);

  useEffect(() => {
    if (betError) toast.error(betError);
  }, [betError]);

  useEffect(() => {
    if (claimSuccess) toast.success("Winnings claimed!");
    if (claimError) toast.error(claimError);
  }, [claimSuccess, claimError]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8 max-w-4xl mx-auto">
        <div className="h-6 w-40 bg-muted rounded" />
        <div className="h-48 bg-muted rounded" />
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 h-64 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="text-center py-20 text-muted-foreground max-w-4xl mx-auto">
        <AlertCircle className="w-10 h-10 mx-auto mb-4 opacity-30" />
        <p>Market not found.</p>
        <Link href="/" className="mt-4 inline-block text-primary text-xs uppercase tracking-wider">Back to Markets</Link>
      </div>
    );
  }

  const yesProb = Math.round(market.yesPrice * 100);
  const noProb = Math.round(market.noPrice * 100);
  const isOpen = market.status === "open";
  const isResolved = market.status === "resolved_yes" || market.status === "resolved_no";
  const endDate = new Date(Number(market.endTime) * 1000);

  const numAmount = parseFloat(amount);
  const currentPrice = position === "yes" ? market.yesPrice : market.noPrice;
  const potentialPayout = !isNaN(numAmount) && currentPrice > 0
    ? (numAmount / currentPrice).toFixed(2)
    : "0.00";

  const hasWinningTokens = isResolved && (
    (market.status === "resolved_yes" && yesRaw && yesRaw > 0n) ||
    (market.status === "resolved_no" && noRaw && noRaw > 0n)
  );

  const shortAddr = `${market.address.slice(0, 6)}…${market.address.slice(-4)}`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
        <ArrowLeft className="w-4 h-4" /> Back to Markets
      </Link>

      <div className="border border-border bg-card rounded overflow-hidden">
        <div className="h-2 w-full bg-border flex">
          <div className="h-full bg-market-yes transition-all duration-700" style={{ width: `${yesProb}%` }} />
          <div className="h-full bg-market-no transition-all duration-700" style={{ width: `${noProb}%` }} />
        </div>

        <div className="p-6 md:p-8 space-y-5">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusTag status={market.status} />
              {isOpen && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                  <Clock className="w-3 h-3" />
                  Closes {formatDistanceToNow(endDate, { addSuffix: true })}
                </span>
              )}
            </div>
            <a
              href={`https://explorer.testnet.arc.network/address/${market.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-mono"
            >
              {shortAddr} <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold leading-tight">{market.question}</h1>

          <div className="text-xs text-muted-foreground font-mono">
            Closes: {format(endDate, "PPP 'at' p")}
          </div>

          {isResolved && (
            <div className={cn(
              "p-4 border rounded flex items-center gap-3 font-bold uppercase tracking-wider",
              market.status === "resolved_yes"
                ? "border-market-yes/50 bg-market-yes/10 text-market-yes"
                : "border-market-no/50 bg-market-no/10 text-market-no"
            )}>
              {market.status === "resolved_yes"
                ? <CheckCircle2 className="w-5 h-5" />
                : <XCircle className="w-5 h-5" />}
              Resolved: {market.status === "resolved_yes" ? "YES" : "NO"}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Stats */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-border bg-card rounded p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Yes</div>
              <div className="text-2xl font-bold text-market-yes font-mono">{yesProb}%</div>
              <div className="text-xs text-muted-foreground font-mono mt-1">
                ${fromUsdc(market.totalYes).toFixed(2)} vol
              </div>
            </div>
            <div className="border border-border bg-card rounded p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">No</div>
              <div className="text-2xl font-bold text-market-no font-mono">{noProb}%</div>
              <div className="text-xs text-muted-foreground font-mono mt-1">
                ${fromUsdc(market.totalNo).toFixed(2)} vol
              </div>
            </div>
            <div className="border border-border bg-card rounded p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Total</div>
              <div className="text-2xl font-bold font-mono">${market.totalVolume.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">volume</div>
            </div>
          </div>

          {/* User position */}
          {isConnected && (yesBalance != null || noBalance != null) && (
            <div className="border border-border rounded p-4 bg-secondary/20">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Your Position</h3>
              <div className="flex gap-6">
                {yesBalance != null && yesBalance > 0 && (
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">YES Tokens</div>
                    <div className="text-lg font-bold text-market-yes font-mono">{yesBalance.toFixed(4)}</div>
                  </div>
                )}
                {noBalance != null && noBalance > 0 && (
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">NO Tokens</div>
                    <div className="text-lg font-bold text-market-no font-mono">{noBalance.toFixed(4)}</div>
                  </div>
                )}
                {yesBalance === 0 && noBalance === 0 && (
                  <p className="text-xs text-muted-foreground">No position in this market yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Trading panel */}
        <div className="md:col-span-1">
          {isOpen && isConnected ? (
            <div className="border border-border bg-card rounded p-6 sticky top-20">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Trade</h2>

              <div className="grid grid-cols-2 gap-2 mb-5">
                {(["yes", "no"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPosition(p)}
                    className={cn(
                      "p-3 rounded border text-center transition-all uppercase font-bold text-sm tracking-wider",
                      position === p
                        ? p === "yes"
                          ? "border-market-yes bg-market-yes/10 text-market-yes"
                          : "border-market-no bg-market-no/10 text-market-no"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    {p}
                    <span className="block text-[10px] font-normal opacity-70 mt-0.5">
                      {p === "yes" ? yesProb : noProb}%
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Amount (USDC)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">$</span>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-7 font-mono bg-background border-border"
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                  {usdcBalance != null && (
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Balance: ${usdcBalance.toFixed(2)}
                      <button onClick={() => setAmount(usdcBalance.toFixed(2))} className="ml-2 text-primary hover:underline">MAX</button>
                    </div>
                  )}
                </div>

                <div className="bg-secondary/50 p-3 rounded flex justify-between text-sm">
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Est. Payout</span>
                  <span className="font-bold text-primary font-mono">${potentialPayout}</span>
                </div>

                <Button
                  onClick={async () => {
                    if (!amount || isNaN(numAmount) || numAmount <= 0) {
                      toast.error("Enter a valid amount");
                      return;
                    }
                    await placeBet(position === "yes", numAmount);
                  }}
                  disabled={betPending || !amount || isNaN(numAmount) || numAmount <= 0}
                  className={cn(
                    "w-full font-bold uppercase tracking-wider",
                    position === "yes"
                      ? "bg-market-yes hover:bg-market-yes/90 text-market-yes-foreground"
                      : "bg-market-no hover:bg-market-no/90 text-market-no-foreground"
                  )}
                >
                  {betPending ? "Confirming..." : `Bet ${position.toUpperCase()}`}
                </Button>
              </div>
            </div>
          ) : isOpen && !isConnected ? (
            <div className="border border-border bg-card rounded p-6 text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-bold uppercase tracking-wider mb-2">Wallet Required</p>
              <p className="text-xs text-muted-foreground">Connect MetaMask to place bets.</p>
            </div>
          ) : isResolved && hasWinningTokens ? (
            <div className="border border-market-yes/30 bg-market-yes/5 rounded p-6 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-market-yes" />
              <p className="text-sm font-bold uppercase tracking-wider mb-4">You Won!</p>
              <Button
                onClick={() => claim()}
                disabled={claimPending}
                className="w-full bg-market-yes text-market-yes-foreground font-bold uppercase tracking-wider"
              >
                {claimPending ? "Claiming..." : "Claim Winnings"}
              </Button>
            </div>
          ) : (
            <div className="border border-border bg-card rounded p-6 text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-bold uppercase tracking-wider mb-1">
                {market.status === "ended" ? "Pending Resolution" : "Trading Closed"}
              </p>
              <p className="text-xs text-muted-foreground">
                {market.status === "ended"
                  ? "Market has ended and is awaiting resolution."
                  : "This market has been resolved."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusTag({ status }: { status: string }) {
  if (status === "open") return (
    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-market-yes/10 text-market-yes border border-market-yes/20">Live</span>
  );
  if (status === "ended") return (
    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">Ended</span>
  );
  return (
    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Resolved</span>
  );
}
