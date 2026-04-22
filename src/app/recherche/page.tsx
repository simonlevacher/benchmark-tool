"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SearchResult = {
  name: string;
  url: string;
  source: "ia" | "web";
};

type SearchResponse = {
  results: SearchResult[];
  sources: {
    knowledge: "ok" | "error";
    search: "ok" | "error";
  };
};

export default function RecherchePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [sources, setSources] = useState<SearchResponse["sources"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setSources(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Recherche indisponible.");
        return;
      }
      setResults(data.results);
      setSources(data.sources);
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-50 border-b border-black bg-white">
        <div className="px-8 py-5 border-b border-neutral-200">
          <span className="text-xs font-medium tracking-[0.2em] uppercase">
            Benchmark Tool by Hellowork
          </span>
        </div>
        <nav className="flex">
          <a
            href="/"
            className="flex-1 py-4 px-8 text-xs font-medium tracking-[0.15em] uppercase border-b-2 border-transparent text-neutral-500 hover:text-black hover:border-neutral-300 transition-colors text-center"
          >
            Nouveau benchmark
          </a>
          <a
            href="/recherche"
            className="flex-1 py-4 px-8 text-xs font-semibold tracking-[0.15em] uppercase border-b-2 border-black bg-black text-white transition-colors text-center"
          >
            Recherche
          </a>
          <a
            href="/history"
            className="flex-1 py-4 px-8 text-xs font-medium tracking-[0.15em] uppercase border-b-2 border-transparent text-neutral-500 hover:text-black hover:border-neutral-300 transition-colors text-center"
          >
            Précédents benchmarks
          </a>
        </nav>
      </header>

      <main className="flex-1 px-8 py-24">
        <div className="w-full max-w-2xl mx-auto">
          <div className="mb-16">
            <div className="w-8 h-px bg-black mb-8" />
            <h1 className="text-4xl font-medium tracking-tight leading-tight mb-5">
              Recherche d'entreprises
            </h1>
            <p className="text-base text-neutral-500 leading-relaxed max-w-lg">
              Tapez des mots-clés pour trouver des entreprises à analyser.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <label
              htmlFor="query"
              className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500"
            >
              Mots-clés
            </label>
            <div className="flex">
              <input
                id="query"
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setError(null); }}
                onKeyDown={handleKeyDown}
                placeholder="ex: job board SaaS France"
                disabled={loading}
                className="flex-1 border border-r-0 border-black px-4 py-3.5 text-sm bg-white outline-none placeholder:text-neutral-300 focus:bg-neutral-50 transition-colors disabled:text-neutral-400"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={!query.trim() || loading}
                className="bg-black text-white text-xs font-medium tracking-[0.2em] uppercase px-7 py-3.5 hover:bg-neutral-800 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? "Recherche…" : "Rechercher"}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-500 tracking-wide">{error}</p>
            )}
          </div>

          {loading && (
            <div className="mt-12 flex items-center gap-4">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              <p className="text-sm text-black tracking-wide">Recherche en cours…</p>
            </div>
          )}

          {results !== null && !loading && (
            <div className="mt-12">
              {sources?.knowledge === "error" && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 mb-4 tracking-wide">
                  Suggestions IA indisponibles — résultats web uniquement
                </p>
              )}
              {sources?.search === "error" && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 mb-4 tracking-wide">
                  Recherche web indisponible — suggestions IA uniquement
                </p>
              )}

              {results.length === 0 ? (
                <p className="text-sm text-neutral-400 mt-4">
                  Aucun résultat pour ces mots-clés.
                </p>
              ) : (
                <div className="border-t border-black">
                  {results.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => router.push(`/?url=${encodeURIComponent(item.url)}`)}
                      className="w-full flex items-center gap-4 py-5 border-b border-neutral-200 hover:bg-neutral-50 text-left transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium mb-1">{item.name}</p>
                        <p className="text-xs font-mono text-neutral-500 truncate">{item.url}</p>
                      </div>
                      <span
                        className={`text-[10px] font-medium tracking-[0.12em] uppercase px-2 py-0.5 flex-shrink-0 ${
                          item.source === "web"
                            ? "bg-neutral-800 text-white"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {item.source === "web" ? "Web" : "IA"}
                      </span>
                      <svg
                        className="text-neutral-300 group-hover:text-black transition-colors flex-shrink-0"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2 6h8M6 2l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-neutral-200 px-8 py-4">
        <p className="text-xs text-neutral-400 tracking-wide">
          Usage interne uniquement — {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
