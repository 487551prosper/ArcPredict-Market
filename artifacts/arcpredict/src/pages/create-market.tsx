import { useCreateMarket } from "@/hooks/useChain";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { usePoints } from "@/contexts/PointsContext";
import { ArrowLeft, Plus, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useWallet } from "@/lib/wallet";
import { getSettings } from "./settings";

const CATEGORIES = ["Economics", "Technology", "Crypto", "Science", "Politics", "Sports", "Entertainment", "Other"];

export function CreateMarket() {
  const [, setLocation] = useLocation();
  const { isConnected } = useWallet();
  const { createMarket, isPending, isSuccess, txHash, error } = useCreateMarket();
  const { award } = usePoints();
  const settings = getSettings();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Technology");
  const [closesAt, setClosesAt] = useState("");

  useEffect(() => {
    if (isSuccess) {
      toast.success("Market created on-chain! +15 pts");
      award("Create a market", 15);
      setTimeout(() => setLocation("/"), 1500);
    }
  }, [isSuccess, setLocation]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !closesAt) {
      toast.error("Please fill in all required fields");
      return;
    }
    const endTimestamp = Math.floor(new Date(closesAt).getTime() / 1000);
    if (endTimestamp <= Math.floor(Date.now() / 1000)) {
      toast.error("Close date must be in the future");
      return;
    }
    // Prepend category to question for on-chain storage
    const question = `[${category}] ${title.trim()}`;
    await createMarket(question, endTimestamp);
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  if (!settings.publicMarketCreation) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
        <h2 className="text-lg font-bold uppercase tracking-wider mb-2">Admin Only</h2>
        <p className="text-sm text-muted-foreground mb-2">Market creation is currently restricted to admins.</p>
        <p className="text-xs text-muted-foreground mb-6">You can change this in <Link href="/settings" className="text-primary hover:underline">Settings</Link>.</p>
        <Link href="/" className="text-primary text-xs uppercase tracking-wider font-semibold hover:underline">Back to Markets</Link>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
        <h2 className="text-lg font-bold uppercase tracking-wider mb-2">Wallet Required</h2>
        <p className="text-sm text-muted-foreground mb-6">Connect your MetaMask wallet to create a market on Arc Testnet.</p>
        <Link href="/" className="text-primary text-xs uppercase tracking-wider font-semibold hover:underline">Back to Markets</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Markets
      </Link>

      <div className="border border-border bg-card rounded overflow-hidden">
        <div className="h-1 bg-primary w-full" />
        <div className="p-6 md:p-8">
          <h1 className="text-xl font-bold uppercase tracking-wider mb-1">Create Market</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Deploy a YES/NO prediction market on Arc Testnet. The question and close time are stored on-chain via the MarketFactory contract.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block">Question *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Will X happen before Y?"
                className="bg-background border-border font-sans"
                maxLength={200}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">{title.length}/200 · Category prefix will be added on-chain</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    disabled={isPending}
                    className={cn(
                      "px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider border transition-all",
                      category === cat
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block">Closes At *</label>
              <Input
                type="date"
                value={closesAt}
                min={minDateStr}
                onChange={(e) => setClosesAt(e.target.value)}
                className="bg-background border-border font-mono w-48"
                disabled={isPending}
              />
            </div>

            <div className="bg-secondary/30 border border-border rounded p-4 text-xs text-muted-foreground space-y-1.5">
              <p className="font-semibold text-foreground uppercase tracking-wider text-[10px] mb-2">On-Chain Details</p>
              <p>Contract: MarketFactory @ {`0xF8073a...5937`}</p>
              <p>Function: <code className="text-primary">createMarket(string question, uint256 endTime)</code></p>
              <p>Network: Arc Testnet (Chain ID 5042002)</p>
              <p>Starting probability: 50% YES / 50% NO</p>
            </div>

            {txHash && (
              <div className="border border-primary/30 bg-primary/5 rounded p-3 text-xs font-mono">
                <span className="text-muted-foreground">Tx: </span>
                <a
                  href={`https://explorer.testnet.arc.network/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {txHash.slice(0, 10)}…{txHash.slice(-8)}
                </a>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isPending || !title.trim() || !closesAt}
                className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" />
                {isPending ? "Confirm in MetaMask..." : "Deploy Market"}
              </Button>
              <Link href="/">
                <Button type="button" variant="outline" className="font-bold uppercase tracking-wider border-border" disabled={isPending}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
