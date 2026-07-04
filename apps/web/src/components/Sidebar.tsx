"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/performance", label: "Performance" },
  { href: "/collections", label: "Collection" },
  { href: "/newsletter", label: "Newsletter Tracking", badge: 2 },
  { href: "/trends", label: "Trend Report" },
  { href: "/find-similar", label: "Find Similar" },
  { href: "/team", label: "Team" },
];

export default function Sidebar() {
  const path = usePathname();
  if (path === "/onboarding") return null;
  return (
    <aside className="w-60 shrink-0 min-h-screen border-r border-ink/10 bg-white flex flex-col">
      <Link href="/dashboard" className="px-6 py-5 font-display text-2xl font-bold tracking-tight">
        Pendulum<span className="text-accentDark">.</span>
      </Link>
      <nav className="px-3 space-y-1">
        {NAV.map((n) => {
          const active = path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                active ? "bg-ink text-white font-medium" : "hover:bg-ink/5"
              }`}
            >
              {n.label}
              {n.badge ? (
                <span className="ml-2 h-5 w-5 grid place-items-center rounded-full bg-accent text-ink text-[11px] font-bold">
                  {n.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-6 py-5 text-xs text-ink/40">
        <Link href="/onboarding" className="underline hover:text-ink">Redo setup</Link>
      </div>
    </aside>
  );
}
