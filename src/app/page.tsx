"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function ClampedText({ value }: { value: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setTruncated(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [value]);

  useEffect(() => {
    const onResize = () => {
      const el = ref.current;
      if (el) setTruncated(el.scrollHeight > el.clientHeight + 1);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="relative group">
      <p
        ref={ref}
        className="text-sm font-medium leading-relaxed break-words whitespace-pre-line line-clamp-3 cursor-default"
      >
        {value}
      </p>
      {truncated && (
        <div className="pointer-events-none absolute left-0 right-0 top-full mt-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs leading-relaxed p-3 shadow-lg whitespace-pre-line break-words">
          {value}
        </div>
      )}
    </div>
  );
}

type Feature = {
  name: string;
  description: string;
  category: string;
};

type NewsItem = {
  title: string;
  url: string;
  date: string;
  source: string;
};

type Report = {
  company: {
    name: string;
    description: string;
    founded: string;
    employees: string;
    funding: string;
    ebitda: string;
    clients: string;
    funding_history: { year: string; round: string; amount: string; investors: string; source?: string; source_url?: string }[];
    revenue_history: { year: string; revenue: number | null; label: string }[];
    subsidiaries: { name: string; stake?: string; sector?: string }[];
    siren?: string;
    siret?: string;
    dirigeants?: string[];
    forme_juridique?: string;
    naf?: string;
  };
  features: Feature[];
  analysis: {
    strengths: string[];
    weaknesses: string[];
    positioning: string;
    target_market: string;
  };
  news: NewsItem[];
};

// ─── Report ───────────────────────────────────────────────────────────────────

function ReportView({ url, report }: { url: string; report: Report }) {
  const { company, features, analysis, news } = report;

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
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-neutral-200 items-stretch">
          {[
            { label: "Fondée", value: company.founded },
            { label: "Employés", value: company.employees },
            { label: "EBITDA", value: company.ebitda },
            { label: "Clients", value: company.clients },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white p-4 min-w-0 h-32 flex flex-col">
              <p className="text-xs text-neutral-400 tracking-widest uppercase mb-1">{label}</p>
              <div className="flex-1 min-w-0">
                <ClampedText value={value} />
              </div>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500 mb-3">
            Description
          </p>
          <p className="text-sm text-neutral-700 leading-relaxed">{company.description}</p>
        </div>
      </div>

      <div className="w-full h-px bg-neutral-200" />

      <div>
        <p className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500 mb-6">
          Historique de financement
        </p>
        {company.funding_history.length > 0 ? (
          <div className="flex flex-col gap-4">
            {company.funding_history.map((fund, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-3 mt-0.5">
                  <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0" />
                  {i < company.funding_history.length - 1 && (
                    <div className="w-px h-8 bg-neutral-200" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-baseline gap-3 mb-1">
                    <p className="text-sm font-medium">{fund.round}</p>
                    <p className="text-xs text-neutral-400">{fund.year}</p>
                  </div>
                  <p className="text-sm text-neutral-700 mb-1">{fund.amount}</p>
                  <p className="text-xs text-neutral-500 mb-2">{fund.investors}</p>
                  {fund.source_url && (
                    <a
                      href={fund.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1.5 w-fit"
                    >
                      {fund.source || "Source"}
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                        <path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Pas d'information disponible</p>
        )}
      </div>

      <div className="w-full h-px bg-neutral-200" />

      <div>
        <p className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500 mb-6">
          Filiales et participations
        </p>
        {company.subsidiaries.length > 0 ? (
          <div className="space-y-3">
            {company.subsidiaries.map((sub, i) => (
              <div key={i} className="flex items-start gap-4 p-3 bg-neutral-50 border border-neutral-200">
                <span className="w-1 h-1 rounded-full bg-black mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <p className="text-sm font-medium">{sub.name}</p>
                    {sub.stake && (
                      <p className="text-xs text-neutral-400">{sub.stake}</p>
                    )}
                  </div>
                  {sub.sector && (
                    <p className="text-xs text-neutral-500">{sub.sector}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Pas d'information disponible</p>
        )}
      </div>

      <div className="w-full h-px bg-neutral-200" />

      <div>
        <p className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500 mb-6">
          Évolution du chiffre d'affaires
        </p>
        {company.revenue_history.length > 0 ? (
          <div className="w-full h-64 bg-white border border-neutral-200 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={company.revenue_history} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" stroke="#999" style={{ fontSize: "12px" }} />
                <YAxis stroke="#999" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => (value !== null ? `${value}M€` : "Non disponible")}
                  labelFormatter={(label) => `${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#000"
                  fill="#f0f0f0"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Pas d'information disponible</p>
        )}
      </div>

      <div className="w-full h-px bg-neutral-200" />

      {company.siren && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500 mb-3">
                Données officielles (data.gouv.fr)
              </p>
              <div className="text-sm text-neutral-700 space-y-2">
                {company.siren && (
                  <div>
                    <p className="text-xs text-neutral-400 tracking-widest uppercase mb-0.5">
                      SIREN
                    </p>
                    <p className="font-mono">{company.siren}</p>
                  </div>
                )}
                {company.siret && (
                  <div>
                    <p className="text-xs text-neutral-400 tracking-widest uppercase mb-0.5">
                      SIRET
                    </p>
                    <p className="font-mono">{company.siret}</p>
                  </div>
                )}
                {company.forme_juridique && (
                  <div>
                    <p className="text-xs text-neutral-400 tracking-widest uppercase mb-0.5">
                      Forme juridique
                    </p>
                    <p>{company.forme_juridique}</p>
                  </div>
                )}
                {company.naf && (
                  <div>
                    <p className="text-xs text-neutral-400 tracking-widest uppercase mb-0.5">
                      Activité principale
                    </p>
                    <p>{company.naf}</p>
                  </div>
                )}
              </div>
            </div>
            {company.dirigeants && company.dirigeants.length > 0 && (
              <div>
                <p className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500 mb-3">
                  Dirigeants
                </p>
                <ul className="flex flex-col gap-2 text-sm text-neutral-700">
                  {company.dirigeants.map((d, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1 w-1 h-1 rounded-full bg-black shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="w-full h-px bg-neutral-200" />
        </>
      )}

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

      {news && news.length > 0 && (
        <>
          <div className="w-full h-px bg-neutral-200" />
          <div>
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500 mb-6">
              Actualités récentes — {news.length}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-neutral-200">
              {news.map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white p-6 flex flex-col justify-between h-32 hover:bg-neutral-50 transition-colors group"
                >
                  <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:underline underline-offset-2">
                    {item.title}
                  </p>
                  <div className="flex items-center justify-between gap-3 mt-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-neutral-400 truncate">{item.source}</span>
                      <span className="text-neutral-300 shrink-0">·</span>
                      <span className="text-xs text-neutral-400 shrink-0">{item.date}</span>
                    </div>
                    <svg className="shrink-0 text-neutral-300 group-hover:text-black transition-colors" width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
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
