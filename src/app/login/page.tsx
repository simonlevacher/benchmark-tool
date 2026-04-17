"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Accès refusé.");
        setLoading(false);
        return;
      }

      router.push("/");
    } catch {
      setError("Erreur réseau. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-black px-8 py-5">
        <span className="text-xs font-medium tracking-[0.2em] uppercase">
          Benchmark Tool
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="mb-12">
            <div className="w-8 h-px bg-black mb-8" />
            <h1 className="text-3xl font-medium tracking-tight mb-5">
              Accès restreint
            </h1>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Veuillez entrer le code d'accès pour utiliser l'outil.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label
              htmlFor="code"
              className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500"
            >
              Code d'accès
            </label>
            <div className="flex">
              <input
                id="code"
                type="password"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit(e);
                }}
                placeholder="•••••••••"
                disabled={loading}
                autoFocus
                className="flex-1 border border-r-0 border-black px-4 py-3.5 text-sm font-mono bg-white outline-none placeholder:text-neutral-300 focus:bg-neutral-50 transition-colors disabled:text-neutral-400"
              />
              <button
                type="submit"
                disabled={!code.trim() || loading}
                className="bg-black text-white text-xs font-medium tracking-[0.2em] uppercase px-7 py-3.5 hover:bg-neutral-800 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? "Vérif…" : "Accéder"}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-500 tracking-wide">{error}</p>
            )}
          </form>
        </div>
      </main>

      <footer className="border-t border-neutral-200 px-8 py-4">
        <p className="text-xs text-neutral-400 tracking-wide">
          {new Date().getFullYear()} — Benchmark Tool
        </p>
      </footer>
    </div>
  );
}
