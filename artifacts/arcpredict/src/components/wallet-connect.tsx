import { useState } from "react";
import { useWallet } from "@/lib/wallet";
import { useUsdcBalance } from "@/hooks/useChain";
import { Wallet, LogOut, AlertTriangle, ChevronDown } from "lucide-react";

export function WalletConnect() {
  const { address, isConnected, isConnecting, isWrongChain, connect, disconnect, switchChain } =
    useWallet();
  const { formatted: usdcBalance } = useUsdcBalance(address);
  const [open, setOpen] = useState(false);

  // Not connected
  if (!isConnected) {
    return (
      <button
        onClick={connect}
        disabled={isConnecting}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        <Wallet className="w-3.5 h-3.5" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>
    );
  }

  // Wrong chain
  if (isWrongChain) {
    return (
      <button
        onClick={switchChain}
        className="flex items-center gap-2 border border-yellow-500/50 bg-yellow-500/10 text-yellow-400 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-yellow-500/20 transition-colors"
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        Switch to Arc Testnet
      </button>
    );
  }

  // Connected — show address with dropdown
  const short = `${address?.slice(0, 6)}…${address?.slice(-4)}`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 border border-border bg-card px-3 py-1.5 rounded text-xs font-mono hover:border-primary/50 transition-colors"
      >
        <div className="h-2 w-2 rounded-full bg-market-yes animate-pulse" />
        <span className="hidden sm:inline text-muted-foreground">
          {usdcBalance != null ? `$${usdcBalance.toFixed(2)} · ` : ""}
        </span>
        <span>{short}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 z-50 w-52 border border-border bg-card rounded shadow-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">
                Arc Testnet
              </div>
              <div className="text-xs font-mono truncate">{address}</div>
            </div>
            {usdcBalance != null && (
              <div className="px-3 py-2 border-b border-border">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">
                  USDC Balance
                </div>
                <div className="text-sm font-bold font-mono">${usdcBalance.toFixed(2)}</div>
              </div>
            )}
            <button
              onClick={() => {
                setOpen(false);
                disconnect();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors uppercase tracking-wider"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}
