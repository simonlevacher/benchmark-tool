"use client";

import { useState } from "react";

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

      <div className="w-full h-px bg-neutral-200" />

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

      <div className="w-full h-px bg-neutral-200" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
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

        <div>
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500 mb-3">
            Positionnement
          </p>
          <p className="text-sm text-neutral-700 leading-relaxed">{analysis.positioning}</p>
        </div>

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

export default function Home() {
  type StepStatus = "pending" | "active" | "done" | "error";
  type Step = { id: string; message: string; status: StepStatus };

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; report: Report } | null>(null);
  const [searchCount, setSearchCount] = useState(0);

  function upsertStep(id: string, status: StepStatus, message: string) {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return [...prev, { id, status, message }];
      const next = [...prev];
      next[idx] = { id, status, message };
      return next;
    });
  }

  async function handleAnalyze() {
    if (!url.trim() || loading) return;

    const trimmedUrl = url.trim();
    setLoading(true);
    setError(null);
    setResult(null);
    setSteps([]);
    setSearchCount((c) => c + 1);

    try {
      // Étape 1 : scraping
      upsertStep("scraping", "active", "Récupération du contenu…");

      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const scrapeData = await scrapeRes.json();

      if (!scrapeRes.ok) {
        upsertStep("scraping", "error", scrapeData.error ?? "Échec de la récupération.");
        setError(scrapeData.error ?? "Échec de la récupération du site.");
        return;
      }

      upsertStep("scraping", "done", "Contenu récupéré");

      // Étape 2 : analyse IA
      upsertStep("analyzing", "active", "Analyse IA en cours…");

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scrapeData }),
      });

      const analyzeData = await analyzeRes.json();

      if (!analyzeRes.ok) {
        upsertStep("analyzing", "error", analyzeData.error ?? "Échec de l'analyse.");
        setError(analyzeData.error ?? "Échec de l'analyse.");
        return;
      }

      upsertStep("analyzing", "done", "Analyse terminée");
      setResult({ url: trimmedUrl, report: analyzeData.report });
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
      <header className="border-b border-black px-8 py-5">
        <span className="text-xs font-medium tracking-[0.2em] uppercase">
          Benchmark Tool
        </span>
      </header>

      <main className="flex-1 px-8 py-24">
        <div className="w-full max-w-2xl mx-auto">
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

          {loading ? (
            <div className="mt-12 flex flex-col gap-2">
              {steps.length === 0 ? (
                <div className="flex items-center gap-4">
                  <div className="w-4 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                  </div>
                  <p className="text-sm text-black tracking-wide">Initialisation…</p>
                </div>
              ) : (
                steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-4">
                    <div className="w-4 flex items-center justify-center shrink-0">
                      {step.status === "active" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                      )}
                      {step.status === "done" && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {step.status === "error" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                    </div>
                    <p className={`text-sm tracking-wide ${
                      step.status === "active" ? "text-black" :
                      step.status === "done" ? "text-neutral-400" :
                      step.status === "error" ? "text-red-500" :
                      "text-neutral-300"
                    }`}>
                      {step.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          ) : result ? (
            <ReportView key={searchCount} url={result.url} report={result.report} />
          ) : null}
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
