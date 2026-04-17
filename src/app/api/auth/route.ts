import { NextRequest, NextResponse } from "next/server";

// In-memory store for rate limiting: IP -> { count, resetTime }
const attemptStore = new Map<string, { count: number; resetTime: number }>();

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const attempt = attemptStore.get(ip);

  if (!attempt) {
    attemptStore.set(ip, { count: 1, resetTime: now + LOCK_DURATION_MS });
    return { allowed: true };
  }

  if (now > attempt.resetTime) {
    attemptStore.set(ip, { count: 1, resetTime: now + LOCK_DURATION_MS });
    return { allowed: true };
  }

  if (attempt.count >= MAX_ATTEMPTS) {
    const minutesLeft = Math.ceil((attempt.resetTime - now) / 60000);
    return {
      allowed: false,
      message: `Trop de tentatives. Réessayez dans ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`,
    };
  }

  return { allowed: true };
}

function recordFailedAttempt(ip: string) {
  const attempt = attemptStore.get(ip);
  if (attempt) {
    attempt.count++;
  }
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimitCheck = checkRateLimit(clientIp);

  if (!rateLimitCheck.allowed) {
    return NextResponse.json(
      { error: rateLimitCheck.message },
      { status: 429 }
    );
  }

  let body: { code?: string };

  try {
    body = await req.json();
  } catch {
    recordFailedAttempt(clientIp);
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 });
  }

  const { code } = body;

  if (!code || typeof code !== "string") {
    recordFailedAttempt(clientIp);
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
    recordFailedAttempt(clientIp);
    return NextResponse.json(
      { error: "Code invalide. Vérifiez et réessayez." },
      { status: 401 }
    );
  }

  // Success: clear attempts for this IP
  attemptStore.delete(clientIp);

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
