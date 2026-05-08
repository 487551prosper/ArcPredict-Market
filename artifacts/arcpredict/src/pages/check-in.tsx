import { useState } from "react";
import { CalendarDays, CheckCircle2, Flame, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePoints } from "@/contexts/PointsContext";
import { useWallet } from "@/lib/wallet";
import { getCheckInDates } from "@/lib/points";
import { toast } from "sonner";
import { Link } from "wouter";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function CheckIn() {
  const { isConnected, address } = useWallet();
  const { streak, lastCheckIn, points, checkIn } = usePoints();
  const [claimed, setClaimed] = useState(false);
  const [lastBonus, setLastBonus] = useState<number | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const alreadyCheckedIn = lastCheckIn === today;

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const checkInDates = address ? getCheckInDates(address) : new Set<string>();

  const { firstDay, daysInMonth } = getCalendarDays(viewYear, viewMonth);

  const handleCheckIn = () => {
    const result = checkIn();
    if (result.already) {
      toast.info("Already checked in today. Come back tomorrow!");
      return;
    }
    setLastBonus(result.bonus);
    setClaimed(true);
    toast.success(`+${result.bonus} points! ${result.bonus >= 60 ? "🔥 7-day streak bonus!" : "Keep the streak going!"}`);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const nextStreakMilestone = streak === 0 ? 7 : 7 - (streak % 7);
  const streakProgress = streak % 7;

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <CalendarDays className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
        <h2 className="text-lg font-bold uppercase tracking-wider mb-2">Daily Check-In</h2>
        <p className="text-sm text-muted-foreground mb-6">Connect your wallet to earn daily points and track your streak.</p>
        <Link href="/" className="text-primary text-xs uppercase tracking-wider font-semibold hover:underline">Back to Markets</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500 space-y-8">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider">Daily Check-In</h1>
          <p className="text-sm text-muted-foreground">Earn points every day. Bigger bonuses for streaks.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border border-border bg-card rounded p-4 text-center">
          <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <div className="text-2xl font-bold font-mono">{streak}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Day Streak</div>
        </div>
        <div className="border border-border bg-card rounded p-4 text-center">
          <Zap className="w-5 h-5 text-primary mx-auto mb-1" />
          <div className="text-2xl font-bold font-mono">{points}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Total Points</div>
        </div>
        <div className="border border-border bg-card rounded p-4 text-center">
          <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <div className="text-2xl font-bold font-mono">{nextStreakMilestone}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Days to Bonus</div>
        </div>
      </div>

      {/* Streak progress bar */}
      <div className="border border-border bg-card rounded p-5 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">7-Day Streak Progress</span>
          <span className="text-xs font-mono text-primary">{streakProgress}/7 → +60 pts</span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-2 rounded-full transition-all",
                i < streakProgress ? "bg-primary" : "bg-secondary"
              )}
            />
          ))}
        </div>
        <div className="flex justify-between">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
            <span
              key={d}
              className={cn(
                "text-[9px] uppercase tracking-wider text-center flex-1",
                i < streakProgress ? "text-primary" : "text-muted-foreground"
              )}
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Check-in button */}
      <div className="border border-border bg-card rounded p-6 text-center space-y-4">
        {alreadyCheckedIn || claimed ? (
          <div className="space-y-3">
            <CheckCircle2 className="w-12 h-12 text-market-yes mx-auto" />
            <div>
              <p className="font-bold uppercase tracking-wider">Checked in today!</p>
              {lastBonus !== null && (
                <p className="text-sm text-muted-foreground mt-1">
                  You earned <span className="text-primary font-bold">+{lastBonus} pts</span> this check-in.
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Come back tomorrow to keep your streak going.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="font-bold uppercase tracking-wider">Ready for today's check-in?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Earn <span className="text-primary font-semibold">+10 pts</span> today
                {nextStreakMilestone === 1 && (
                  <span className="text-yellow-400 font-semibold"> + 50 streak bonus!</span>
                )}
              </p>
            </div>
            <Button
              onClick={handleCheckIn}
              className="bg-primary text-primary-foreground font-bold uppercase tracking-wider px-8"
            >
              <Zap className="w-4 h-4 mr-2" />
              Claim Daily Points
            </Button>
          </div>
        )}
      </div>

      {/* Points rewards table */}
      <div className="border border-border rounded overflow-hidden">
        <div className="bg-secondary/50 px-4 py-3 border-b border-border">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Point Rewards</h3>
        </div>
        <div className="divide-y divide-border">
          {[
            { action: "Daily check-in", pts: "+10", icon: <CalendarDays className="w-3.5 h-3.5" /> },
            { action: "Place a bet", pts: "+5", icon: <Zap className="w-3.5 h-3.5" /> },
            { action: "Win a bet", pts: "+20", icon: <Star className="w-3.5 h-3.5 text-yellow-400" /> },
            { action: "Create a market", pts: "+15", icon: <Flame className="w-3.5 h-3.5" /> },
            { action: "7-day streak bonus", pts: "+50", icon: <Flame className="w-3.5 h-3.5 text-orange-400" /> },
          ].map(({ action, pts, icon }) => (
            <div key={action} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {icon}
                {action}
              </div>
              <span className="text-sm font-bold font-mono text-primary">{pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="border border-border bg-card rounded overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button onClick={prevMonth} className="text-muted-foreground hover:text-foreground px-2 py-1 text-sm">‹</button>
          <h3 className="text-xs font-bold uppercase tracking-widest">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h3>
          <button
            onClick={nextMonth}
            disabled={viewYear === now.getFullYear() && viewMonth === now.getMonth()}
            className="text-muted-foreground hover:text-foreground px-2 py-1 text-sm disabled:opacity-30"
          >›</button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 mb-2">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-[10px] text-muted-foreground uppercase text-center py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = toDateStr(viewYear, viewMonth, day);
              const isChecked = checkInDates.has(dateStr);
              const isToday = dateStr === today;
              const isFuture = dateStr > today;
              return (
                <div
                  key={day}
                  className={cn(
                    "aspect-square flex items-center justify-center text-xs rounded transition-all",
                    isChecked && "bg-primary/20 text-primary font-bold border border-primary/30",
                    isToday && !isChecked && "border border-primary text-primary",
                    isFuture && "text-muted-foreground/40",
                    !isChecked && !isToday && !isFuture && "text-muted-foreground"
                  )}
                >
                  {isChecked ? <CheckCircle2 className="w-3.5 h-3.5" /> : day}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
