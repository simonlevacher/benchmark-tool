import { GoogleGenerativeAI } from "@google/generative-ai";

export type ScrapeData = {
  url: string;
  title: string | null;
  metaDescription: string | null;
  headings: { level: string; text: string }[];
  paragraphs: string[];
  datagouv?: {
    found: boolean;
    siren?: string;
    siret_siege?: string;
    date_creation?: string;
    effectif?: string;
    forme_juridique?: string;
    naf_code?: string;
    naf_libelle?: string;
    adresse?: string;
    dirigeants?: string[];
    certifications?: string[];
  };
};

export type NewsItem = {
  title: string;
  url: string;
  date: string;
  source: string;
};

export type Report = {
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
  features: {
    name: string;
    description: string;
    category: string;
  }[];
  analysis: {
    strengths: string[];
    weaknesses: string[];
    positioning: string;
    target_market: string;
  };
  news: NewsItem[];
};

// ─── Prompt ───────────────────────────────────────────────────────────────────

export function buildPrompt(data: ScrapeData): string {
  const headings = data.headings
    .map((h) => `  [${h.level}] ${h.text}`)
    .join("\n");
  const paragraphs = data.paragraphs.slice(0, 20).join("\n\n");

  let datagouv_section = "";
  if (data.datagouv?.found) {
    const d = data.datagouv;
    datagouv_section = `

DONNÉES OFFICIELLES (API Recherche d'Entreprises — data.gouv.fr) :
SIREN : ${d.siren}
SIRET siège : ${d.siret_siege}
Date de création : ${d.date_creation}
Forme juridique : ${d.forme_juridique}
Code NAF : ${d.naf_code} — ${d.naf_libelle}
Tranche effectif (INSEE) : ${d.effectif}
Adresse siège : ${d.adresse}${d.dirigeants && d.dirigeants.length > 0 ? `\nDirigeants : ${d.dirigeants.join(", ")}` : ""}${d.certifications && d.certifications.length > 0 ? `\nCertifications : ${d.certifications.join(", ")}` : ""}`;
  }

  return `Tu es un analyste business expert en stratégie produit et marketing B2B.

Voici les données extraites du site web "${data.url}" :

TITRE : ${data.title ?? "N/A"}
META DESCRIPTION : ${data.metaDescription ?? "N/A"}

TITRES DE LA PAGE :
${headings}

CONTENU PRINCIPAL :
${paragraphs}${datagouv_section}

---

Utilise Google Search pour trouver des informations récentes et précises sur cette entreprise :
- Date de fondation
- Historique complet de financement : TOUS les tours (Seed, Série A, B, C, D, etc.) avec année, montant exact, noms des investisseurs principaux, ET URL de la source (article TechCrunch, Crunchbase, communiqué de presse, etc.), classés chronologiquement du plus ancien au plus récent
- Nombre d'employés
- EBITDA ou chiffre d'affaires estimé
- Chiffre d'affaires/revenu annuels des dernières années disponibles
- Nombre de clients
- Filiales et participations (si applicable) : nom de la filiale, pourcentage de participation, secteur d'activité
- Actualités récentes (articles de presse, annonces, levées de fonds, partenariats, lancements produit des 12 derniers mois avec leurs URLs)
- Positionnement concurrentiel

Ensuite, analyse ce site et retourne un objet JSON avec exactement cette structure. Si une information est vraiment introuvable, indique "Non divulgué". Pour les news, retourne uniquement des URLs réelles et vérifiables trouvées via Google Search.

IMPORTANT :
- Si des DONNÉES OFFICIELLES (data.gouv.fr) sont présentes, extrais-en le SIREN, SIRET, forme juridique, code NAF, et dirigeants pour les inclure dans le JSON.
- Pour les filiales, inclus TOUJOURS le tableau "subsidiaries" (vide [] si aucune trouvée). Pour chaque filiale, inclus le nom, le pourcentage de participation, et le secteur d'activité.

Réponds UNIQUEMENT avec le JSON brut, sans balises markdown, sans explications. Toutes les valeurs textuelles doivent être en français.

{
  "company": {
    "name": "Nom de l'entreprise",
    "description": "Description synthétique de l'entreprise en 2-3 phrases (ce qu'elle fait, pour qui, valeur clé)",
    "founded": "Année de fondation ou 'Non divulgué'",
    "employees": "Fourchette ex: 50-100 ou 'Non divulgué'",
    "funding": "Montant et série ex: 'Série A — 5M€' ou 'Bootstrapped' ou 'Non divulgué'",
    "ebitda": "EBITDA ou revenu estimé ex: '10M€' ou 'Non divulgué'",
    "clients": "Nombre ou profil de clients ex: '5 000+ entreprises'",
    "funding_history": [
      {
        "year": "2020",
        "round": "Seed",
        "amount": "1M€",
        "investors": "Kima Ventures",
        "source": "TechCrunch",
        "source_url": "https://techcrunch.com/..."
      },
      {
        "year": "2021",
        "round": "Série A",
        "amount": "5M€",
        "investors": "Sequoia Capital, Y Combinator",
        "source": "Crunchbase",
        "source_url": "https://crunchbase.com/..."
      },
      {
        "year": "2023",
        "round": "Série B",
        "amount": "25M€",
        "investors": "Andreessen Horowitz, Bedrock Capital",
        "source": "Press Release",
        "source_url": "https://company.com/press-release/..."
      }
    ],
    "revenue_history": [
      {
        "year": "2022",
        "revenue": 3,
        "label": "3M€"
      },
      {
        "year": "2023",
        "revenue": 8,
        "label": "8M€"
      }
    ],
    "subsidiaries": [
      {
        "name": "TechStartup SAS",
        "stake": "100%",
        "sector": "Logiciels"
      },
      {
        "name": "Innovation Labs Inc",
        "stake": "75%",
        "sector": "Recherche & Développement"
      }
    ],
    "siren": "123456789",
    "siret": "12345678900012",
    "forme_juridique": "SAS",
    "naf": "6201Z — Programmation informatique",
    "dirigeants": ["Jean Dupont (Président)", "Marie Martin (Directrice générale)"]
  },
  "features": [
    {
      "name": "Nom de la fonctionnalité",
      "description": "Description claire de la fonctionnalité en 1-2 phrases",
      "category": "Une catégorie parmi: Productivité, Recrutement, Plateforme, Analytics, Communication, Collaboration, IA"
    }
  ],
  "analysis": {
    "strengths": ["Point fort 1", "Point fort 2", "Point fort 3", "Point fort 4"],
    "weaknesses": ["Point faible 1", "Point faible 2", "Point faible 3"],
    "positioning": "Paragraphe de 2-3 phrases sur le positionnement marché et le différenciateur principal",
    "target_market": "Paragraphe de 2-3 phrases sur le marché cible et les cas d'usage principaux"
  },
  "news": [
    {
      "title": "Titre de l'article",
      "url": "https://url-reelle-de-l-article.com",
      "date": "JJ/MM/AAAA ou 'Date inconnue'",
      "source": "Nom du média ex: TechCrunch, Les Echos, Le Monde"
    }
  ]
}`;
}

