import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, BarChart2, Plus, Trophy, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { WalletConnect } from "@/components/wallet-connect";

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

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-mono">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-primary font-bold text-lg"
            >
              <Activity className="h-5 w-5" />
              <span>ARC_PREDICT</span>
            </Link>
            <nav className="flex items-center gap-1">
              <NavItem href="/" icon={<BarChart2 className="w-4 h-4" />} label="Markets" active={location === "/"} />
              <NavItem href="/leaderboard" icon={<Trophy className="w-4 h-4" />} label="Leaderboard" active={location === "/leaderboard"} />
              <NavItem href="/portfolio" icon={<Wallet className="w-4 h-4" />} label="Portfolio" active={location === "/portfolio"} />
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/markets/new"
              className="flex items-center gap-2 text-xs font-semibold bg-secondary/80 hover:bg-secondary px-3 py-1.5 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> CREATE MARKET
            </Link>
            <WalletConnect />
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
