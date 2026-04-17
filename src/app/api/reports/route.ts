import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json(
        {
          results: [],
          message: "Base de données non configurée",
        },
        { status: 200 }
      );
    }

    const allReports = await db
      .select()
      .from(reports)
      .orderBy(desc(reports.created_at));

    return NextResponse.json({ results: allReports }, { status: 200 });
  } catch (err) {
    console.error("[reports GET]", err);
    return NextResponse.json(
      { error: "Impossible de récupérer l'historique" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json(
        { message: "Base de données non configurée, rapport non sauvegardé" },
        { status: 200 }
      );
    }

    let body: { url?: string; company_name?: string; report?: unknown };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Body JSON invalide" },
        { status: 400 }
      );
    }

    const { url, company_name, report } = body;

    if (!url || !company_name || !report) {
      return NextResponse.json(
        { error: "Champs manquants (url, company_name, report requis)" },
        { status: 400 }
      );
    }

    const inserted = await db
      .insert(reports)
      .values({
        url: String(url),
        company_name: String(company_name),
        report: report as unknown,
      })
      .returning({ id: reports.id, created_at: reports.created_at });

    return NextResponse.json(
      {
        ok: true,
        id: inserted[0].id,
        created_at: inserted[0].created_at,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[reports POST]", err);
    return NextResponse.json(
      { message: "Erreur lors de la sauvegarde (non bloquant)" },
      { status: 200 }
    );
  }
}
