import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { arcTestnet } from "@/lib/chain";
import { Wallet, LogOut, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUsdcBalance } from "@/hooks/useChain";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { formatted: usdcBalance } = useUsdcBalance(address);

  const isWrongChain = isConnected && chainId !== arcTestnet.id;

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isPending}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        <Wallet className="w-3.5 h-3.5" />
        {isPending ? "Connecting..." : "Connect Wallet"}
      </button>
    );
  }

  if (isWrongChain) {
    return (
      <button
        onClick={() => switchChain({ chainId: arcTestnet.id })}
        className="flex items-center gap-2 border border-yellow-500/50 bg-yellow-500/10 text-yellow-400 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-yellow-500/20 transition-colors"
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        Wrong Network
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 border-l border-border pl-4">
      <div className="text-right hidden sm:block">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">USDC Balance</div>
        <div className="text-sm font-bold font-mono">
          {usdcBalance != null ? `$${usdcBalance.toFixed(2)}` : "—"}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xs border border-primary/30">
          {address?.slice(2, 4).toUpperCase()}
        </div>
        <div className="hidden md:flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Arc Testnet</span>
          <span className="text-xs font-mono">
            {address?.slice(0, 6)}…{address?.slice(-4)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="ml-1 p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          title="Disconnect"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
