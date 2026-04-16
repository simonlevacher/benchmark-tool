import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body: { url?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 });
  }

  const { url } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Champ 'url' manquant." }, { status: 400 });
  }

  // Appel à /api/scrape
  const scrapeRes = await fetch(new URL("/api/scrape", req.url).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!scrapeRes.ok) {
    const err = await scrapeRes.json();
    return NextResponse.json(
      { error: err.error ?? "Erreur lors du scraping." },
      { status: scrapeRes.status }
    );
  }

  // TODO: remplacer par une analyse IA réelle basée sur scrapeData
  // const scrapeData = await scrapeRes.json();

  const report = {
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
          "Sourcing IA de jusqu'à 100 candidats qualifiés en 30 secondes, évaluation automatique selon un scorecard, séquences multicanales (email, LinkedIn, WhatsApp) et agents de préqualification vocaux disponibles 24h/24.",
        category: "Recrutement",
      },
      {
        name: "Preneur de notes IA",
        description:
          "Enregistrement et transcription automatique des réunions en présentiel, en ligne ou par téléphone. Génération de résumés, rapports et actions de suivi. Compatible avec les principaux outils de visio.",
        category: "Productivité",
      },
      {
        name: "Agent vocal",
        description:
          "Création d'agents vocaux personnalisés avec des voix naturelles pour la préqualification de candidats ou la mise en situation commerciale. Partageables via un lien public.",
        category: "Recrutement",
      },
      {
        name: "Agent de messagerie",
        description:
          "Automatisation de la boîte mail (Outlook/Gmail). Tri intelligent des emails et rédaction de réponses en brouillon dans le ton de l'utilisateur.",
        category: "Productivité",
      },
      {
        name: "Base de connaissance unifiée",
        description:
          "Centralisation de toutes les conversations (réunions, appels, emails) dans un espace de travail unique alimenté par l'IA. Recherche et croisement des données entre les sources.",
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
        "Approche multicanale (en personne, en ligne, téléphone) sans bot obligatoire",
      ],
      weaknesses: [
        "Positionnement large (productivité + recrutement) qui peut diluer le message",
        "Tarification non affichée publiquement — friction à l'entrée",
        "Marché très concurrentiel : Otter.ai, Fireflies, Notion AI, Teamtailor",
        "Dépendance aux intégrations tierces pour une grande partie de la valeur",
      ],
      positioning:
        "Noota se positionne comme le système nerveux central de la communication d'entreprise, en unifiant réunions, recrutement et email sous une même IA. Le différenciateur principal est la suite recrutement bout-en-bout (sourcing → entretien → rapport), absente chez la plupart des concurrents.",
      target_market:
        "TPE/PME, ETI et grands groupes avec des équipes RH actives. Particulièrement adapté aux agences de recrutement (RPO), aux équipes commerciales en forte activité de réunions, et aux organisations cherchant à centraliser leurs données conversationnelles.",
    },
  };

  return NextResponse.json({ url, report });
}
