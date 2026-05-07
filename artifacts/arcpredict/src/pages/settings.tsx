import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Settings, ShieldCheck, Users } from "lucide-react";

const SETTINGS_KEY = "arcpredict_settings";

export function getSettings(): { publicMarketCreation: boolean } {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { publicMarketCreation: true };
}

function saveSettings(settings: { publicMarketCreation: boolean }) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function Settings_() {
  const [publicMarketCreation, setPublicMarketCreation] = useState(true);

  useEffect(() => {
    const s = getSettings();
    setPublicMarketCreation(s.publicMarketCreation);
  }, []);

  const toggle = (val: boolean) => {
    setPublicMarketCreation(val);
    saveSettings({ publicMarketCreation: val });
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Markets
      </Link>

      <div className="border border-border bg-card rounded overflow-hidden">
        <div className="h-1 bg-primary w-full" />
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-1">
            <Settings className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold uppercase tracking-wider">Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-8">
            Configure platform behaviour. Settings are stored locally in your browser.
          </p>

          <div className="space-y-6">
            <div className="border border-border rounded p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <ShieldCheck className="w-4 h-4" />
                Market Creation Access
              </div>

              <div className="space-y-3">
                <ToggleOption
                  active={!publicMarketCreation}
                  onClick={() => toggle(false)}
                  icon={<ShieldCheck className="w-4 h-4 text-primary" />}
                  title="Admin Only"
                  description="Only admins can create new prediction markets. Public users can only trade."
                />
                <ToggleOption
                  active={publicMarketCreation}
                  onClick={() => toggle(true)}
                  icon={<Users className="w-4 h-4 text-market-yes" />}
                  title="Public Creation"
                  description="Any connected wallet can create new prediction markets on Arc Testnet."
                />
              </div>

              <div className="bg-secondary/30 border border-border rounded p-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Current setting: </span>
                {publicMarketCreation
                  ? "Public — all connected wallets can create markets."
                  : "Admin only — the create market option is hidden from public users."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleOption({
  active,
  onClick,
  icon,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start gap-3 p-4 rounded border transition-all ${
        active
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40"
      }`}
    >
      <div className={`mt-0.5 ${active ? "opacity-100" : "opacity-40"}`}>{icon}</div>
      <div>
        <div className={`text-sm font-bold uppercase tracking-wider mb-0.5 ${active ? "text-foreground" : "text-muted-foreground"}`}>
          {title}
        </div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <div className="ml-auto mt-1">
        <div className={`w-4 h-4 rounded-full border-2 transition-all ${active ? "border-primary bg-primary" : "border-border"}`} />
      </div>
    </button>
  );
}
