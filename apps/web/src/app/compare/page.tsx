"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { API_BASE, type ProductT } from "@/lib/api";
import { MOCK } from "@/lib/mock";
import Swatch from "@/components/Swatch";

function CompareInner() {
  const params = useSearchParams();
  const ids = params.get("ids") || "";
  const [products, setProducts] = useState<ProductT[]>([]);

  useEffect(() => {
    if (!ids) return;
    fetch(`${API_BASE}/products/compare?ids=${ids}`)
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => setProducts(MOCK.products.slice(0, 3) as ProductT[]));
  }, [ids]);

  const rows: [string, (p: ProductT) => React.ReactNode][] = [
    ["Brand", (p) => p.brand],
    ["Category", (p) => p.category],
    ["Price", (p) => `$${p.price.toLocaleString()}`],
    ["Change", (p) => (
      <span className={p.change_pct >= 0 ? "delta-up" : "delta-down"}>
        {p.change_pct >= 0 ? "↑" : "↓"} {Math.abs(p.change_pct)}%
      </span>
    )],
    ["Sales rank", (p) => `#${p.sales_rank}`],
    ["Review rank", (p) => `#${p.review_rank}`],
    ["Material", (p) => String(p.attrs?.material ?? "—")],
    ["Launch", (p) => p.launch_date],
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/collections" className="text-sm text-ink/50 hover:text-ink">← Back to Collection</Link>
        <h1 className="font-display text-4xl font-bold mt-2">Product Comparison</h1>
      </div>
      {products.length === 0 ? (
        <p className="text-ink/50">Select 2–6 products in a collection, then hit Compare.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-4 text-left w-36" />
                {products.map((p) => (
                  <th key={p.id} className="p-4 text-left font-normal">
                    <Swatch hue={p.image_hue} src={p.image_url} className="aspect-[4/5] w-36 mb-2" />
                    <div className="font-semibold">{p.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, fn]) => (
                <tr key={label} className="border-t border-ink/5">
                  <td className="p-4 text-ink/50 font-medium">{label}</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-4">{fn(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Compare() {
  return (
    <Suspense>
      <CompareInner />
    </Suspense>
  );
}
