import { ReactNode, useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Activity, BarChart2, CalendarDays, Moon, Plus, Settings, Sun, Trophy, Wallet, LogOut, AlertTriangle, ChevronDown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePoints } from "@/contexts/PointsContext";

const ARC_CHAIN_ID = 5042002;
const ARC_CHAIN_ID_HEX = "0x4cef52";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

async function addArcTestnet() {
  await window.ethereum!.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: ARC_CHAIN_ID_HEX,
        chainName: "Arc Testnet",
        rpcUrls: ["https://rpc.testnet.arc.network"],
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://explorer.testnet.arc.network"],
      },
    ],
  });
}

async function switchToArc() {
  try {
    await window.ethereum!.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_CHAIN_ID_HEX }],
    });
  } catch (err: any) {
    if (err?.code === 4902 || err?.code === -32603 || err?.code === -32000) {
      await addArcTestnet();
    }
  }
}

const THEME_KEY = "arcpredict_theme";

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved !== "light";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
      html.classList.remove("light");
    } else {
      html.classList.remove("dark");
      html.classList.add("light");
    }
    try {
      localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    } catch {}
  }, [isDark]);

  const toggle = () => setIsDark((v) => !v);
  return { isDark, toggle };
}

interface NavItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  active: boolean;
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded text-xs font-semibold transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-primary"
      )}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}

function PointsBadge() {
  const { points, streak, lastCheckIn } = usePoints();
  const today = new Date().toISOString().split("T")[0];
  const canCheckIn = lastCheckIn !== today;

  return (
    <Link
      href="/check-in"
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-bold font-mono transition-all",
        canCheckIn
          ? "border-primary/60 bg-primary/10 text-primary hover:bg-primary/20 animate-pulse"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"
      )}
      title={canCheckIn ? "Check in for daily points!" : `${streak} day streak`}
    >
      <Zap className="w-3 h-3 shrink-0" />
      <span>{points.toLocaleString()}</span>
      {streak > 0 && (
        <span className="text-orange-400">🔥{streak}</span>
      )}
    </Link>
  );
}

function ConnectButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isConnected = !!address;
  const isWrongChain = isConnected && chainId !== ARC_CHAIN_ID;

  const updateChain = useCallback(async () => {
    if (!window.ethereum) return;
    const hex = (await window.ethereum.request({ method: "eth_chainId" })) as string;
    setChainId(parseInt(hex, 16));
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum
      .request({ method: "eth_accounts" })
      .then(async (accounts) => {
        const list = accounts as string[];
        if (list[0]) {
          setAddress(list[0]);
          await updateChain();
        }
      })
      .catch(() => {});

    const onAccountsChanged = (accounts: unknown) => {
      const list = accounts as string[];
      setAddress(list[0] ?? null);
      if (!list[0]) setChainId(null);
    };

    const onChainChanged = (hex: unknown) => {
      setChainId(parseInt(hex as string, 16));
    };

    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum?.removeListener("chainChanged", onChainChanged);
    };
  }, [updateChain]);

  const connect = async () => {
    if (!window.ethereum) {
      alert("No wallet found.\n\nPlease use MetaMask, Mises, Trust Wallet, or another Web3 browser.");
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (accounts[0]) {
        setAddress(accounts[0]);
        const hex = (await window.ethereum.request({ method: "eth_chainId" })) as string;
        const currentChain = parseInt(hex, 16);
        setChainId(currentChain);
        if (currentChain !== ARC_CHAIN_ID) {
          await switchToArc();
          await updateChain();
        }
      }
    } catch (err: any) {
      console.warn("Connect error:", err?.message ?? err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setChainId(null);
    setDropdownOpen(false);
  };

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        disabled={isConnecting}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        <Wallet className="w-3.5 h-3.5 shrink-0" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>
    );
  }

  if (isWrongChain) {
    return (
      <button
        onClick={() => switchToArc().then(updateChain)}
        className="flex items-center gap-2 border border-yellow-500/50 bg-yellow-500/10 text-yellow-400 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-yellow-500/20 transition-colors whitespace-nowrap"
      >
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        Switch Network
      </button>
    );
  }

  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen((v) => !v)}
        className="flex items-center gap-2 border border-border bg-card px-3 py-1.5 rounded text-xs font-mono hover:border-primary/50 transition-colors whitespace-nowrap"
      >
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
        <span>{short}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
      </button>

      {dropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 w-52 border border-border bg-card rounded shadow-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">
                Arc Testnet
              </div>
              <div className="text-xs font-mono truncate">{address}</div>
            </div>
            <button
              onClick={disconnect}
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

function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center justify-center w-8 h-8 rounded border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
    >
      {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
    </button>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-mono">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-6 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-2 text-primary font-bold text-lg shrink-0"
            >
              <Activity className="h-5 w-5" />
              <span className="hidden sm:inline">ARC_PREDICT</span>
            </Link>
            <nav className="flex items-center gap-1">
              <NavItem href="/" icon={<BarChart2 className="w-4 h-4" />} label="Markets" active={location === "/"} />
              <NavItem href="/leaderboard" icon={<Trophy className="w-4 h-4" />} label="Leaderboard" active={location === "/leaderboard"} />
              <NavItem href="/portfolio" icon={<Wallet className="w-4 h-4" />} label="Portfolio" active={location === "/portfolio"} />
              <NavItem href="/check-in" icon={<CalendarDays className="w-4 h-4" />} label="Check-In" active={location === "/check-in"} />
              <NavItem href="/settings" icon={<Settings className="w-4 h-4" />} label="Settings" active={location === "/settings"} />
            </nav>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PointsBadge />
            <ThemeToggle />
            <Link
              href="/markets/new"
              className="hidden sm:flex items-center gap-2 text-xs font-semibold bg-secondary/80 hover:bg-secondary px-3 py-1.5 rounded transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> CREATE MARKET
            </Link>
            <ConnectButton />
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground font-mono">
        ARC_PREDICT · Arc Testnet · Chain ID 5042002
      </footer>
    </div>
  );
}
