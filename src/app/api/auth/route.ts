import { NextRequest, NextResponse } from "next/server";

const SESSION_TOKEN = "bt_session";
const SESSION_VALUE = "authenticated";
// Cookie valable 8h
const MAX_AGE = 60 * 60 * 8;

export async function POST(req: NextRequest) {
  let body: { password?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalide." }, { status: 400 });
  }

  const { password } = body;
  const expected = process.env.AUTH_PASSWORD;

  if (!expected) {
    console.error("[auth] AUTH_PASSWORD non défini dans les variables d'environnement.");
    return NextResponse.json({ error: "Erreur de configuration serveur." }, { status: 500 });
  }

  if (!password || password !== expected) {
    // Délai fixe pour contrer le timing attack
    await new Promise((r) => setTimeout(r, 200));
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_TOKEN, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: MAX_AGE,
    path: "/",
  });

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_TOKEN);
  return res;
}
