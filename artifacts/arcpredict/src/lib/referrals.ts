const PREFIX = "arcpredict_ref_";
const CODE_MAP = "arcpredict_ref_codes";
const PENDING_REF_KEY = "arcpredict_pending_ref";

interface RefData {
  code: string;
  count: number;
  totalEarned: number;
  pendingPoints: number;
  referredBy: string | null;
}

function refKey(addr: string) {
  return PREFIX + addr.toLowerCase();
}

function generateCode(addr: string): string {
  return addr.toLowerCase().slice(2, 10);
}

function loadRefData(addr: string): RefData {
  try {
    const raw = localStorage.getItem(refKey(addr));
    if (raw) return JSON.parse(raw) as RefData;
  } catch {}
  return {
    code: generateCode(addr),
    count: 0,
    totalEarned: 0,
    pendingPoints: 0,
    referredBy: null,
  };
}

function saveRefData(addr: string, data: RefData): void {
  try {
    localStorage.setItem(refKey(addr), JSON.stringify(data));
    const mapRaw = localStorage.getItem(CODE_MAP);
    const map: Record<string, string> = mapRaw ? JSON.parse(mapRaw) : {};
    map[data.code] = addr.toLowerCase();
    localStorage.setItem(CODE_MAP, JSON.stringify(map));
  } catch {}
}

function resolveCode(code: string): string | null {
  try {
    const mapRaw = localStorage.getItem(CODE_MAP);
    if (!mapRaw) return null;
    const map: Record<string, string> = JSON.parse(mapRaw);
    return map[code] ?? null;
  } catch {
    return null;
  }
}

export async function apiRegisterRef(address: string): Promise<string | null> {
  const data = loadRefData(address);
  saveRefData(address, data);
  return data.code;
}

export async function apiCompleteReferral(
  refCode: string,
  newUserAddress: string
): Promise<boolean> {
  const referrerAddr = resolveCode(refCode);
  if (!referrerAddr || referrerAddr === newUserAddress.toLowerCase()) return false;

  const referrerData = loadRefData(referrerAddr);
  referrerData.count += 1;
  referrerData.pendingPoints += 100;
  referrerData.totalEarned += 100;
  saveRefData(referrerAddr, referrerData);

  const newUserData = loadRefData(newUserAddress);
  if (!newUserData.referredBy) {
    newUserData.referredBy = referrerAddr;
    saveRefData(newUserAddress, newUserData);
  }
  return true;
}

export async function apiCollectPoints(address: string): Promise<number> {
  const data = loadRefData(address);
  const pts = data.pendingPoints;
  if (pts === 0) return 0;
  data.pendingPoints = 0;
  saveRefData(address, data);
  return pts;
}

export async function apiGetReferralStats(address: string): Promise<{
  code: string;
  count: number;
  totalEarned: number;
  pendingPoints: number;
  referredBy: string | null;
} | null> {
  const data = loadRefData(address);
  saveRefData(address, data);
  return data;
}

export function getRefCodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("ref");
}

export function buildReferralLink(code: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  return `${window.location.origin}${base.replace(/\/$/, "")}/?ref=${code}`;
}

export function storePendingRef(code: string): void {
  try {
    localStorage.setItem(PENDING_REF_KEY, code);
  } catch {}
}

export function getPendingRef(): string | null {
  try {
    return localStorage.getItem(PENDING_REF_KEY);
  } catch {
    return null;
  }
}

export function clearPendingRef(): void {
  try {
    localStorage.removeItem(PENDING_REF_KEY);
  } catch {}
}
