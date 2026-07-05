import { api } from "@/lib/api";
import ScopeBar from "@/components/ScopeBar";
import ProductCard from "@/components/ProductCard";
import CategoryChart from "./chart";
import type { ProductT } from "@/lib/api";

type Dash = {
  preference: { categories: string[]; competitors: string[]; price_tier: string };
  stats: { all_items: number; new_items: number; sales_items: number };
  movers: ProductT[];
  categories: { category: string; count: number; avg_change: number }[];
};

export default async function Dashboard() {
  const d = await api<Dash>("/dashboard", "dashboard");
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold">Overview Dashboard</h1>
          <p className="text-ink/50 mt-1 text-sm">See how your profile insights change over time</p>
        </div>
        <div className="flex gap-1 text-sm">
          {["1 week", "1 month", "3 months", "6 months", "1 year"].map((t, i) => (
            <span key={t} className={`px-3 py-1.5 rounded-lg border ${i === 0 ? "bg-ink text-white border-ink" : "border-ink/15"}`}>{t}</span>
          ))}
        </div>
      </header>

      <ScopeBar
        categories={d.preference.categories}
        competitors={d.preference.competitors}
        priceTier={d.preference.price_tier}
      />

      <div className="grid grid-cols-3 gap-4">
        <Stat label="All items" value={d.stats.all_items} />
        <Stat label="New items" value={d.stats.new_items} accent />
        <Stat label="Sales items" value={d.stats.sales_items} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Category momentum</h2>
          <CategoryChart data={d.categories} />
        </div>
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Top movers</h2>
          <div className="grid grid-cols-2 gap-3">
            {d.movers.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`card p-5 ${accent ? "bg-accent border-transparent text-white" : ""}`}>
      <div className={`text-sm ${accent ? "text-white/70" : "text-ink/50"}`}>{label}</div>
      <div className="font-display text-3xl font-extrabold mt-1">{value.toLocaleString()}</div>
    </div>
  );
}
