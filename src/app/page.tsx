"use client";

import { useState } from "react";

const PASSWORD = "Hellowork2026!";

type Feature = {
  name: string;
  description: string;
  category: string;
};

type Report = {
  company: {
    name: string;
    description: string;
    founded: string;
    employees: string;
    funding: string;
    clients: string;
  };
  features: Feature[];
  analysis: {
    strengths: string[];
    weaknesses: string[];
    positioning: string;
    target_market: string;
  };
};

// ─── Password Gate ────────────────────────────────────────────────────────────

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function handleLogin(e: React.SyntheticEvent) {
    e.preventDefault();
    if (password === PASSWORD) {
      onAuth();
    } else {
      setError(true);
      setPassword("");
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-black px-8 py-5 flex items-center justify-between">
        <span className="text-xs font-medium tracking-[0.2em] uppercase">
          Benchmark Tool
        </span>
        <span className="text-xs text-neutral-400 tracking-widest uppercase">
          Accès restreint
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="mb-12">
            <div className="w-8 h-px bg-black mb-8" />
            <h1 className="text-2xl font-medium tracking-tight leading-tight mb-3">
              Connexion
            </h1>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Cet outil est réservé à un usage interne.
              <br />
              Entrez le mot de passe pour continuer.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="••••••••••••"
                autoFocus
                className={`w-full border px-4 py-3 text-sm font-mono bg-white outline-none transition-colors placeholder:text-neutral-300 ${
                  error
                    ? "border-red-500"
                    : "border-black focus:border-black"
                }`}
              />
              {error && (
                <p className="text-xs text-red-500 tracking-wide">
                  Mot de passe incorrect.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white text-xs font-medium tracking-[0.2em] uppercase py-3.5 hover:bg-neutral-800 transition-colors"
            >
              Accéder
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

// ─── Report ───────────────────────────────────────────────────────────────────

function ReportView({ url, report }: { url: string; report: Report }) {
  const { company, features, analysis } = report;

  const categoryColors: Record<string, string> = {
    Recrutement: "bg-black text-white",
    Productivité: "bg-neutral-200 text-black",
    Plateforme: "bg-neutral-100 text-black",
  };

  return (
    <div className="mt-16 w-full border-t border-black pt-12 flex flex-col gap-12">
      {/* Header rapport */}
      <div className="flex items-start justify-between gap-8">
        <div>
          <p className="text-xs text-neutral-400 tracking-widest uppercase mb-2">
            Rapport d'analyse
          </p>
          <h2 className="text-3xl font-medium tracking-tight">{company.name}</h2>
          <p className="text-sm text-neutral-400 font-mono mt-1 break-all">{url}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-neutral-400 tracking-widest uppercase mb-1">Fondée</p>
          <p className="text-sm font-medium">{company.founded}</p>
        </div>
      </div>

      {/* Company overview */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500 mb-3">
            Description
          </p>
          <p className="text-sm text-neutral-700 leading-relaxed">{company.description}</p>
        </div>
        <div className="flex flex-col gap-4 sm:items-end sm:text-right min-w-40">
          {[
            { label: "Employés", value: company.employees },
            { label: "Financement", value: company.funding },
            { label: "Clients", value: company.clients },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-neutral-400 tracking-widest uppercase mb-0.5">{label}</p>
              <p className="text-sm font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Separator */}
      <div className="w-full h-px bg-neutral-200" />

      {/* Features */}
      <div>
        <p className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500 mb-6">
          Fonctionnalités — {features.length}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-neutral-200">
          {features.map((f) => (
            <div key={f.name} className="bg-white p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{f.name}</p>
                <span
                  className={`text-[10px] font-medium tracking-[0.15em] uppercase px-2 py-0.5 shrink-0 ${
                    categoryColors[f.category] ?? "bg-neutral-100 text-black"
                  }`}
                >
                  {f.category}
                </span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Separator */}
      <div className="w-full h-px bg-neutral-200" />

      {/* Analysis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
        {/* Strengths */}
        <div>
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500 mb-4">
            Points forts
          </p>
          <ul className="flex flex-col gap-3">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm text-neutral-700 leading-relaxed">
                <span className="mt-1 w-1 h-1 rounded-full bg-black shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div>
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500 mb-4">
            Points faibles
          </p>
          <ul className="flex flex-col gap-3">
            {analysis.weaknesses.map((w, i) => (
              <li key={i} className="flex gap-3 text-sm text-neutral-700 leading-relaxed">
                <span className="mt-1 w-1 h-1 rounded-full bg-neutral-400 shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </div>

        {/* Positioning */}
        <div>
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500 mb-3">
            Positionnement
          </p>
          <p className="text-sm text-neutral-700 leading-relaxed">{analysis.positioning}</p>
        </div>

        {/* Target market */}
        <div>
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500 mb-3">
            Marché cible
          </p>
          <p className="text-sm text-neutral-700 leading-relaxed">{analysis.target_market}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

function App({ onLogout }: { onLogout: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; report: Report } | null>(null);

  async function handleAnalyze() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAnalyze();
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-black px-8 py-5 flex items-center justify-between">
        <span className="text-xs font-medium tracking-[0.2em] uppercase">
          Benchmark Tool
        </span>
        <button
          onClick={onLogout}
          className="text-xs text-neutral-400 tracking-widest uppercase hover:text-black transition-colors"
        >
          Déconnexion
        </button>
      </header>

      <main className="flex-1 px-8 py-24">
        <div className="w-full max-w-2xl mx-auto">
          {/* Intro */}
          <div className="mb-16">
            <div className="w-8 h-px bg-black mb-8" />
            <h1 className="text-4xl font-medium tracking-tight leading-tight mb-5">
              Analyse concurrentielle
            </h1>
            <p className="text-base text-neutral-500 leading-relaxed max-w-lg">
              Analysez et comparez les performances d'un site web face à ses
              concurrents. Collez une URL pour démarrer l'analyse.
            </p>
          </div>

          {/* Input */}
          <div className="flex flex-col gap-3">
            <label
              htmlFor="url"
              className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500"
            >
              URL à analyser
            </label>
            <div className="flex">
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="https://exemple.com"
                disabled={loading}
                className="flex-1 border border-r-0 border-black px-4 py-3.5 text-sm font-mono bg-white outline-none placeholder:text-neutral-300 focus:bg-neutral-50 transition-colors disabled:text-neutral-400"
              />
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!url.trim() || loading}
                className="bg-black text-white text-xs font-medium tracking-[0.2em] uppercase px-7 py-3.5 hover:bg-neutral-800 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? "Analyse…" : "Analyser"}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-500 tracking-wide">{error}</p>
            )}
            {!error && (
              <p className="text-xs text-neutral-400">
                Formats acceptés — https://domaine.com · https://www.domaine.com
              </p>
            )}
          </div>

          {/* Loader */}
          {loading && (
            <div className="mt-16 flex flex-col items-start gap-4">
              <div className="w-8 h-px bg-black animate-pulse" />
              <p className="text-sm text-neutral-400 tracking-wide">
                Scraping en cours…
              </p>
              <div className="flex gap-1.5 mt-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1 h-1 rounded-full bg-black animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Report */}
          {result && !loading && (
            <ReportView url={result.url} report={result.report} />
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

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) {
    return <PasswordGate onAuth={() => setAuthenticated(true)} />;
  }

  return <App onLogout={() => setAuthenticated(false)} />;
}
