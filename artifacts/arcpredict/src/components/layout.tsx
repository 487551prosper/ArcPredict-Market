import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, BarChart2, Plus, Trophy, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetUser } from "@workspace/api-client-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const userId = 1;
  const { data: user } = useGetUser(userId, {
    query: { enabled: !!userId }
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-mono selection:bg-primary/30">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-primary font-bold text-lg tracking-tighter">
              <Activity className="h-5 w-5" />
              <span>ARC_PREDICT</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              <NavItem href="/" icon={<BarChart2 className="w-4 h-4" />} label="Markets" active={location === "/"} />
              <NavItem href="/leaderboard" icon={<Trophy className="w-4 h-4" />} label="Leaderboard" active={location === "/leaderboard"} />
              <NavItem href={`/portfolio/${userId}`} icon={<Wallet className="w-4 h-4" />} label="Portfolio" active={location.startsWith("/portfolio")} />
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/markets/new" className="hidden md:flex items-center gap-2 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1.5 rounded transition-colors">
              <Plus className="w-3.5 h-3.5" /> CREATE MARKET
            </Link>
            {user ? (
              <div className="flex items-center gap-3 border-l border-border pl-4">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Balance</div>
                  <div className="text-sm font-bold">${user.balance.toFixed(2)}</div>
                </div>
                <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase border border-primary/30">
                  {user.username.substring(0, 2)}
                </div>
              </div>
            ) : (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string, icon: ReactNode, label: string, active: boolean }) {
  return (
    <Link href={href} className={cn(
      "flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors uppercase tracking-wider",
      active 
        ? "text-primary bg-primary/10" 
        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
    )}>
      {icon}
      {label}
    </Link>
  );
}
