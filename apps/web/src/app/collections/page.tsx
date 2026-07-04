"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, post, type ProductT } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

type Coll = { id: number; name: string; count: number; shared_with: number[]; products: ProductT[] };
type Member = { id: number; name: string; email: string; role: string };

export default function Collections() {
  const router = useRouter();
  const [colls, setColls] = useState<Coll[]>([]);
  const [team, setTeam] = useState<Member[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [shareFor, setShareFor] = useState<Coll | null>(null);

  const load = () => api<Coll[]>("/collections", "collections").then(setColls);
  useEffect(() => {
    load();
    api<Member[]>("/team", "team").then(setTeam);
  }, []);

  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 6 ? [...s, id] : s));

  async function rename(c: Coll) {
    const name = prompt("Rename collection", c.name);
    if (name && name !== c.name) {
      await post(`/collections/${c.id}/rename`, { name });
      load();
    }
  }

  async function share(userIds: number[]) {
    if (!shareFor) return;
    await post(`/collections/${shareFor.id}/share`, { user_ids: userIds });
    setShareFor(null);
    load();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-bold">Collection</h1>
        <button
          onClick={() => router.push(`/compare?ids=${selected.join(",")}`)}
          disabled={selected.length < 2}
          className="btn disabled:opacity-30"
        >
          Compare selected ({selected.length})
        </button>
      </div>

      {colls.map((c) => (
        <section key={c.id} className="space-y-4">
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-semibold">{c.name}</h2>
            <button onClick={() => rename(c)} className="text-sm text-accentDark font-medium hover:underline">Rename</button>
            <span className="text-sm text-ink/50">{c.count} products</span>
            {c.shared_with.length > 0 && <span className="chip">shared with {c.shared_with.length}</span>}
            <button onClick={() => setShareFor(c)} className="ml-auto text-sm text-accentDark font-medium hover:underline">
              Share
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {c.products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                selectable
                selected={selected.includes(p.id)}
                onSelect={() => toggle(p.id)}
              />
            ))}
          </div>
        </section>
      ))}

      {shareFor && (
        <ShareModal coll={shareFor} team={team} onShare={share} onClose={() => setShareFor(null)} />
      )}
    </div>
  );
}

function ShareModal({ coll, team, onShare, onClose }: {
  coll: Coll; team: Member[]; onShare: (ids: number[]) => void; onClose: () => void;
}) {
  const [ids, setIds] = useState<number[]>(coll.shared_with);
  return (
    <div className="fixed inset-0 bg-ink/40 grid place-items-center p-8 z-50" onClick={onClose}>
      <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-semibold text-lg mb-4">Share “{coll.name}” with team members</h2>
        <div className="space-y-2 mb-6 max-h-72 overflow-auto">
          {team.filter((m) => m.role !== "admin").map((m) => (
            <label key={m.id} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ids.includes(m.id)}
                onChange={() => setIds((s) => (s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id]))}
                className="accent-ink"
              />
              <span>{m.name}</span>
              <span className="text-sm text-ink/40">{m.email}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn">Cancel</button>
          <button onClick={() => onShare(ids)} className="btn-accent">Share</button>
        </div>
      </div>
    </div>
  );
}
