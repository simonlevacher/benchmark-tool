import { NextRequest, NextResponse } from "next/server";

export type DatagouvResult = {
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

export async function POST(req: NextRequest) {
  let body: { companyName?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 });
  }

  const { companyName } = body;

  if (!companyName || typeof companyName !== "string") {
    return NextResponse.json({ error: "companyName manquant." }, { status: 400 });
  }

  try {
    // Clean company name: extract first part before pipe, dash, or special chars
    let cleanName = companyName
      .split("|")[0]
      .split("-")[0]
      .trim()
      .replace(/\s*\(.*?\)\s*/g, ""); // Remove parentheses content

    // Try multiple search strategies
    const searchVariations = [
      cleanName, // original
      cleanName.toUpperCase(), // uppercase
      cleanName.toLowerCase(), // lowercase
      cleanName.split(" ")[0], // first word only
    ];

    let company: any = null;

    for (const query of searchVariations) {
      const searchUrl = new URL("https://recherche-entreprises.api.gouv.fr/search");
      searchUrl.searchParams.set("q", query);
      searchUrl.searchParams.set("page", "1");
      searchUrl.searchParams.set("per_page", "1");

      const response = await fetch(searchUrl.toString(), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
        signal: AbortSignal.timeout(5_000),
      });

      if (response.ok) {
        const data = await response.json() as any;
        const results = data.results || [];
        if (results.length > 0) {
          company = results[0];
          break; // Found a match, stop searching
        }
      }
    }

    if (!company) {
      return NextResponse.json({ found: false } as DatagouvResult);
    }

    // Extract dirigeants (limited to first 3)
    const dirigeants: string[] = [];
    if (company.dirigeants && Array.isArray(company.dirigeants)) {
      company.dirigeants.slice(0, 3).forEach((d: any) => {
        if (d.nom) dirigeants.push(d.nom);
      });
    }

    // Extract certifications
    const certifications: string[] = [];
    if (company.est_qualiopi) certifications.push("Qualiopi");
    if (company.est_bio) certifications.push("Bio");
    if (company.est_organisme_formation)
      certifications.push("Organisme de formation");

    const result: DatagouvResult = {
      found: true,
      siren: company.siren,
      siret_siege: company.siret_siege_social || company.siret,
      date_creation: company.date_creation,
      effectif: company.tranche_effectif_salarie,
      forme_juridique: company.nature_juridique_label || company.nature_juridique,
      naf_code: company.activite_principale,
      naf_libelle: company.libelle_activite_principale,
      adresse: company.adresse_siege_social || company.adresse,
      dirigeants: dirigeants.length > 0 ? dirigeants : undefined,
      certifications: certifications.length > 0 ? certifications : undefined,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[enrich] datagouv search error:", err);
    return NextResponse.json({ found: false } as DatagouvResult);
  }
}
