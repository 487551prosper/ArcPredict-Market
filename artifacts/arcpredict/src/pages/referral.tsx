import { useState, useEffect } from "react";
import { CheckCircle2, Copy, Gift, Twitter, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet } from "@/lib/wallet";
import { awardPoints } from "@/lib/points";
import {
  apiGetReferralStats,
  apiCollectPoints,
  buildReferralLink,
} from "@/lib/referrals";
import { usePoints } from "@/contexts/PointsContext";

interface Stats {
  code: string;
  count: number;
  totalEarned: number;
  pendingPoints: number;
  referredBy: string | null;
}

export function Referral() {
  const { address } = useWallet();
  const { refresh } = usePoints();
  const [stats, setStats] = useState<Stats | null>(null);
  const [copied, setCopied] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [collected, setCollected] = useState<number | null>(null);

  useEffect(() => {
    if (!address) return;
    apiGetReferralStats(address).then((s) => {
      if (s) setStats(s);
    });
  }, [address]);

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-3">
        <Gift className="w-10 h-10 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Connect your wallet to see your referral link.</p>
      </div>
    );
  }

  const refLink = stats ? buildReferralLink(stats.code) : null;

  const handleCopy = () => {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCollect = async () => {
    if (!address || !stats?.pendingPoints) return;
    setCollecting(true);
    const pts = await apiCollectPoints(address);
    if (pts > 0) {
      awardPoints(address, `Referral bonus (${pts / 100} friend${pts > 100 ? "s" : ""})`, pts);
      refresh();
      setCollected(pts);
      setStats((prev) => prev ? { ...prev, pendingPoints: 0, totalEarned: prev.totalEarned } : prev);
    }
    setCollecting(false);
  };

  const handleShareX = () => {
    if (!refLink) return;
    const text = encodeURIComponent(
      `Join me on ArcPredict — AI-powered prediction markets on Arc Blockchain! Use my invite link to get started:`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(refLink)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 py-2">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          Refer &amp; Earn
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Share your invite link — earn <span className="text-primary font-semibold">100 pts</span> for every friend who completes onboarding.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Users className="w-4 h-4 text-primary" />}
          label="Friends Referred"
          value={stats?.count ?? 0}
        />
        <StatCard
          icon={<Zap className="w-4 h-4 text-primary" />}
          label="Points Earned"
          value={`${stats?.totalEarned ?? 0} pts`}
        />
      </div>

      {/* Pending collect banner */}
      {stats && stats.pendingPoints > 0 && collected === null && (
        <div className="border border-market-yes/40 bg-market-yes/5 rounded-lg p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-market-yes uppercase tracking-wider mb-0.5">
              Unclaimed Referral Reward
            </div>
            <div className="text-[10px] text-muted-foreground">
              {stats.pendingPoints} pts waiting — a friend just completed onboarding!
            </div>
          </div>
          <button
            onClick={handleCollect}
            disabled={collecting}
            className="shrink-0 bg-market-yes text-market-yes-foreground text-xs font-bold uppercase tracking-wider px-4 py-2 rounded hover:bg-market-yes/90 transition-colors disabled:opacity-60"
          >
            {collecting ? "Claiming…" : "Claim"}
          </button>
        </div>
      )}

      {collected !== null && (
        <div className="border border-primary/40 bg-primary/5 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
          <div>
            <div className="text-xs font-bold text-primary uppercase tracking-wider">
              +{collected} Points Collected!
            </div>
            <div className="text-[10px] text-muted-foreground">Added to your balance.</div>
          </div>
        </div>
      )}

      {/* Referral link card */}
      <div className="border border-border bg-card rounded-xl overflow-hidden">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="p-6 space-y-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Your Invite Link
          </div>

          {refLink ? (
            <div className="flex items-stretch gap-2">
              <div className="flex-1 bg-secondary/30 border border-border rounded px-3 py-2.5 text-[11px] font-mono text-muted-foreground truncate flex items-center">
                {refLink}
              </div>
              <button
                onClick={handleCopy}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded text-[11px] font-bold uppercase tracking-wider border transition-all",
                  copied
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-border/80"
                )}
              >
                {copied ? (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> Copied</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copy</>
                )}
              </button>
            </div>
          ) : (
            <div className="h-9 bg-secondary/20 rounded animate-pulse" />
          )}

          <button
            onClick={handleShareX}
            className="w-full flex items-center justify-center gap-2 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white py-2.5 px-4 rounded text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Twitter className="w-3.5 h-3.5" />
            Share on X (Twitter)
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="border border-border bg-card rounded-xl p-6 space-y-4">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">How It Works</div>
        <div className="space-y-3">
          {[
            { step: "1", text: "Copy your unique invite link above" },
            { step: "2", text: "Share it with friends on X, Telegram, or Discord" },
            { step: "3", text: "When they connect wallet + follow @Arc_predict, you earn 100 pts" },
            { step: "4", text: "Claim your points here — they stack with no limit!" },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[9px] font-bold text-primary">{step}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referred by */}
      {stats?.referredBy && (
        <div className="border border-border/50 rounded-lg px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <p className="text-[10px] text-muted-foreground">
            You joined via referral from{" "}
            <span className="font-mono text-primary">{stats.referredBy.slice(0, 10)}…</span>
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="border border-border bg-card rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}
