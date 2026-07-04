import { MOCK } from "./mock";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** Fetch from the API; fall back to bundled mock data when the API is down. */
export async function api<T>(path: string, mockKey: keyof typeof MOCK, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, { cache: "no-store", ...init });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as T;
  } catch {
    return MOCK[mockKey] as T;
  }
}

export async function post<T>(path: string, body?: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type ProductT = {
  id: number; name: string; brand: string; retailer: string; category: string;
  price: number; change_pct: number; sales_rank: number; review_rank: number;
  launch_date: string; attrs: Record<string, unknown>; image_hue: number;
  image_url?: string;
};

export const API_BASE = BASE;
