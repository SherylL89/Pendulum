"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";

const STEPS = ["Basic Information", "Research Preference", "Competitor & Inspirational Brands", "Price"];
const CATEGORIES: Record<string, string[]> = {
  Man: ["Tops", "Pants", "Jeans", "Cardigans & Sweaters"],
  Woman: ["Dresses", "Tops", "Shirts & Blouses", "Pants", "Jeans", "Cardigans & Sweaters", "Accessories - Bags", "Accessories - Jewelry"],
  Kid: ["Dresses", "Tops", "Shirts & Blouses", "Pants", "Jeans"],
};
const BRAND_SUGGESTIONS = ["H&M", "Zara", "&Other Stories", "COS", "OffWhite", "Balenciaga", "Macys", "Saks off Fifth"];
const TIERS = ["Couture", "Luxury", "Bridge", "High Street", "Fast Fashion", "Off Price"];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [info, setInfo] = useState({ first: "", last: "", company: "", role: "", email: "", phone: "" });
  const [cats, setCats] = useState<string[]>([]);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [inspirations, setInspirations] = useState<string[]>([]);
  const [tier, setTier] = useState("High Street");

  const toggleCat = (c: string) =>
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : prev.length < 3 ? [...prev, c] : prev));

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  function finish() {
    // v1: preferences are seeded server-side; a PUT /preferences endpoint is the natural next step.
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-ink py-4 grid place-items-center">
        <Logo className="text-2xl" light />
      </header>
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        {/* chevron progress */}
        <div className="flex">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 text-center text-xs sm:text-sm px-2 py-3 border ${
                i === step ? "bg-ink text-white border-ink font-semibold" : "bg-white border-ink/15 text-ink/50"
              } ${i === 0 ? "rounded-l-lg" : ""} ${i === STEPS.length - 1 ? "rounded-r-lg" : ""}`}
            >
              {s}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4 max-w-md mx-auto">
            <h1 className="text-center text-lg">Please enter your basic information.</h1>
            {(
              [["first", "First name"], ["last", "Last name"], ["company", "Company name"], ["role", "Role at company"], ["email", "Email"], ["phone", "Phone"]] as const
            ).map(([k, label]) => (
              <label key={k} className="block">
                <span className="text-sm text-ink/60">{label}</span>
                <input
                  value={info[k]}
                  onChange={(e) => setInfo({ ...info, [k]: e.target.value })}
                  className="mt-1 w-full border border-ink/15 rounded-lg px-3 py-2 bg-white"
                />
              </label>
            ))}
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="text-center text-lg mb-6">
              Select the product categories (max 3) you want research on. <b>{cats.length}/3</b>
            </h1>
            <div className="grid grid-cols-3 gap-8">
              {Object.entries(CATEGORIES).map(([group, items]) => (
                <div key={group}>
                  <div className="font-semibold border-b border-ink pb-2 mb-3 uppercase text-sm tracking-wide">{group}</div>
                  <div className="space-y-2">
                    {items.map((c) => {
                      const id = `${group} - ${c}`;
                      return (
                        <label key={id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={cats.includes(id)} onChange={() => toggleCat(id)} className="accent-ink" />
                          {c}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            {([["Enter your competitors", competitors, setCompetitors], ["Enter your inspirational brands & retailers", inspirations, setInspirations]] as const).map(
              ([title, list, set]) => (
                <div key={title}>
                  <h2 className="text-center text-lg mb-4">{title}</h2>
                  <div className="min-h-14 border border-ink/15 rounded-lg bg-white p-3 flex flex-wrap gap-2 mb-3">
                    {list.length === 0 && <span className="text-ink/30 text-sm">Pick from suggestions below</span>}
                    {list.map((b) => (
                      <span key={b} className="chip">
                        {b}
                        <button onClick={() => toggle(list, set as (v: string[]) => void, b)} className="ml-1 text-ink/40 hover:text-ink">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {BRAND_SUGGESTIONS.map((b) => (
                      <button
                        key={b}
                        onClick={() => toggle(list, set as (v: string[]) => void, b)}
                        className={`chip hover:border-ink ${list.includes(b) ? "bg-ink text-white border-ink" : ""}`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}
            <label className="flex items-center gap-2 text-sm justify-center">
              <input type="checkbox" onChange={(e) => e.target.checked && setInspirations([...competitors])} className="accent-ink" />
              Same as competitors
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-xs mx-auto space-y-4">
            <h1 className="text-center text-lg mb-6">Select your market price tier</h1>
            {TIERS.map((t) => (
              <label key={t} className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="tier" checked={tier === t} onChange={() => setTier(t)} className="accent-ink" />
                <span className={tier === t ? "font-semibold" : ""}>{t}</span>
              </label>
            ))}
          </div>
        )}

        <div className="flex justify-between pt-6 border-t border-ink/10">
          <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="btn disabled:opacity-30">
            Previous
          </button>
          {step < 3 ? (
            <div className="flex gap-3">
              <button onClick={() => setStep(step + 1)} className="text-sm text-ink/40 self-center hover:text-ink">Skip</button>
              <button onClick={() => setStep(step + 1)} className="btn-accent">Next</button>
            </div>
          ) : (
            <button onClick={finish} className="btn-accent">Finish — you're all set 🎉</button>
          )}
        </div>
      </div>
    </div>
  );
}