// ─── Gemini ───────────────────────────────────────────────────────────────────

export async function analyzeWithGemini(data: ScrapeData): Promise<Report> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY non définie.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ googleSearch: {} } as any],
  });

  const maxRetries = 4;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(buildPrompt(data));
      const text = result.response.text().trim();
      const clean = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
      return JSON.parse(clean) as Report;
    } catch (err: unknown) {
      const is429 =
        err instanceof Error &&
        (err.message.includes("429") || err.message.toLowerCase().includes("resource exhausted"));

      if (is429 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 5000; // 5s, 10s, 20s
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }

  throw new Error("Gemini: nombre maximum de tentatives atteint.");
}

// ─── Claude (à brancher plus tard) ───────────────────────────────────────────

// export async function analyzeWithClaude(data: ScrapeData): Promise<Report> {
//   const apiKey = process.env.ANTHROPIC_API_KEY;
//   if (!apiKey) throw new Error("ANTHROPIC_API_KEY non définie.");
//
//   const Anthropic = (await import("@anthropic-ai/sdk")).default;
//   const client = new Anthropic({ apiKey });
//
//   const message = await client.messages.create({
//     model: "claude-opus-4-6",
//     max_tokens: 4096,
//     messages: [{ role: "user", content: buildPrompt(data) }],
//   });
//
//   const text = (message.content[0] as { text: string }).text.trim();
//   const clean = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
//   return JSON.parse(clean) as Report;
// }

// ─── Router principal ─────────────────────────────────────────────────────────

export async function analyze(data: ScrapeData): Promise<Report> {
  // Switcher ici : analyzeWithClaude(data) quand prêt
  return analyzeWithGemini(data);
}
