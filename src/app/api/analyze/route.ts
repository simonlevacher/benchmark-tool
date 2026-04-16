import { NextRequest, NextResponse } from "next/server";
import { analyze, ScrapeData } from "@/lib/ai-providers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { scrapeData?: ScrapeData };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 });
  }

  const { scrapeData } = body;

  if (!scrapeData) {
    return NextResponse.json({ error: "Champ 'scrapeData' manquant." }, { status: 400 });
  }

  try {
    const report = await analyze(scrapeData);
    return NextResponse.json({ report });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'analyse IA.";
    console.error("[analyze]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
