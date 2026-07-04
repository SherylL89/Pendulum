"use client";

import Link from "next/link";
import type { ProductT } from "@/lib/api";
import Swatch from "./Swatch";

export default function ProductCard({
  product,
  onCollect,
  selectable,
  selected,
  onSelect,
}: {
  product: ProductT;
  onCollect?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const up = product.change_pct >= 0;
  return (
    <div className={`card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow relative ${selected ? "ring-2 ring-accentDark" : ""}`}>
      {selectable && (
        <input
          type="checkbox"
          checked={!!selected}
          onChange={onSelect}
          className="absolute top-3 left-3 h-4 w-4 accent-ink z-10"
        />
      )}
      <Swatch hue={product.image_hue} src={product.image_url} className="aspect-[4/5] w-full" />
      <div>
        <div className="font-semibold leading-snug">{product.name}</div>
        <div className="text-sm text-ink/50">{product.brand}</div>
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-lg font-semibold">${product.price.toLocaleString()}</div>
        <div className={up ? "delta-up" : "delta-down"}>
          {up ? "↑" : "↓"} {Math.abs(product.change_pct)}%
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <Link href={`/product/${product.id}`} className="btn !px-3 !py-1.5">View detail</Link>
        {onCollect && (
          <button onClick={onCollect} className="text-accentDark font-medium hover:underline">
            + collect
          </button>
        )}
      </div>
    </div>
  );
}
