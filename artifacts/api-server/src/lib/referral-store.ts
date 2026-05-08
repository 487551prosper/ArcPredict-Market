import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "referral-data.json");

interface ReferralData {
  codeToAddress: Record<string, string>;
  referrals: Array<{ referrer: string; referee: string; ts: number }>;
  pendingPoints: Record<string, number>;
  referredBy: Record<string, string>;
}

function load(): ReferralData {
  try {
    if (fs.existsSync(FILE)) {
      return JSON.parse(fs.readFileSync(FILE, "utf-8")) as ReferralData;
    }
  } catch {}
  return { codeToAddress: {}, referrals: [], pendingPoints: {}, referredBy: {} };
}

function persist(data: ReferralData): void {
  try {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  } catch {}
}

let store = load();

export function registerCode(code: string, address: string): void {
  store.codeToAddress[code.toLowerCase()] = address.toLowerCase();
  persist(store);
}

export function resolveCode(code: string): string | null {
  return store.codeToAddress[code.toLowerCase()] ?? null;
}

export function completeReferral(referrerAddress: string, refereeAddress: string): boolean {
  const referee = refereeAddress.toLowerCase();
  const referrer = referrerAddress.toLowerCase();
  if (referee === referrer) return false;
  if (store.referredBy[referee]) return false;
  store.referredBy[referee] = referrer;
  store.referrals.push({ referrer, referee, ts: Date.now() });
  store.pendingPoints[referrer] = (store.pendingPoints[referrer] ?? 0) + 100;
  persist(store);
  return true;
}

export function collectPoints(address: string): number {
  const addr = address.toLowerCase();
  const pts = store.pendingPoints[addr] ?? 0;
  if (pts > 0) {
    delete store.pendingPoints[addr];
    persist(store);
  }
  return pts;
}

export function getReferralStats(address: string): {
  code: string;
  count: number;
  totalEarned: number;
  pendingPoints: number;
  referredBy: string | null;
} {
  const addr = address.toLowerCase();
  const code = addr.replace(/^0x/, "").slice(0, 8);
  const myReferrals = store.referrals.filter((r) => r.referrer === addr);
  return {
    code,
    count: myReferrals.length,
    totalEarned: myReferrals.length * 100,
    pendingPoints: store.pendingPoints[addr] ?? 0,
    referredBy: store.referredBy[addr] ?? null,
  };
}
