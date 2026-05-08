import { useState, useEffect, ReactNode } from "react";
import { CheckCircle2, Twitter, Wallet, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useWallet } from "@/lib/wallet";
import { usePoints } from "@/contexts/PointsContext";

const ARC_CHAIN_ID = 5042002;
const ARC_CHAIN_ID_HEX = "0x4cef52";

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

function StepIndicator({ step, current }: { step: number; current: number }) {
  const done = step < current;
  const active = step === current;
  return (
    <div className="flex items-center gap-1">
      <div
        className={cn(
          "w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all",
          done
            ? "border-market-yes bg-market-yes text-market-yes-foreground"
            : active
            ? "border-primary bg-primary/10 text-primary"
            : "border-border text-muted-foreground"
        )}
      >
        {done ? <CheckCircle2 className="w-4 h-4" /> : step}
      </div>
    </div>
  );
}

export function OnboardingGate({ children }: { children: ReactNode }) {
  const { address, isConnected, connect, isConnecting } = useWallet();
  const { onboarding, onboardingComplete, markStep, refresh } = usePoints();

  const [xHandleInput, setXHandleInput] = useState("");
  const [xHandleError, setXHandleError] = useState("");
  const [followClicked, setFollowClicked] = useState(false);

  useEffect(() => {
    if (isConnected && address && !onboarding.walletConnected) {
      markStep("walletConnected");
    }
  }, [isConnected, address, onboarding.walletConnected, markStep]);

  useEffect(() => {
    refresh();
  }, [address, refresh]);

  if (onboardingComplete) return <>{children}</>;

  const currentStep = !onboarding.walletConnected
    ? 1
    : !onboarding.followed
    ? 2
    : 3;

  const handleFollow = () => {
    window.open(
      "https://twitter.com/intent/follow?screen_name=Arc_predict",
      "_blank",
      "noopener,noreferrer"
    );
    setFollowClicked(true);
  };

  const handleMarkFollowed = () => {
    markStep("followed");
  };

  const handleVerify = () => {
    const handle = xHandleInput.replace(/^@/, "").trim();
    if (!handle || handle.length < 1) {
      setXHandleError("Please enter your X (Twitter) handle.");
      return;
    }
    if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
      setXHandleError("Invalid handle — only letters, numbers and underscores, max 15 chars.");
      return;
    }
    setXHandleError("");
    markStep("verified", handle);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 text-primary font-bold text-xl mb-10 justify-center">
          <img src="/logo.png" alt="ArcPredict" className="h-9 w-9 rounded-sm object-cover" />
          ARC_PREDICT
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 justify-center mb-10">
          <StepIndicator step={1} current={currentStep} />
          <div className={cn("flex-1 h-px max-w-[60px] transition-colors", currentStep > 1 ? "bg-market-yes" : "bg-border")} />
          <StepIndicator step={2} current={currentStep} />
          <div className={cn("flex-1 h-px max-w-[60px] transition-colors", currentStep > 2 ? "bg-market-yes" : "bg-border")} />
          <StepIndicator step={3} current={currentStep} />
        </div>

        {/* Step content */}
        <div className="border border-border bg-card rounded-lg overflow-hidden shadow-xl">
          <div className="h-1 w-full bg-primary" />

          {currentStep === 1 && (
            <div className="p-8 text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
                <Wallet className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold uppercase tracking-wider mb-2">Connect Your Wallet</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Connect your MetaMask wallet to start predicting on Arc Testnet. You'll need it to place bets and create markets.
                </p>
              </div>
              <Button
                onClick={connect}
                disabled={isConnecting}
                className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {isConnecting ? "Connecting…" : "Connect MetaMask"}
              </Button>
              {!window.ethereum && (
                <p className="text-xs text-muted-foreground">
                  No wallet detected.{" "}
                  <a
                    href="https://metamask.io/download"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Install MetaMask
                  </a>
                </p>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="p-8 text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-[#1d9bf0]/10 border border-[#1d9bf0]/30 flex items-center justify-center mx-auto">
                <Twitter className="w-7 h-7 text-[#1d9bf0]" />
              </div>
              <div>
                <h2 className="text-lg font-bold uppercase tracking-wider mb-2">Follow Us on X</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Follow <span className="text-primary font-semibold">@Arc_predict</span> on X to stay updated with new markets, resolutions, and announcements.
                </p>
              </div>
              {!followClicked ? (
                <Button
                  onClick={handleFollow}
                  className="w-full bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold uppercase tracking-wider"
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  Follow @Arc_predict on X
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground">
                    Opened X in a new tab. Once you've followed, click below.
                  </div>
                  <Button
                    onClick={handleMarkFollowed}
                    className="w-full bg-market-yes hover:bg-market-yes/90 text-market-yes-foreground font-bold uppercase tracking-wider"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    I've Followed @Arc_predict
                  </Button>
                  <button
                    onClick={handleFollow}
                    className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2"
                  >
                    Open X again
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="p-8 space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-lg font-bold uppercase tracking-wider mb-2">Verify Your X Account</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enter your X (Twitter) handle to link your account and complete verification.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Your X Handle
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">@</span>
                    <Input
                      value={xHandleInput}
                      onChange={(e) => {
                        setXHandleInput(e.target.value.replace(/^@/, ""));
                        setXHandleError("");
                      }}
                      placeholder="your_handle"
                      className="pl-7 font-mono"
                      onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    />
                  </div>
                </div>
                {xHandleError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> {xHandleError}
                  </p>
                )}
              </div>
              <Button
                onClick={handleVerify}
                className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider"
              >
                Verify &amp; Enter ArcPredict
              </Button>
            </div>
          )}

          {/* Progress footer */}
          <div className="border-t border-border px-6 py-3 flex justify-between items-center bg-secondary/20">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Step {currentStep} of 3
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    s < currentStep
                      ? "bg-market-yes"
                      : s === currentStep
                      ? "bg-primary"
                      : "bg-border"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6">
          ARC_PREDICT · Arc Testnet · Chain ID 5042002
        </p>
      </div>
    </div>
  );
}
