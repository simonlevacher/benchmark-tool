"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReportView, type Report } from "@/app/_components/report-view";
import { RobotFall } from "@/app/_components/robot-fall";

// ─── Main App ─────────────────────────────────────────────────────────────────

function HomeContent() {
  type StepStatus = "pending" | "active" | "done" | "error";
  type Step = { id: string; message: string; status: StepStatus };

  const router = useRouter();
  const searchParams = useSearchParams();
  const skipDuplicateCheck = useRef(false);

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; report: Report } | null>(null);
  const [searchCount, setSearchCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [existingReport, setExistingReport] = useState<{ id: number; company_name: string } | null>(null);

  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam) {
      setUrl(urlParam);
      handleAnalyze(urlParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps — intentional single-fire on mount
  }, []);

  function upsertStep(id: string, status: StepStatus, message: string) {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return [...prev, { id, status, message }];
      const next = [...prev];
      next[idx] = { id, status, message };
      return next;
    });
  }

  async function handleAnalyze(overrideUrl?: string) {
    const trimmedUrl = (overrideUrl ?? url).trim();
    if (!trimmedUrl || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSteps([]);

    // Vérifier si l'URL a déjà été analysée
    if (!skipDuplicateCheck.current) {
      try {
        const checkRes = await fetch(`/api/reports?url=${encodeURIComponent(trimmedUrl)}`);
        const checkData = await checkRes.json();
        if (checkData.results?.length > 0) {
          setExistingReport(checkData.results[0]);
          setLoading(false);
          return;
        }
      } catch {
        // Silencieusement ignorer les erreurs de vérification
      }
    }
    skipDuplicateCheck.current = false;

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

      if (!scrapeRes.ok || !scrapeData.url) {
        upsertStep("scraping", "error", scrapeData.error ?? "Échec de la récupération.");
        setError(scrapeData.error ?? "Échec de la récupération du site.");
        return;
      }

      upsertStep("scraping", "done", "Contenu récupéré");

      // Étape 1.5 : enrichissement datagouv (optionnel, ne bloque pas)
      upsertStep("enrich", "active", "Recherche de données officielles…");

      try {
        const companyName = scrapeData.title || "unknown";
        const enrichRes = await fetch("/api/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyName }),
          signal: AbortSignal.timeout(5_000),
        });

        if (enrichRes.ok) {
          const datagouv = await enrichRes.json();
          if (datagouv.found) {
            scrapeData.datagouv = datagouv;
            upsertStep("enrich", "done", "Données officielles trouvées");
          } else {
            upsertStep("enrich", "done", "Pas de données officielles");
          }
        } else {
          upsertStep("enrich", "done", "Données officielles indisponibles");
        }
      } catch {
        upsertStep("enrich", "done", "Enrichissement ignoré");
      }

      // Étape 2 : analyse IA
      upsertStep("analyzing", "active", "Analyse IA en cours…");

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scrapeData }),
      });

      const analyzeData = await analyzeRes.json();

      console.log("Analyze response:", { status: analyzeRes.status, ok: analyzeRes.ok, data: analyzeData });

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

  useEffect(() => {
    if (!result) return;

    async function saveReport() {
      if (!result) return;
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: result.url,
            company_name: result.report.company.name,
            report: result.report,
          }),
        });

        if (res.ok) {
          setToast("Rapport sauvegardé");
          setTimeout(() => setToast(null), 3000);
        }
      } catch {
        // Silent fail - don't show error for auto-save
      }
    }

    saveReport();
  }, [result]);

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
            className="flex-1 py-4 px-8 text-xs font-semibold tracking-[0.15em] uppercase border-b-2 border-black bg-black text-white transition-colors text-center"
          >
            Nouveau benchmark
          </a>
          <a
            href="/recherche"
            className="flex-1 py-4 px-8 text-xs font-medium tracking-[0.15em] uppercase border-b-2 border-transparent text-neutral-500 hover:text-black hover:border-neutral-300 transition-colors text-center"
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
                  setExistingReport(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="https://exemple.com"
                disabled={loading}
                className="flex-1 border border-r-0 border-black px-4 py-3.5 text-sm font-mono bg-white outline-none placeholder:text-neutral-300 focus:bg-neutral-50 transition-colors disabled:text-neutral-400"
              />
              <button
                type="button"
                onClick={() => handleAnalyze()}
                disabled={!url.trim() || loading}
                className="bg-black text-white text-xs font-medium tracking-[0.2em] uppercase px-7 py-3.5 hover:bg-neutral-800 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? "Analyse…" : "Analyser"}
              </button>
            </div>
            {error && error.includes("Cloudflare") ? (
              <div className="flex flex-col items-center gap-3 mt-1">
                <p className="text-xs text-red-500 tracking-wide leading-relaxed text-center">{error}</p>
                <RobotFall />
              </div>
            ) : error ? (
              <p className="text-xs text-red-500 tracking-wide">{error}</p>
            ) : null}
            {!error && (
              <p className="text-xs text-neutral-400">
                Formats acceptés — https://domaine.com · https://www.domaine.com
              </p>
            )}
          </div>

          {existingReport && (
            <div className="mt-4 p-4 bg-neutral-100 border border-neutral-300 flex items-center justify-between">
              <p className="text-sm text-neutral-700">
                Vous avez déjà analysé <span className="font-semibold">{existingReport.company_name}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/report/${existingReport.id}`)}
                  className="text-xs font-medium tracking-[0.15em] uppercase px-4 py-2 bg-black text-white hover:bg-neutral-800 transition-colors"
                >
                  Voir l'analyse
                </button>
                <button
                  onClick={() => {
                    skipDuplicateCheck.current = true;
                    handleAnalyze();
                  }}
                  className="text-xs font-medium tracking-[0.15em] uppercase px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors"
                >
                  Relancer quand même
                </button>
              </div>
            </div>
          )}

          {toast && (
            <div className="mt-8 p-3 bg-neutral-100 border border-neutral-300 text-sm text-neutral-700 rounded flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {toast}
            </div>
          )}

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

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
