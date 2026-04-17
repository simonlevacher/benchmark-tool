"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Report } from "@/lib/db";
import { ReportView } from "@/app/_components/report-view";

type StoredReport = {
  id: number;
  url: string;
  company_name: string;
  report: Report;
  created_at: Date | string;
};

export default function ReportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [storedReport, setStoredReport] = useState<StoredReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports/${params.id}`);

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Rapport non trouvé");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setStoredReport(data);
      } catch {
        setError("Erreur réseau");
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="border-b border-black px-8 py-5">
          <span className="text-xs font-medium tracking-[0.2em] uppercase">
            Benchmark Tool
          </span>
        </header>
        <main className="flex-1 px-8 py-24 flex items-center justify-center">
          <div className="flex items-center gap-4">
            <div className="w-4 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
            </div>
            <p className="text-sm text-black tracking-wide">
              Chargement du rapport…
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !storedReport) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="border-b border-black px-8 py-5">
          <span className="text-xs font-medium tracking-[0.2em] uppercase">
            Benchmark Tool
          </span>
        </header>
        <main className="flex-1 px-8 py-24">
          <div className="w-full max-w-2xl mx-auto">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={() => router.push("/history")}
              className="mt-4 text-xs font-medium tracking-[0.2em] uppercase px-4 py-2 bg-black text-white hover:bg-neutral-800 transition-colors"
            >
              Retour à l'historique
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-black px-8 py-5 flex items-center justify-between">
        <span className="text-xs font-medium tracking-[0.2em] uppercase">
          Benchmark Tool
        </span>
        <button
          onClick={() => router.push("/history")}
          className="text-xs font-medium tracking-[0.2em] uppercase hover:text-neutral-600 transition-colors"
        >
          Historique
        </button>
      </header>

      <main className="flex-1 px-8 py-24">
        <div className="w-full max-w-2xl mx-auto">
          <ReportView
            url={storedReport.url}
            report={storedReport.report}
            saved_id={storedReport.id}
          />
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
