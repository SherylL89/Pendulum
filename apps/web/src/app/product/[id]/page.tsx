import Link from "next/link";
import { api, type ProductT } from "@/lib/api";
import Swatch from "@/components/Swatch";
import PriceChart from "./chart";

type Detail = ProductT & {
  history: { date: string; brand_price: number; retailer_price: number; promo: string }[];
  feedback: {
    aspects: { aspect: string; positive: number; negative: number; keywords: string[] }[];
    top_terms: { term: string; weight: number }[];
    source: string;
  };
};

export default async function ProductDetail({ params }: { params: { id: string } }) {
  const p = await api<Detail>(`/products/${params.id}`, "product");
  const up = p.change_pct >= 0;
  return (
    <div className="space-y-8">
      <div>
        <Link href="/performance" className="text-sm text-ink/50 hover:text-ink">← Back to Performance</Link>
        <h1 className="font-display text-4xl font-bold mt-2">Product Detail</h1>
      </div>

      <div className="grid grid-cols-[360px_1fr] gap-8">
        <Swatch hue={p.image_hue} className="aspect-[4/5]" />
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink/50">Performance change</span>
            <span className={`text-2xl ${up ? "delta-up" : "delta-down"}`}>{up ? "↑" : "↓"} {Math.abs(p.change_pct)}%</span>
          </div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-semibold">{p.name}</h2>
            <div className="text-2xl font-bold">${p.price.toLocaleString()}</div>
          </div>
          <dl className="grid grid-cols-[130px_1fr] gap-y-2 text-sm">
            <dt className="text-ink/50">Category</dt><dd>{p.category}</dd>
            <dt className="text-ink/50">Brand</dt><dd>{p.brand}</dd>
            {p.retailer && (<><dt className="text-ink/50">Retailer</dt><dd>{p.retailer}</dd></>)}
            <dt className="text-ink/50">Size</dt><dd>{String(p.attrs?.size ?? "—")}</dd>
            <dt className="text-ink/50">Material</dt><dd>{String(p.attrs?.material ?? "—")}</dd>
            <dt className="text-ink/50">Launch date</dt><dd>{p.launch_date}</dd>
          </dl>
        </div>
      </div>

      <section className="card p-6">
        <h3 className="font-semibold mb-4">History price & promotion</h3>
        <PriceChart history={p.history} />
      </section>

      <section className="card p-6">
        <h3 className="font-semibold mb-1">Feedback analysis</h3>
        <p className="text-xs text-ink/40 mb-5">
          {p.feedback.source === "claude" ? "Live analysis by Claude" : "Sample analysis — set ANTHROPIC_API_KEY for live"}
        </p>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {p.feedback.aspects.map((a) => (
            <div key={a.aspect} className="border border-ink/10 rounded-lg p-4">
              <div className="font-medium mb-2">{a.aspect}</div>
              <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${a.positive}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-1 text-ink/50">
                <span>{a.positive}% positive</span><span>{a.negative}%</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {a.keywords.map((k) => (<span key={k} className="chip">{k}</span>))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          {p.feedback.top_terms.map((t) => (
            <span key={t.term} style={{ fontSize: `${Math.max(13, t.weight)}px` }} className="font-medium text-ink/70">
              {t.term}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
