import { useAllMarkets, useMarketCount } from "@/hooks/useChain";
import { Link } from "wouter";
import { Activity, Bot, CalendarX2, Clock, Loader2, Minus, Plus, ThumbsDown, ThumbsUp, TrendingUp, X, Zap } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ChainMarket } from "@/hooks/useChain";
import { useWallet } from "@/lib/wallet";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSettings } from "./settings";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const CATEGORIES = ["All", "Crypto", "Sports", "Politics", "Technology", "Science", "Economics", "Entertainment", "Other"] as const;
type Category = typeof CATEGORIES[number];

type AIAnalysis = {
  probabilityAssessment: string;
  keyFactors: string[];
  recommendation: "YES" | "NO" | "NEUTRAL";
  confidence: "Low" | "Medium" | "High";
  reasoning: string;
};

function extractCategory(question: string): string {
  const match = question.match(/^\[([^\]]+)\]/);
  return match ? match[1] : "Other";
}

function formatCountdown(endTimeSecs: bigint): string {
  const nowMs = Date.now();
  const endMs = Number(endTimeSecs) * 1000;
  const diffMs = endMs - nowMs;
  if (diffMs <= 0) return "Closing…";
  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function CountdownTimer({ endTime, status }: { endTime: bigint; status: ChainMarket["status"] }) {
  const [label, setLabel] = useState(() =>
    status === "open" ? formatCountdown(endTime) : ""
  );

  useEffect(() => {
    if (status !== "open") return;
    setLabel(formatCountdown(endTime));
    const id = setInterval(() => setLabel(formatCountdown(endTime)), 30_000);
    return () => clearInterval(id);
  }, [endTime, status]);

  const endDate = new Date(Number(endTime) * 1000);

  if (status === "open") {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
        <Clock className="w-3 h-3 shrink-0" />
        <span>Closes in {label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
      <CalendarX2 className="w-3 h-3 shrink-0" />
      <span>Ended {format(endDate, "MMM d, yyyy")}</span>
    </div>
  );
}

export function Home() {
  const { markets, isLoading } = useAllMarkets();
  const { data: marketCount } = useMarketCount();
  const { isConnected } = useWallet();
  const settings = getSettings();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<"active" | "ended">("active");
  const [categoryFilter, setCategoryFilter] = useState<Category>("All");
  const [aiModal, setAiModal] = useState<{ market: ChainMarket; analysis: AIAnalysis | null; loading: boolean } | null>(null);

  const activeMarkets = markets.filter((m) => m.status === "open");
  const endedMarkets = markets.filter((m) => m.status !== "open");
  const totalVolume = markets.reduce((s, m) => s + m.totalVolume, 0);

  const filteredActive = categoryFilter === "All"
    ? activeMarkets
    : activeMarkets.filter((m) => extractCategory(m.question) === categoryFilter);

  // Auto-expiry: schedule an immediate refetch exactly when each market closes.
  const expiryTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    expiryTimersRef.current.forEach(clearTimeout);
    expiryTimersRef.current = [];
    const nowMs = Date.now();
    for (const m of activeMarkets) {
      const endMs = Number(m.endTime) * 1000;
      const msUntilClose = endMs - nowMs;
      if (msUntilClose <= 0) {
        qc.invalidateQueries({ queryKey: ["markets", "all"] });
        continue;
      }
      const t = setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["markets", "all"] });
        qc.invalidateQueries({ queryKey: ["factory"] });
      }, msUntilClose);
      expiryTimersRef.current.push(t);
    }
    return () => { expiryTimersRef.current.forEach(clearTimeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markets, qc]);

  const openAiInsight = async (market: ChainMarket, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAiModal({ market, analysis: null, loading: true });
    try {
      const res = await fetch(`${API_BASE}/api/ai-insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: market.question,
          yesProb: Math.round(market.yesPrice * 100),
          noProb: Math.round(market.noPrice * 100),
          totalVolume: market.totalVolume.toFixed(2),
          status: market.status,
          endTime: market.endTime.toString(),
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAiModal((prev) => prev ? { ...prev, analysis: data.analysis, loading: false } : null);
      } else {
        setAiModal((prev) => prev ? { ...prev, loading: false } : null);
      }
    } catch {
      setAiModal((prev) => prev ? { ...prev, loading: false } : null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded" />)}
        </div>
        <div className="h-10 bg-muted rounded w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-52 bg-muted rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Active Markets" value={activeMarkets.length.toString()} icon={<Activity className="w-4 h-4" />} />
        <StatCard label="Total Volume" value={`$${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<TrendingUp className="w-4 h-4" />} />
        <StatCard label="Total Markets" value={(marketCount ? Number(marketCount) : markets.length).toString()} icon={<Zap className="w-4 h-4" />} />
      </div>

      {/* Empty state */}
      {markets.length === 0 && (
        <div className="border border-border rounded-lg py-24 text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-primary/30" />
          <h2 className="text-lg font-bold uppercase tracking-wider mb-2">No Markets Yet</h2>
          <p className="text-sm text-muted-foreground mb-6">
            ArcPredict is live on Arc Testnet — be the first to create a market.
          </p>
          {isConnected && settings.publicMarketCreation ? (
            <Link href="/markets/new" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Create First Market
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Connect wallet to create a market</p>
          )}
        </div>
      )}

      {markets.length > 0 && (
        <>
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-border">
            <TabButton
              active={activeTab === "active"}
              onClick={() => setActiveTab("active")}
              label="Active"
              count={activeMarkets.length}
              accent
            />
            <TabButton
              active={activeTab === "ended"}
              onClick={() => setActiveTab("ended")}
              label="Ended"
              count={endedMarkets.length}
            />
            {isConnected && settings.publicMarketCreation && (
              <Link
                href="/markets/new"
                className="ml-auto mb-0.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
              >
                <Plus className="w-3 h-3" /> New
              </Link>
            )}
          </div>

          {/* Active tab */}
          {activeTab === "active" && (
            <div className="space-y-6">
              {/* Category filters */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      "px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider border transition-all",
                      categoryFilter === cat
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {cat}
                    {cat !== "All" && (
                      <span className="ml-1 opacity-60">
                        ({activeMarkets.filter((m) => extractCategory(m.question) === cat).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {filteredActive.length === 0 ? (
                <div className="border border-border rounded py-16 text-center text-sm text-muted-foreground">
                  No active {categoryFilter !== "All" ? categoryFilter : ""} markets right now.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredActive.map((m) => (
                    <MarketCard key={m.address} market={m} onAiInsight={openAiInsight} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ended tab */}
          {activeTab === "ended" && (
            <div className="space-y-4">
              {endedMarkets.length === 0 ? (
                <div className="border border-border rounded py-16 text-center text-sm text-muted-foreground">
                  No ended markets yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {endedMarkets.map((m) => (
                    <MarketCard key={m.address} market={m} onAiInsight={openAiInsight} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* AI Insights Modal */}
      {aiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAiModal(null)} />
          <div className="relative z-10 w-full max-w-lg border border-border bg-card rounded overflow-hidden shadow-2xl">
            <div className="h-1 bg-primary w-full" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">AI Insight</span>
                </div>
                <button onClick={() => setAiModal(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm font-semibold mb-4 line-clamp-2 text-foreground leading-snug">
                {aiModal.market.question}
              </p>

              {aiModal.loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Analyzing market...</p>
                </div>
              ) : aiModal.analysis ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded font-bold text-sm uppercase tracking-wider",
                      aiModal.analysis.recommendation === "YES"
                        ? "bg-market-yes/15 text-market-yes border border-market-yes/30"
                        : aiModal.analysis.recommendation === "NO"
                        ? "bg-market-no/15 text-market-no border border-market-no/30"
                        : "bg-muted text-muted-foreground border border-border"
                    )}>
                      {aiModal.analysis.recommendation === "YES" && <ThumbsUp className="w-3.5 h-3.5" />}
                      {aiModal.analysis.recommendation === "NO" && <ThumbsDown className="w-3.5 h-3.5" />}
                      {aiModal.analysis.recommendation === "NEUTRAL" && <Minus className="w-3.5 h-3.5" />}
                      {aiModal.analysis.recommendation}
                    </div>
                    <div className={cn(
                      "text-xs px-2 py-1 rounded border uppercase tracking-wider font-semibold",
                      aiModal.analysis.confidence === "High"
                        ? "border-market-yes/30 text-market-yes bg-market-yes/10"
                        : aiModal.analysis.confidence === "Medium"
                        ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10"
                        : "border-border text-muted-foreground bg-muted"
                    )}>
                      {aiModal.analysis.confidence} confidence
                    </div>
                  </div>

                  <div className="bg-secondary/30 rounded p-3 border border-border">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Summary</div>
                    <p className="text-sm text-foreground leading-relaxed">{aiModal.analysis.reasoning}</p>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Probability Assessment</div>
                    <p className="text-sm text-foreground leading-relaxed">{aiModal.analysis.probabilityAssessment}</p>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Key Factors</div>
                    <ul className="space-y-1.5">
                      {aiModal.analysis.keyFactors.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-primary font-mono text-[10px] mt-1 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                          <span className="text-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-[10px] text-muted-foreground border-t border-border pt-3">
                    AI analysis is for informational purposes only. Not financial advice.
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Failed to load AI insights. Please try again.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
  accent = false,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative px-4 pb-3 pt-1 text-xs font-bold uppercase tracking-widest transition-colors",
        active
          ? accent
            ? "text-primary"
            : "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      <span className={cn(
        "ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold",
        active && accent
          ? "bg-primary/15 text-primary"
          : active
          ? "bg-muted text-foreground"
          : "bg-muted/50 text-muted-foreground"
      )}>
        {count}
      </span>
      {active && (
        <span className={cn(
          "absolute bottom-0 left-0 right-0 h-px",
          accent ? "bg-primary" : "bg-foreground"
        )} />
      )}
    </button>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="border border-border bg-card p-4 rounded flex flex-col gap-2 hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest">
        {icon}{label}
      </div>
      <span className="text-2xl font-bold text-foreground font-mono">{value}</span>
    </div>
  );
}

function MarketCard({
  market,
  onAiInsight,
}: {
  market: ChainMarket;
  onAiInsight: (market: ChainMarket, e: React.MouseEvent) => void;
}) {
  const yesProb = Math.round(market.yesPrice * 100);
  const noProb = Math.round(market.noPrice * 100);
  const isOpen = market.status === "open";
  const isResolved = market.status === "resolved_yes" || market.status === "resolved_no";
  const category = extractCategory(market.question);
  const displayQuestion = market.question.replace(/^\[[^\]]+\]\s*/, "");

  return (
    <div className="flex flex-col group">
      <Link
        href={`/markets/${market.address}`}
        className="block border border-border bg-card rounded-t p-5 hover:border-primary transition-all hover:shadow-[0_0_15px_rgba(0,255,255,0.07)] relative overflow-hidden flex-1"
      >
        {/* Probability bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-border/50 flex">
          <div className="h-full bg-market-yes transition-all" style={{ width: `${yesProb}%` }} />
          <div className="h-full bg-market-no transition-all" style={{ width: `${noProb}%` }} />
        </div>

        <div className="flex justify-between items-start mb-2 mt-1 gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusBadge status={market.status} />
            <span className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider border border-border/50 rounded px-1.5 py-0.5">
              {category}
            </span>
          </div>
          <CountdownTimer endTime={market.endTime} status={market.status} />
        </div>

        <h3 className="font-bold text-base mb-4 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {displayQuestion}
        </h3>

        {isResolved ? (
          <div className={cn(
            "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded inline-block",
            market.status === "resolved_yes" ? "bg-market-yes/10 text-market-yes" : "bg-market-no/10 text-market-no"
          )}>
            Resolved: {market.status === "resolved_yes" ? "YES" : "NO"}
          </div>
        ) : isOpen ? (
          <div className="flex justify-between items-end">
            <div className="flex gap-4">
              <div>
                <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Yes</div>
                <div className="text-xl font-bold text-market-yes font-mono">{yesProb}%</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">No</div>
                <div className="text-xl font-bold text-market-no font-mono">{noProb}%</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              ${market.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} vol
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-end">
            <div className="flex gap-4 opacity-60">
              <div>
                <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Yes</div>
                <div className="text-xl font-bold text-market-yes font-mono">{yesProb}%</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">No</div>
                <div className="text-xl font-bold text-market-no font-mono">{noProb}%</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              ${market.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} vol
            </div>
          </div>
        )}
      </Link>

      <button
        onClick={(e) => onAiInsight(market, e)}
        className="flex items-center justify-center gap-1.5 border border-t-0 border-border bg-card/50 hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground rounded-b"
      >
        <Bot className="w-3.5 h-3.5" />
        AI Insight
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: ChainMarket["status"] }) {
  if (status === "open") return (
    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-market-yes/10 text-market-yes border border-market-yes/20">
      Live
    </span>
  );
  if (status === "ended") return (
    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
      Ended
    </span>
  );
  return (
    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
      Resolved
    </span>
  );
}
