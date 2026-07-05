"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

/** On-demand ingestion: triggers a scrape/snapshot run and refreshes the page data. */
export default function SnapshotButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function run() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/admin/snapshot`, { method: "POST" });
      const d = await res.json();
      setMsg(
        d.mode === "live"
          ? `Scraped ${d.items} products from live sources`
          : `Updated ${d.items} products (demo mode — add SCRAPE_SOURCES for live scraping)`
      );
      router.refresh();
    } catch {
      setMsg("Refresh failed — is the API reachable?");
    }
    setBusy(false);
    setTimeout(() => setMsg(""), 6000);
  }

  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-sm text-ink/50">{msg}</span>}
      <button onClick={run} disabled={busy} className="btn-accent disabled:opacity-50">
        {busy ? "Refreshing data…" : "⟳ Refresh data"}
      </button>
    </div>
  );
}
