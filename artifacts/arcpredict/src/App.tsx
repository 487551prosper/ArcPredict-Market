import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { Home } from "@/pages/home";
import { MarketDetail } from "@/pages/market-detail";
import { CreateMarket } from "@/pages/create-market";
import { Leaderboard } from "@/pages/leaderboard";
import { Portfolio } from "@/pages/portfolio";
import { Settings_ } from "@/pages/settings";
import { CheckIn } from "@/pages/check-in";
import { Referral } from "@/pages/referral";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";
import { WalletProvider } from "@/lib/wallet";
import { PointsProvider } from "@/contexts/PointsContext";
import { OnboardingGate } from "@/components/onboarding-gate";
import { Toaster as Sonner } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 10_000,
    },
  },
});

function Router() {
  return (
    <OnboardingGate>
      <Layout>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/markets/new" component={CreateMarket} />
          <Route path="/markets/:address" component={MarketDetail} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/portfolio" component={Portfolio} />
          <Route path="/settings" component={Settings_} />
          <Route path="/check-in" component={CheckIn} />
          <Route path="/referral" component={Referral} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </OnboardingGate>
  );
}

function App() {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("arcpredict_theme") === "dark"; } catch { return false; }
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    try { localStorage.setItem("arcpredict_theme", isDark ? "dark" : "light"); } catch {}
  }, [isDark]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "arcpredict_theme") setIsDark(e.newValue === "dark");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <WalletProvider>
      <QueryClientProvider client={queryClient}>
        <PointsProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
            <Sonner theme={isDark ? "dark" : "light"} position="bottom-right" richColors />
          </TooltipProvider>
        </PointsProvider>
      </QueryClientProvider>
    </WalletProvider>
  );
}

export default App;
