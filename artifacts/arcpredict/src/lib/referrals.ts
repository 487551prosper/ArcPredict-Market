const API = import.meta.env.VITE_API_URL ?? "http://localhost:8082";

export async function apiRegisterRef(address: string): Promise<string | null> {
  try {
    const res = await fetch(`${API}/api/referrals/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    const data = await res.json();
    return data.code ?? null;
  } catch {
    return null;
  }
}

export async function apiCompleteReferral(refCode: string, newUserAddress: string): Promise<boolean> {
  try {
    const res = await fetch(`${API}/api/referrals/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refCode, newUserAddress }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export async function apiCollectPoints(address: string): Promise<number> {
  try {
    const res = await fetch(`${API}/api/referrals/collect/${address}`, {
      method: "POST",
    });
    const data = await res.json();
    return data.collected ?? 0;
  } catch {
    return 0;
  }
}

export async function apiGetReferralStats(address: string): Promise<{
  code: string;
  count: number;
  totalEarned: number;
  pendingPoints: number;
  referredBy: string | null;
} | null> {
  try {
    const res = await fetch(`${API}/api/referrals/stats/${address}`);
    return await res.json();
  } catch {
    return null;
  }
}

export function getRefCodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("ref");
}

export function buildReferralLink(code: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  return `${window.location.origin}${base.replace(/\/$/, "")}/?ref=${code}`;
}

const PENDING_REF_KEY = "arcpredict_pending_ref";

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
