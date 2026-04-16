import { GoogleGenerativeAI } from "@google/generative-ai";

export type ScrapeData = {
  url: string;
  title: string | null;
  metaDescription: string | null;
  headings: { level: string; text: string }[];
  paragraphs: string[];
};

export type Report = {
  company: {
    name: string;
    description: string;
    founded: string;
    employees: string;
    funding: string;
    clients: string;
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

Utilise Google Search pour trouver des informations récentes et précises sur cette entreprise : date de fondation, levées de fonds (montant, série, investisseurs), nombre d'employés, nombre de clients, actualités récentes, positionnement concurrentiel.

Ensuite, analyse ce site et retourne un objet JSON avec exactement cette structure. Si une information est vraiment introuvable, indique "Non divulgué".

Réponds UNIQUEMENT avec le JSON brut, sans balises markdown, sans explications.

{
  "company": {
    "name": "Nom de l'entreprise",
    "description": "Description synthétique de l'entreprise en 2-3 phrases (ce qu'elle fait, pour qui, valeur clé)",
    "founded": "Année de fondation ou 'Non divulgué'",
    "employees": "Fourchette ex: 50-100 ou 'Non divulgué'",
    "funding": "Montant et série ex: 'Série A — 5M€' ou 'Bootstrapped' ou 'Non divulgué'",
    "clients": "Nombre ou profil de clients ex: '5 000+ entreprises'"
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
  }
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
