"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const RANGES = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "ALL", days: 100000 },
];

export default function PriceChart({
  history: full,
}: {
  history: { date: string; brand_price: number; retailer_price: number; promo: string }[];
}) {
  const [days, setDays] = useState(30);
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const history = full.filter((h) => h.date >= cutoff);
  return (
    <div>
      <div className="flex gap-1 mb-3">
        {RANGES.map((r) => (
          <button
            key={r.label}
            onClick={() => setDays(r.days)}
            className={`px-3 py-1 rounded-lg border text-xs font-medium ${
              days === r.days ? "bg-ink text-white border-ink" : "border-ink/15 hover:bg-ink/5"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="h-72">
      <ResponsiveContainer>
        <LineChart data={history} margin={{ left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#00000012" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={40} />
          <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
          <Tooltip />
          <Line type="monotone" dataKey="brand_price" name="Brand" stroke="#141414" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="retailer_price" name="Retailer" stroke="#7fb332" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
