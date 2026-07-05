"use client";

import { usePathname } from "next/navigation";

export default function TopBar() {
  const path = usePathname();
  if (path === "/onboarding") return null;
  return (
    <header className="h-16 bg-[#8e8e8e] flex items-center justify-end gap-4 px-6 shrink-0">
      <div className="h-10 w-10 rounded-full bg-neutral-200 grid place-items-center font-bold text-ink">
        Y
      </div>
      <button className="text-white/80 hover:text-white text-xl tracking-widest" aria-label="Menu">
        •••
      </button>
    </header>
  );
}
