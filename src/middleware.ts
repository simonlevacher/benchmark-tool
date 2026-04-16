import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/api/analyze", "/api/scrape"];

function getCookieValue(req: NextRequest, name: string): string | undefined {
  // Lecture directe du header pour fiabilité sur Vercel Edge
  const header = req.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

export function middleware(req: NextRequest) {
  const isProtected = PROTECTED.some((path) => req.nextUrl.pathname.startsWith(path));
  if (!isProtected) return NextResponse.next();

  const session = getCookieValue(req, "bt_session");
  if (session !== "authenticated") {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/analyze/:path*", "/api/scrape/:path*"],
};
