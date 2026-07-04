"use client";

import { usePathname } from "next/navigation";

export default function Main({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const bare = path === "/onboarding";
  return <main className={bare ? "flex-1 min-w-0" : "flex-1 min-w-0 px-8 py-8 max-w-7xl"}>{children}</main>;
}
