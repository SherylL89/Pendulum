"use client";

import { useEffect, useState } from "react";
import { api, post, type ProductT } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

const SORTS = [
  { key: "sales", label: "Sales ranking" },
  { key: "review", label: "Review ranking" },
  { key: "newest", label: "Newest arrival" },
];

export default function Performance() {
  const [sort, setSort] = useState("sales");
  const [category, setCategory] = useState<string>("");
  const [products, setProducts] = useState<ProductT[]>([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const q = new URLSearchParams();
    if (category) q.set("category", category);
    q.set("sort", sort);
    api<ProductT[]>(`/products?${q}`, "products").then(setProducts);
  }, [sort, category]);

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
      </div>

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
