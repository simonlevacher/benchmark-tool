import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

type SearchResult = {
  name: string;
  url: string;
  source: "ia" | "web";
};

type SearchResponse = {
  results: SearchResult[];
  sources: {
    knowledge: "ok" | "error";
    search: "ok" | "error";
  };
};

function buildSearchPrompt(query: string): string {
  return `Liste 5 entreprises réelles correspondant à : "${query}".
Pour chaque entreprise, donne le nom officiel et l'URL du site officiel.
Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown, sans explication :
[{"name":"Nom Entreprise","url":"https://site-officiel.com"},...]`;
}

async function callGemini(query: string, withGrounding: boolean): Promise<SearchResult[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY non définie.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(withGrounding ? { tools: [{ googleSearch: {} } as any] } : {}),
  });

  const result = await model.generateContent(buildSearchPrompt(query));
  const text = result.response.text().trim();
  const clean = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  const parsed = JSON.parse(clean) as { name: string; url: string }[];
  const source: "ia" | "web" = withGrounding ? "web" : "ia";
  return parsed.map((item) => ({ ...item, source }));
}

function dedup(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();
  for (const item of results) {
    try {
      const hostname = new URL(item.url).hostname.replace(/^www\./, "");
      if (!seen.has(hostname) || item.source === "web") {
        seen.set(hostname, item);
      }
    } catch {
      // URL invalide — on ignore
    }
  }
  return Array.from(seen.values());
}

export async function POST(req: NextRequest) {
  let body: { query?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 });
  }

  const { query } = body;
  if (!query || typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ error: "Champ 'query' manquant." }, { status: 400 });
  }

  const [knowledgeResult, searchResult] = await Promise.allSettled([
    callGemini(query.trim(), false),
    callGemini(query.trim(), true),
  ]);

  const knowledgeOk = knowledgeResult.status === "fulfilled";
  const searchOk = searchResult.status === "fulfilled";

  if (!knowledgeOk && !searchOk) {
    return NextResponse.json(
      { error: "Recherche indisponible. Veuillez réessayer." },
      { status: 502 }
    );
  }

  const combined: SearchResult[] = [
    ...(knowledgeOk ? knowledgeResult.value : []),
    ...(searchOk ? searchResult.value : []),
  ];

  const response: SearchResponse = {
    results: dedup(combined),
    sources: {
      knowledge: knowledgeOk ? "ok" : "error",
      search: searchOk ? "ok" : "error",
    },
  };

  return NextResponse.json(response);
}
