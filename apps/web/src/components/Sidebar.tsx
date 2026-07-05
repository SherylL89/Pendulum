"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";
import Logo from "./Logo";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/performance", label: "Performance" },
  { href: "/collections", label: "Collection" },
  { href: "/newsletter", label: "Newsletter Tracking", badgeKey: "unread" },
  { href: "/trends", label: "Trend Report" },
  { href: "/find-similar", label: "Find Similar" },
  { href: "/team", label: "Team" },
];

export default function Sidebar() {
  const path = usePathname();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    fetch(`${API_BASE}/newsletters/unread-count`)
      .then((r) => r.json())
      .then((d) => setUnread(d.count))
      .catch(() => setUnread(0));
  }, [path]);
  if (path === "/onboarding") return null;
  return (
    <aside className="w-60 shrink-0 min-h-screen bg-white border-r border-ink/10 flex flex-col">
      <Link href="/dashboard" className="px-6 h-16 flex items-center">
        <Logo className="text-2xl" />
      </Link>
      <nav className="px-6 py-6 space-y-1">
        {NAV.map((n) => {
          const active = path.startsWith(n.href);
          const badge = n.badgeKey === "unread" ? unread : 0;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center justify-between py-2.5 text-[15px] transition-colors ${
                active ? "font-bold text-ink" : "text-ink/70 hover:text-ink"
              }`}
            >
              {n.label}
              {badge > 0 ? (
                <span className="ml-2 h-5 min-w-5 px-1 grid place-items-center rounded-full bg-accent text-white text-[11px] font-bold">
                  {badge > 99 ? "99+" : badge}
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
