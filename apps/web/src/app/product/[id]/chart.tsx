"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function PriceChart({
  history,
}: {
  history: { date: string; brand_price: number; retailer_price: number; promo: string }[];
}) {
  return (
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
  );
}
