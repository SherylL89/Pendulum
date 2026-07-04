"use client";

import { useEffect, useState } from "react";
import { API_BASE, api, post } from "@/lib/api";

type Report = { id: number; title: string; kind: string; season: string; summary: string; body: string };

export default function Trends() {
  const [tab, setTab] = useState<"industry" | "social">("industry");
  const [reports, setReports] = useState<Report[]>([]);
  const [generating, setGenerating] = useState(false);
  const [open, setOpen] = useState<Report | null>(null);

  const load = () => api<Report[]>("/trends", "trends").then(setReports);
  useEffect(() => { load(); }, []);

  async function generate() {
    setGenerating(true);
    await post("/trends/generate");
    await load();
    setGenerating(false);
  }

  const shown = reports.filter((r) => r.kind === tab || r.season === "Generated");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-bold">Trend Inspiration</h1>
        <button onClick={generate} disabled={generating} className="btn-accent">
          {generating ? "Generating…" : "✦ Generate AI report"}
        </button>
      </div>

      <div className="flex gap-6 border-b border-ink/10 text-sm font-semibold uppercase tracking-wide">
        {(["industry", "social"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 ${tab === t ? "border-b-2 border-ink" : "text-ink/40"}`}
          >
            {t === "industry" ? "Industry report" : "Social trend"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {shown.map((r) => (
          <div key={r.id} className="card p-5 space-y-2 hover:shadow-md transition-shadow">
            <div className="text-xs uppercase tracking-wide text-ink/40">{r.season}</div>
            <div className="font-semibold leading-snug">{r.title}</div>
            <p className="text-sm text-ink/60">{r.summary}</p>
            <div className="flex items-center gap-3 mt-2">
              <button onClick={() => setOpen(r)} className="btn !px-3 !py-1.5">View detail</button>
              <a href={`${API_BASE}/trends/${r.id}/pdf`} className="text-sm text-accentDark font-medium hover:underline">
                ↓ PDF
              </a>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 bg-ink/40 grid place-items-center p-8" onClick={() => setOpen(null)}>
          <div className="card max-w-2xl w-full p-8 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-2xl font-bold mb-2">{open.title}</h2>
            <p className="text-sm text-ink/50 mb-4">{open.summary}</p>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{open.body || "No body yet — generate a live report."}</div>
          </div>
        </div>
      )}
    </div>
  );
}
