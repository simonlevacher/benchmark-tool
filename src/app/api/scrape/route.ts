import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

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

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Protocole non supporté.");
    }
  } catch {
    return NextResponse.json({ error: "URL invalide." }, { status: 422 });
  }

  let html: string;
  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Le site a répondu avec le statut ${response.status}.` },
        { status: 502 }
      );
    }

    html = await response.text();
  } catch (err) {
    const message =
      err instanceof Error && err.name === "TimeoutError"
        ? "Le site n'a pas répondu dans les délais (10s)."
        : "Site inaccessible.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const $ = cheerio.load(html);

  // Titre
  const title = $("title").first().text().trim() || null;

  // Meta description
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    null;

  // Headings h1/h2/h3
  const headings: { level: string; text: string }[] = [];
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      headings.push({ level: el.tagName.toLowerCase(), text });
    }
  });

  // Paragraphes principaux (non vides, min 40 caractères)
  const paragraphs: string[] = [];
  $("p").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length >= 40) {
      paragraphs.push(text);
    }
  });

  return NextResponse.json({
    url: parsedUrl.toString(),
    title,
    metaDescription,
    headings,
    paragraphs,
  });
}
