import { useState, useEffect, ReactNode } from "react";
import { CheckCircle2, Circle, ExternalLink, Loader2, Twitter, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet } from "@/lib/wallet";
import { usePoints } from "@/contexts/PointsContext";

export function OnboardingGate({ children }: { children: ReactNode }) {
  const { address, isConnected, connect, isConnecting } = useWallet();
  const { onboarding, onboardingComplete, markStep, refresh } = usePoints();
  const [followOpened, setFollowOpened] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    refresh();
  }, [address, refresh]);

  useEffect(() => {
    if (isConnected && address && !onboarding.walletConnected) {
      markStep("walletConnected");
    }
  }, [isConnected, address, onboarding.walletConnected, markStep]);

  if (onboardingComplete) return <>{children}</>;

  const step1Done = onboarding.walletConnected;
  const step2Done = onboarding.followed;
  const step3Done = onboarding.verified;

  const handleFollow = () => {
    window.open(
      "https://twitter.com/intent/follow?screen_name=Arc_predict",
      "_blank",
      "noopener,noreferrer"
    );
    setFollowOpened(true);
    markStep("followed");
  };

  const handleConfirmFollow = () => {
    setEntering(true);
    setTimeout(() => markStep("verified"), 600);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className={cn("relative z-10 w-full max-w-md transition-all duration-700", entering && "scale-95 opacity-0")}>

        {/* Logo + name */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg scale-110" />
            <img
              src="/logo.png"
              alt="ArcPredict"
              className="relative h-16 w-16 rounded-xl object-cover border border-primary/30 shadow-lg"
            />
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold tracking-[0.15em] text-primary">
              ARC<span className="text-foreground">_</span>PREDICT
            </div>
          </div>
        </div>

        {/* Welcome card */}
        <div className="border border-border bg-card/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl">
          {/* Top accent bar */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

          {/* Welcome message */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-border/50">
            <h1 className="text-base font-bold uppercase tracking-widest text-foreground mb-2">
              Welcome to ArcPredict
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AI Powered Prediction Markets on Arc Blockchain
            </p>
          </div>

          {/* Steps */}
          <div className="px-8 py-6 space-y-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-5">
              Complete to access markets
            </p>

            {/* Step 1 — Connect Wallet */}
            <Step
              number={1}
              title="Connect Wallet"
              description="Link your MetaMask to Arc Testnet"
              done={step1Done}
              active={!step1Done}
            >
              {!step1Done && (
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 px-4 rounded text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {isConnecting ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting…</>
                  ) : (
                    <><Wallet className="w-3.5 h-3.5" /> Connect MetaMask</>
                  )}
                </button>
              )}
              {!step1Done && !window.ethereum && (
                <a
                  href="https://metamask.io/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> Install MetaMask
                </a>
              )}
            </Step>

            {/* Connector */}
            <StepConnector filled={step1Done} />

            {/* Step 2 — Follow on X */}
            <Step
              number={2}
              title="Follow @Arc_predict on X"
              description="Stay updated with markets and announcements"
              done={step2Done}
              active={step1Done && !step2Done}
              locked={!step1Done}
            >
              {step1Done && !step2Done && (
                <button
                  onClick={handleFollow}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white py-2.5 px-4 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <Twitter className="w-3.5 h-3.5" />
                  Follow @Arc_predict on X
                </button>
              )}
            </Step>

            {/* Connector */}
            <StepConnector filled={step2Done} />

            {/* Step 3 — Confirm follow */}
            <Step
              number={3}
              title="Confirm Follow"
              description="Let us know you've followed"
              done={step3Done}
              active={step2Done && !step3Done}
              locked={!step2Done}
            >
              {step2Done && !step3Done && (
                <button
                  onClick={handleConfirmFollow}
                  className="mt-3 w-full flex items-center justify-center gap-2 border border-market-yes/60 bg-market-yes/10 text-market-yes hover:bg-market-yes/20 py-2.5 px-4 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  I Followed @Arc_predict
                </button>
              )}
              {step2Done && !step3Done && !followOpened && (
                <button
                  onClick={handleFollow}
                  className="mt-2 flex items-center justify-center gap-1 w-full text-[10px] text-muted-foreground hover:text-primary transition-colors"
                >
                  <Twitter className="w-3 h-3" /> Didn't open? Click to follow first
                </button>
              )}
            </Step>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border/50 px-8 py-4 flex items-center justify-between bg-secondary/10">
            <div className="flex gap-1.5">
              {[step1Done, step2Done, step3Done].map((done, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all duration-500",
                    done ? "w-6 bg-primary" : "w-3 bg-border"
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
              {[step1Done, step2Done, step3Done].filter(Boolean).length} / 3 complete
            </span>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6 tracking-wider">
          ARC_PREDICT · Arc Testnet · Chain ID 5042002
        </p>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  done,
  active,
  locked = false,
  children,
}: {
  number: number;
  title: string;
  description: string;
  done: boolean;
  active: boolean;
  locked?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all duration-300",
        done && "border-primary/30 bg-primary/5",
        active && !done && "border-primary/50 bg-primary/5 shadow-[0_0_16px_-4px_hsl(var(--primary)/0.2)]",
        locked && "border-border/40 opacity-40 select-none"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="shrink-0 mt-0.5">
          {done ? (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          ) : active ? (
            <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
              <span className="text-[9px] font-bold text-primary">{number}</span>
            </div>
          ) : (
            <Circle className="w-5 h-5 text-border" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={cn("text-xs font-bold uppercase tracking-wider", done ? "text-primary" : active ? "text-foreground" : "text-muted-foreground")}>
            {title}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
            {description}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function StepConnector({ filled }: { filled: boolean }) {
  return (
    <div className="flex items-center pl-[22px]">
      <div className={cn("w-px h-4 transition-colors duration-500", filled ? "bg-primary/50" : "bg-border/50")} />
    </div>
  );
}
