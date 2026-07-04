"use client";

export default function ScopeBar({
  categories,
  competitors,
  priceTier,
}: {
  categories: string[];
  competitors: string[];
  priceTier: string;
}) {
  return (
    <div className="card px-5 py-4 flex flex-wrap gap-x-10 gap-y-3 items-start">
      <Scope label="Category" values={categories} />
      <Scope label="Brand & Retail" values={competitors} />
      <Scope label="Market" values={[priceTier]} />
      <a href="/onboarding" className="ml-auto text-sm font-medium text-accentDark hover:underline">
        Change setting
      </a>
    </div>
  );
}

function Scope({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-ink/40 font-semibold mb-1">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className="chip">{v}</span>
        ))}
      </div>
    </div>
  );
}
