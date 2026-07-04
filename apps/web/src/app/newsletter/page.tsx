"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type NL = { id: number; brand: string; subject: string; kind: string; received_at: string };
type Resp = { brands: string[]; items: NL[] };

const KINDS = ["Sales Promotions", "New Product Announcement", "Editorial / Blogs", "Others"];

export default function Newsletter() {
  const [brand, setBrand] = useState("");
  const [kind, setKind] = useState("");
  const [data, setData] = useState<Resp>({ brands: [], items: [] });

  useEffect(() => {
    const q = new URLSearchParams();
    if (brand) q.set("brand", brand);
    if (kind) q.set("kind", kind);
    api<Resp>(`/newsletters?${q}`, "newsletters").then(setData);
  }, [brand, kind]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-bold">Newsletter / Email Tracking</h1>

      <div className="flex gap-3">
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="border border-ink/15 rounded-lg px-3 py-1.5 text-sm bg-white">
          <option value="">All brands</option>
          {data.brands.map((b) => (<option key={b}>{b}</option>))}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="border border-ink/15 rounded-lg px-3 py-1.5 text-sm bg-white">
          <option value="">All types</option>
          {KINDS.map((k) => (<option key={k}>{k}</option>))}
        </select>
        <button className="btn ml-auto">Download all PDF</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {data.items.map((n) => (
          <div key={n.id} className="card p-5 space-y-2 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-ink text-white grid place-items-center text-xs font-bold">
                {n.brand[0]}
              </div>
              <div>
                <div className="font-medium text-sm">{n.brand}</div>
                <div className="text-xs text-ink/40">{new Date(n.received_at).toLocaleString()}</div>
              </div>
            </div>
            <span className="chip">{n.kind}</span>
            <div className="font-semibold leading-snug">{n.subject}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
