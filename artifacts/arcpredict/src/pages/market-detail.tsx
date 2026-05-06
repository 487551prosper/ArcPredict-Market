import { useParams } from "wouter";
import { useGetMarket, useGetMarketBets, usePlaceBet, getGetMarketQueryKey, getGetMarketBetsQueryKey, useGetUser, getGetUserQueryKey } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { Activity, ArrowLeft, ArrowUpRight, BarChart2, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function MarketDetail() {
  const { id } = useParams();
  const marketId = parseInt(id || "0", 10);
  const userId = 1;

  const { data: market, isLoading: marketLoading } = useGetMarket(marketId, {
    query: { enabled: !!marketId, queryKey: getGetMarketQueryKey(marketId) }
  });

  const { data: bets, isLoading: betsLoading } = useGetMarketBets(marketId, {
    query: { enabled: !!marketId, queryKey: getGetMarketBetsQueryKey(marketId) }
  });

  if (marketLoading || betsLoading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-8 w-64 bg-muted rounded"></div>
      <div className="h-32 w-full bg-muted rounded"></div>
    </div>;
  }

  if (!market) {
    return <div className="text-center py-20 text-muted-foreground">Market not found.</div>;
  }

  const yesProb = Math.round(market.yesPrice * 100);
  const noProb = Math.round(market.noPrice * 100);

  const isResolved = market.status === "resolved";
  const isOpen = market.status === "open";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
        <ArrowLeft className="w-4 h-4" /> Back to Markets
      </Link>

      <div className="border border-border bg-card rounded overflow-hidden">
        <div className="h-2 w-full bg-border flex">
          <div className="h-full bg-market-yes transition-all" style={{ width: `${yesProb}%` }} />
          <div className="h-full bg-market-no transition-all" style={{ width: `${noProb}%` }} />
        </div>
        
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground bg-secondary px-3 py-1 rounded uppercase tracking-wider">
              {market.category}
            </span>
            
            <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatDistanceToNow(new Date(market.closesAt), { addSuffix: true })}</span>
              <span className="flex items-center gap-1"><Activity className="w-4 h-4" /> Vol: ${market.totalVolume.toLocaleString()}</span>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold">{market.title}</h1>
          <p className="text-muted-foreground whitespace-pre-wrap">{market.description}</p>

          {isResolved && (
            <div className="p-4 border border-primary/50 bg-primary/10 rounded flex items-center gap-3 text-primary">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold uppercase tracking-wider">Market Resolved: {market.outcome?.toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-lg font-bold uppercase tracking-wider text-muted-foreground">Recent Activity</h2>
          <div className="border border-border rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Position</th>
                    <th className="px-4 py-3 font-semibold text-right">Amount</th>
                    <th className="px-4 py-3 font-semibold text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bets?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No bets yet. Be the first.</td>
                    </tr>
                  )}
                  {bets?.map(bet => (
                    <tr key={bet.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{bet.username || `User #${bet.userId}`}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-bold uppercase",
                          bet.position === "yes" ? "text-market-yes bg-market-yes/10" : "text-market-no bg-market-no/10"
                        )}>
                          {bet.position}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">${bet.amount}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatDistanceToNow(new Date(bet.createdAt))} ago</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          {isOpen ? (
            <TradingPanel market={market} userId={userId} />
          ) : (
            <div className="p-6 border border-border bg-card rounded text-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-bold uppercase tracking-wider mb-2">Trading Closed</h3>
              <p className="text-sm text-muted-foreground">This market is no longer accepting bets.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TradingPanel({ market, userId }: { market: any, userId: number }) {
  const [position, setPosition] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState<string>("10");
  const queryClient = useQueryClient();
  const placeBet = usePlaceBet();

  const handleBet = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    placeBet.mutate({
      marketId: market.id,
      data: {
        userId,
        position,
        amount: numAmount
      }
    }, {
      onSuccess: () => {
        toast.success(`Successfully bet $${numAmount} on ${position.toUpperCase()}`);
        setAmount("");
        queryClient.invalidateQueries({ queryKey: getGetMarketQueryKey(market.id) });
        queryClient.invalidateQueries({ queryKey: getGetMarketBetsQueryKey(market.id) });
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(userId) });
      },
      onError: (err: any) => {
        toast.error(err?.message || "Failed to place bet");
      }
    });
  };

  const prob = position === "yes" ? market.yesPrice : market.noPrice;
  const potentialPayout = parseFloat(amount) ? (parseFloat(amount) / prob).toFixed(2) : "0.00";

  return (
    <div className="border border-border bg-card rounded p-6 sticky top-20">
      <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Trade</h2>
      
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          onClick={() => setPosition("yes")}
          className={cn(
            "p-3 rounded border text-center transition-all uppercase font-bold text-sm tracking-wider",
            position === "yes" 
              ? "border-market-yes bg-market-yes/10 text-market-yes" 
              : "border-border hover:border-market-yes/50"
          )}
        >
          Yes <span className="block text-xs font-normal opacity-80 mt-1">{Math.round(market.yesPrice * 100)}%</span>
        </button>
        <button
          onClick={() => setPosition("no")}
          className={cn(
            "p-3 rounded border text-center transition-all uppercase font-bold text-sm tracking-wider",
            position === "no" 
              ? "border-market-no bg-market-no/10 text-market-no" 
              : "border-border hover:border-market-no/50"
          )}
        >
          No <span className="block text-xs font-normal opacity-80 mt-1">{Math.round(market.noPrice * 100)}%</span>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Amount ($)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">$</span>
            <Input 
              type="number" 
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="pl-8 font-mono bg-background border-border"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="bg-secondary/50 p-4 rounded flex justify-between items-center text-sm">
          <span className="text-muted-foreground uppercase tracking-wider text-xs">Payout</span>
          <span className="font-bold text-primary font-mono">${potentialPayout}</span>
        </div>

        <Button 
          onClick={handleBet} 
          disabled={placeBet.isPending || !amount || parseFloat(amount) <= 0}
          className={cn(
            "w-full font-bold uppercase tracking-wider",
            position === "yes" ? "bg-market-yes hover:bg-market-yes/90 text-market-yes-foreground" : "bg-market-no hover:bg-market-no/90 text-market-no-foreground"
          )}
        >
          {placeBet.isPending ? "Placing..." : `Bet ${position.toUpperCase()}`}
        </Button>
      </div>
    </div>
  );
}
