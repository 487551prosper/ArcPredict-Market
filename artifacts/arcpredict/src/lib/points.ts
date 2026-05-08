const PREFIX = "arcpredict_pts_";
const ALL_KEY = "arcpredict_all_addrs";

export interface PointsEntry {
  action: string;
  amount: number;
  ts: number;
}

export interface UserPoints {
  address: string;
  total: number;
  streak: number;
  lastCheckIn: string | null;
  xHandle: string | null;
  onboarding: {
    walletConnected: boolean;
    followed: boolean;
    verified: boolean;
  };
  history: PointsEntry[];
}

function key(addr: string) {
  return PREFIX + addr.toLowerCase();
}

function defaults(addr: string): UserPoints {
  return {
    address: addr.toLowerCase(),
    total: 0,
    streak: 0,
    lastCheckIn: null,
    xHandle: null,
    onboarding: { walletConnected: false, followed: false, verified: false },
    history: [],
  };
}

export function loadPoints(addr: string): UserPoints {
  try {
    const raw = localStorage.getItem(key(addr));
    if (!raw) return defaults(addr);
    const parsed = JSON.parse(raw) as UserPoints;
    if (!parsed.onboarding) parsed.onboarding = { walletConnected: false, followed: false, verified: false };
    return parsed;
  } catch {
    return defaults(addr);
  }
}

function save(data: UserPoints) {
  try {
    localStorage.setItem(key(data.address), JSON.stringify(data));
    const raw = localStorage.getItem(ALL_KEY);
    const addrs: string[] = raw ? JSON.parse(raw) : [];
    if (!addrs.includes(data.address)) {
      addrs.push(data.address);
      localStorage.setItem(ALL_KEY, JSON.stringify(addrs));
    }
  } catch {}
}

export function awardPoints(addr: string, action: string, amount: number): UserPoints {
  const data = loadPoints(addr);
  data.total += amount;
  data.history.unshift({ action, amount, ts: Date.now() });
  if (data.history.length > 200) data.history = data.history.slice(0, 200);
  save(data);
  return data;
}

export function doCheckIn(addr: string): { data: UserPoints; bonus: number; already: boolean } {
  const data = loadPoints(addr);
  const today = new Date().toISOString().split("T")[0];
  if (data.lastCheckIn === today) return { data, bonus: 0, already: true };

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
  const continued = data.lastCheckIn === yesterday;
  const newStreak = continued ? data.streak + 1 : 1;

  const isSevenDay = newStreak > 0 && newStreak % 7 === 0;
  let bonus = 10;
  if (isSevenDay) bonus += 50;

  data.streak = newStreak;
  data.lastCheckIn = today;
  data.total += bonus;
  data.history.unshift({
    action: isSevenDay ? `Daily check-in (7-day streak bonus!)` : "Daily check-in",
    amount: bonus,
    ts: Date.now(),
  });
  save(data);
  return { data, bonus, already: false };
}

export function getCheckInDates(addr: string): Set<string> {
  const data = loadPoints(addr);
  const dates = new Set<string>();
  for (const entry of data.history) {
    if (entry.action.startsWith("Daily check-in")) {
      dates.add(new Date(entry.ts).toISOString().split("T")[0]);
    }
  }
  if (data.lastCheckIn) dates.add(data.lastCheckIn);
  return dates;
}

export function markOnboarding(
  addr: string,
  step: keyof UserPoints["onboarding"],
  xHandle?: string
): UserPoints {
  const data = loadPoints(addr);
  if (data.onboarding[step]) return data;
  data.onboarding[step] = true;
  if (xHandle) data.xHandle = xHandle;
  save(data);
  return data;
}

export function isOnboardingComplete(addr: string): boolean {
  const data = loadPoints(addr);
  return data.onboarding.walletConnected && data.onboarding.followed && data.onboarding.verified;
}

export function getAllLeaderboard(): UserPoints[] {
  try {
    const raw = localStorage.getItem(ALL_KEY);
    const addrs: string[] = raw ? JSON.parse(raw) : [];
    return addrs.map(loadPoints).sort((a, b) => b.total - a.total);
  } catch {
    return [];
  }
}
