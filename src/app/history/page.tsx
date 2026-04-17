"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Report } from "@/lib/db";

type StoredReport = {
  id: number;
  url: string;
  company_name: string;
  report: Report;
  created_at: Date | string;
};

function ReportListItem({ report }: { report: StoredReport }) {
  const router = useRouter();
  const date = new Date(report.created_at);
  const formattedDate = date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="border border-neutral-200 p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{report.company_name}</p>
        <p className="text-xs text-neutral-400 font-mono truncate mt-1">
          {report.url}
        </p>
        <p className="text-xs text-neutral-500 mt-2">{formattedDate}</p>
      </div>
      <div className="flex gap-2 ml-4 shrink-0">
        <button
          onClick={() => router.push(`/report/${report.id}`)}
          className="text-xs font-medium tracking-[0.2em] uppercase px-4 py-2 bg-neutral-100 text-black hover:bg-neutral-200 transition-colors"
        >
          Voir
        </button>
        <button
          onClick={() => router.push(`/?url=${encodeURIComponent(report.url)}`)}
          className="text-xs font-medium tracking-[0.2em] uppercase px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors"
        >
          Relancer
        </button>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [reports, setReports] = useState<StoredReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/reports");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Impossible de charger l'historique");
          setReports([]);
          return;
        }

        setReports(data.results || []);
      } catch {
        setError("Erreur réseau");
        setReports([]);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-black px-8 py-5 flex items-center justify-between">
        <span className="text-xs font-medium tracking-[0.2em] uppercase">
          Benchmark Tool
        </span>
        <a
          href="/"
          className="text-xs font-medium tracking-[0.2em] uppercase hover:text-neutral-600 transition-colors"
        >
          Retour
        </a>
      </header>

      <main className="flex-1 px-8 py-24">
        <div className="w-full max-w-3xl mx-auto">
          <div className="mb-12">
            <div className="w-8 h-px bg-black mb-8" />
            <h1 className="text-3xl font-medium tracking-tight mb-5">
              Historique des analyses
            </h1>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Consultez vos rapports d'analyse précédents ou relancez une
              analyse pour obtenir les dernières données.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center gap-4">
              <div className="w-4 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              </div>
              <p className="text-sm text-black tracking-wide">
                Chargement de l'historique…
              </p>
            </div>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-neutral-400">
              Aucun rapport sauvegardé pour le moment.
            </p>
          ) : (
            <div className="space-y-px">
              {reports.map((report) => (
                <ReportListItem key={report.id} report={report} />
              ))}
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
