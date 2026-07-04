"use client";

import { useEffect, useState } from "react";
import { api, post, type ProductT } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

const SORTS = [
  { key: "sales", label: "Sales ranking" },
  { key: "review", label: "Review ranking" },
  { key: "newest", label: "Newest arrival" },
];

const COLORS = ["Black", "Brown", "Beige", "Blue", "Green", "Gold"];
const MATERIALS = ["Leather", "Cotton", "Velvet", "Wool", "Linen"];

export default function Performance() {
  const [sort, setSort] = useState("sales");
  const [category, setCategory] = useState<string>("");
  const [color, setColor] = useState("");
  const [material, setMaterial] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<ProductT[]>([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const q = new URLSearchParams();
    if (category) q.set("category", category);
    if (color) q.set("color", color);
    if (material) q.set("material", material);
    if (priceMax) q.set("price_max", priceMax);
    q.set("sort", sort);
    api<ProductT[]>(`/products?${q}`, "products").then(setProducts);
  }, [sort, category, color, material, priceMax]);

  const categories = Array.from(new Set(products.map((p) => p.category)));

  async function collect(p: ProductT) {
    await post(`/collections/1/collect`, { product_id: p.id });
    setToast(`Collected “${p.name}”`);
    setTimeout(() => setToast(""), 2000);
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-bold">Performance</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`px-3 py-1.5 rounded-lg border text-sm ${sort === s.key ? "bg-ink text-white border-ink" : "border-ink/15 hover:bg-ink/5"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="ml-auto border border-ink/15 rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button onClick={() => setShowFilters(!showFilters)} className="btn !py-1.5">
          More filters {(color || material || priceMax) && "•"}
        </button>
      </div>

      {showFilters && (
        <div className="card p-5 flex flex-wrap gap-6">
          <div>
            <div className="text-xs uppercase tracking-wide text-ink/40 font-semibold mb-2">Color</div>
            <div className="flex gap-1.5 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(color === c ? "" : c)}
                  className={`chip ${color === c ? "bg-ink text-white border-ink" : "hover:border-ink"}`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-ink/40 font-semibold mb-2">Material</div>
            <div className="flex gap-1.5 flex-wrap">
              {MATERIALS.map((m) => (
                <button key={m} onClick={() => setMaterial(material === m ? "" : m)}
                  className={`chip ${material === m ? "bg-ink text-white border-ink" : "hover:border-ink"}`}>{m}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-ink/40 font-semibold mb-2">Max price</div>
            <input value={priceMax} onChange={(e) => setPriceMax(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 500" className="border border-ink/15 rounded-lg px-3 py-1.5 text-sm w-28 bg-white" />
          </div>
          <button onClick={() => { setColor(""); setMaterial(""); setPriceMax(""); }}
            className="text-sm text-ink/40 hover:text-ink self-end">Clear all</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onCollect={() => collect(p)} />
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-ink text-white px-4 py-2 rounded-lg text-sm shadow-lg">{toast}</div>
      )}
    </div>
  );
}
