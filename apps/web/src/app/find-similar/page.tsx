"use client";

import { useState } from "react";
import type { ProductT } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { MOCK } from "@/lib/mock";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Result = { tags: Record<string, unknown>; matches: ProductT[] };

export default function FindSimilar() {
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${BASE}/find-similar`, { method: "POST", body: fd });
      setResult(await res.json());
    } catch {
      setResult({ tags: { category: "Woman - Accessories - Bag", colors: ["Brown"], style: "Shoulder bag", material: "Leather", source: "mock" }, matches: MOCK.similar as ProductT[] });
    }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-bold">Find Similar Product</h1>
        <p className="text-ink/50 text-sm mt-1">Upload your own product — we tag it and find similar tracked products.</p>
      </div>

      <label className="block border-2 border-dashed border-ink/20 rounded-xl p-16 text-center cursor-pointer hover:border-accentDark hover:bg-accent/5 transition-colors">
        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <div className="text-4xl mb-2">＋</div>
        <div className="text-ink/50">{busy ? "Analyzing image…" : "Drag your image here or click to upload"}</div>
      </label>

      {result && (
        <>
          <div className="card p-5">
            <h2 className="font-semibold mb-3">
              Detected attributes
              <span className="ml-2 text-xs text-ink/40 font-normal">
                {result.tags.source === "claude" ? "tagged by Claude" : "sample tags — set ANTHROPIC_API_KEY for live"}
              </span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.tags).filter(([k]) => k !== "source").map(([k, v]) => (
                <span key={k} className="chip"><b className="mr-1">{k}:</b> {Array.isArray(v) ? v.join(", ") : String(v)}</span>
              ))}
            </div>
          </div>
          <h2 className="font-semibold">Similar products</h2>
          <div className="grid grid-cols-3 gap-4">
            {result.matches.map((p) => (<ProductCard key={p.id} product={p} />))}
          </div>
        </>
      )}
    </div>
  );
}
