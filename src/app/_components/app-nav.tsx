"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export function AppNav() {
  const pathname = usePathname();

  // Ne pas afficher la nav sur /login
  if (pathname === "/login") {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b border-neutral-200 px-8">
      <div className="flex gap-8">
        <Link
          href="/"
          className={`py-4 text-xs font-medium tracking-[0.15em] uppercase border-b-2 transition-colors ${
            isActive("/")
              ? "border-black text-black"
              : "border-transparent text-neutral-400 hover:text-black"
          }`}
        >
          Nouveau benchmark
        </Link>
        <Link
          href="/history"
          className={`py-4 text-xs font-medium tracking-[0.15em] uppercase border-b-2 transition-colors ${
            isActive("/history")
              ? "border-black text-black"
              : "border-transparent text-neutral-400 hover:text-black"
          }`}
        >
          Précédents benchmarks
        </Link>
      </div>
    </nav>
  );
}
