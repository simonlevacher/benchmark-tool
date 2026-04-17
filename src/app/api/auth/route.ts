import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body: { code?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 });
  }

  const { code } = body;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code manquant." }, { status: 400 });
  }

  const correctCode = process.env.AUTH_PASSWORD;

  if (!correctCode) {
    console.error("[auth] AUTH_PASSWORD not defined in environment");
    return NextResponse.json(
      { error: "Configuration serveur invalide." },
      { status: 500 }
    );
  }

  if (code !== correctCode) {
    return NextResponse.json({ error: "Code invalide." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("session", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return response;
}
