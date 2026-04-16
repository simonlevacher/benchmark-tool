import { NextRequest } from "next/server";
import { analyze, ScrapeData, Report } from "@/lib/ai-providers";

export const dynamic = "force-dynamic";

// ─── Mock fallback ────────────────────────────────────────────────────────────

const MOCK_REPORT: Report = {
  company: {
    name: "Noota",
    description:
      "Plateforme d'agents IA pour la productivité et le recrutement. Noota automatise la prise de notes, la transcription des réunions et le sourcing de candidats grâce à une suite d'agents intelligents connectés aux outils existants.",
    founded: "2021",
    employees: "50–100",
    funding: "Série A — montant non divulgué",
    clients: "5 000+ entreprises et recruteurs",
  },
  features: [
    {
      name: "Agent de recrutement",
      description:
        "Sourcing IA de jusqu'à 100 candidats qualifiés en 30 secondes, évaluation automatique selon un scorecard, séquences multicanales et agents de préqualification vocaux 24h/24.",
      category: "Recrutement",
    },
    {
      name: "Preneur de notes IA",
      description:
        "Enregistrement et transcription automatique des réunions en présentiel, en ligne ou par téléphone. Génération de résumés, rapports et actions de suivi.",
      category: "Productivité",
    },
    {
      name: "Agent vocal",
      description:
        "Création d'agents vocaux personnalisés avec des voix naturelles pour la préqualification de candidats ou la mise en situation commerciale.",
      category: "Recrutement",
    },
    {
      name: "Agent de messagerie",
      description:
        "Automatisation de la boîte mail (Outlook/Gmail). Tri intelligent et rédaction de réponses en brouillon dans le ton de l'utilisateur.",
      category: "Productivité",
    },
    {
      name: "Base de connaissance unifiée",
      description:
        "Centralisation de toutes les conversations (réunions, appels, emails) dans un espace de travail unique alimenté par l'IA.",
      category: "Productivité",
    },
    {
      name: "Intégrations natives",
      description:
        "Plus de 100 intégrations : ATS, calendrier, email, outils de visio. Plugin Chrome natif pour déployer l'IA dans tout le navigateur.",
      category: "Plateforme",
    },
  ],
  analysis: {
    strengths: [
      "Suite tout-en-un couvrant réunions, recrutement, email et téléphonie — réduction du nombre d'outils",
      "Forte preuve sociale : 5 000+ équipes dont Carrefour, témoignages détaillés",
      "Agent de sourcing IA différenciant : 100 candidats qualifiés en 30 secondes",
      "Conformité entreprise : ISO 27001, architecture compatible SecNumCloud",
    ],
    weaknesses: [
      "Positionnement large (productivité + recrutement) qui peut diluer le message",
      "Tarification non affichée publiquement — friction à l'entrée",
      "Marché très concurrentiel : Otter.ai, Fireflies, Notion AI, Teamtailor",
    ],
    positioning:
      "Noota se positionne comme le système nerveux central de la communication d'entreprise, en unifiant réunions, recrutement et email sous une même IA. Le différenciateur principal est la suite recrutement bout-en-bout, absente chez la plupart des concurrents.",
    target_market:
      "TPE/PME, ETI et grands groupes avec des équipes RH actives. Particulièrement adapté aux agences de recrutement (RPO) et aux équipes commerciales en forte activité de réunions.",
  },
};

// ─── SSE helpers ─────────────────────────────────────────────────────────────

type SSEEvent =
  | { type: "step"; id: string; status: "active" | "done" | "error"; message: string }
  | { type: "done"; url: string; report: Report; usedFallback: boolean }
  | { type: "error"; message: string };

function encode(event: SSEEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { url?: string };

  try {
    body = await req.json();
  } catch {
    return new Response(`data: ${JSON.stringify({ type: "error", message: "Body JSON invalide." })}\n\n`, {
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const { url } = body;

  if (!url || typeof url !== "string") {
    return new Response(`data: ${JSON.stringify({ type: "error", message: "Champ 'url' manquant." })}\n\n`, {
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => controller.enqueue(encode(event));

      try {
        // Étape 1 : scraping
        send({ type: "step", id: "scraping", status: "active", message: "Récupération du contenu…" });

        const scrapeRes = await fetch(new URL("/api/scrape", req.url).toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
          cache: "no-store",
        });

        if (!scrapeRes.ok) {
          const err = await scrapeRes.json();
          send({ type: "step", id: "scraping", status: "error", message: err.error ?? "Échec de la récupération du site." });
          send({ type: "error", message: err.error ?? "Échec de la récupération du site." });
          controller.close();
          return;
        }

        const scrapeData: ScrapeData = await scrapeRes.json();
        send({ type: "step", id: "scraping", status: "done", message: "Contenu récupéré" });

        // Étape 2 : analyse IA
        send({ type: "step", id: "analyzing", status: "active", message: "Analyse IA en cours…" });

        let report: Report;
        let usedFallback = false;

        try {
          report = await analyze(scrapeData);
        } catch (err) {
          console.error("[analyze] Erreur IA, fallback mock :", err);
          report = MOCK_REPORT;
          usedFallback = true;
        }

        send({ type: "step", id: "analyzing", status: "done", message: "Analyse terminée" });

        // Résultat final
        send({ type: "done", url, report, usedFallback });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inattendue.";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
