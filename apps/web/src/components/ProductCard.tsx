"use client";

import Link from "next/link";
import type { ProductT } from "@/lib/api";
import Swatch from "./Swatch";

export default function ProductCard({ product, onCollect }: { product: ProductT; onCollect?: () => void }) {
  const up = product.change_pct >= 0;
  return (
    <div className="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <Swatch hue={product.image_hue} className="aspect-[4/5] w-full" />
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
