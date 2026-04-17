import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json(
        { error: "Base de données non configurée" },
        { status: 503 }
      );
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID invalide" },
        { status: 400 }
      );
    }

    const report = await db
      .select()
      .from(reports)
      .where(eq(reports.id, id))
      .limit(1);

    if (!report.length) {
      return NextResponse.json(
        { error: "Rapport non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(report[0], { status: 200 });
  } catch (err) {
    console.error("[reports[id] GET]", err);
    return NextResponse.json(
      { error: "Impossible de récupérer le rapport" },
      { status: 500 }
    );
  }
}
