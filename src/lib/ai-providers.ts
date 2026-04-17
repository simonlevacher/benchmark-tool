import { GoogleGenerativeAI } from "@google/generative-ai";

export type ScrapeData = {
  url: string;
  title: string | null;
  metaDescription: string | null;
  headings: { level: string; text: string }[];
  paragraphs: string[];
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
    funding_history: { year: string; round: string; amount: string; investors: string }[];
    revenue_history: { year: string; revenue: number | null; label: string }[];
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

  return `Tu es un analyste business expert en stratégie produit et marketing B2B.

Voici les données extraites du site web "${data.url}" :

TITRE : ${data.title ?? "N/A"}
META DESCRIPTION : ${data.metaDescription ?? "N/A"}

TITRES DE LA PAGE :
${headings}

CONTENU PRINCIPAL :
${paragraphs}

---

Utilise Google Search pour trouver des informations récentes et précises sur cette entreprise :
- Date de fondation
- Historique complet de financement : TOUS les tours (Seed, Série A, B, C, D, etc.) avec année, montant exact, et noms des investisseurs principaux, classés chronologiquement du plus ancien au plus récent
- Nombre d'employés
- EBITDA ou chiffre d'affaires estimé
- Chiffre d'affaires/revenu annuels des dernières années disponibles
- Nombre de clients
- Actualités récentes (articles de presse, annonces, levées de fonds, partenariats, lancements produit des 12 derniers mois avec leurs URLs)
- Positionnement concurrentiel

Ensuite, analyse ce site et retourne un objet JSON avec exactement cette structure. Si une information est vraiment introuvable, indique "Non divulgué". Pour les news, retourne uniquement des URLs réelles et vérifiables trouvées via Google Search.

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
        "investors": "Kima Ventures"
      },
      {
        "year": "2021",
        "round": "Série A",
        "amount": "5M€",
        "investors": "Sequoia Capital, Y Combinator"
      },
      {
        "year": "2023",
        "round": "Série B",
        "amount": "25M€",
        "investors": "Andreessen Horowitz, Bedrock Capital"
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
    ]
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
    model: "gemini-2.0-flash",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ googleSearch: {} } as any],
  });

  const result = await model.generateContent(buildPrompt(data));
  const text = result.response.text().trim();

  // Strip possible markdown code fences
  const clean = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  return JSON.parse(clean) as Report;
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
