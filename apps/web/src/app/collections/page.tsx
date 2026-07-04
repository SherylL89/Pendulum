import { api, type ProductT } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

type Coll = { id: number; name: string; count: number; shared_with: number[]; products: ProductT[] };

export default async function Collections() {
  const colls = await api<Coll[]>("/collections", "collections");
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-bold">Collection</h1>
        <button className="btn">Product comparison</button>
      </div>
      {colls.map((c) => (
        <section key={c.id} className="space-y-4">
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-semibold">{c.name}</h2>
            <span className="text-sm text-ink/50">{c.count} products</span>
            {c.shared_with.length > 0 && <span className="chip">shared</span>}
            <button className="ml-auto text-sm text-accentDark font-medium hover:underline">Share</button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {c.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
