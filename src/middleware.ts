import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/api/analyze", "/api/scrape"];

export function middleware(req: NextRequest) {
  const isProtected = PROTECTED.some((path) => req.nextUrl.pathname.startsWith(path));
  if (!isProtected) return NextResponse.next();

  const session = req.cookies.get("bt_session");
  if (session?.value !== "authenticated") {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/analyze/:path*", "/api/scrape/:path*"],
};
