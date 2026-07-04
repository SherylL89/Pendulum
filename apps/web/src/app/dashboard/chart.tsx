"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function CategoryChart({ data }: { data: { category: string; count: number; avg_change: number }[] }) {
  const rows = data.map((d) => ({ ...d, short: d.category.replace("Woman - ", "W·").replace("Man - ", "M·") }));
  return (
    <div className="h-72">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#00000012" />
          <XAxis dataKey="short" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v: number, n: string) => [n === "avg_change" ? `${v}%` : v, n === "avg_change" ? "avg change" : "items"]} />
          <Bar dataKey="avg_change" radius={[6, 6, 0, 0]}>
            {rows.map((r, i) => (
              <Cell key={i} fill={r.avg_change >= 0 ? "#b7f34d" : "#141414"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
