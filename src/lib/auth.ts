import { NextRequest, NextResponse } from "next/server";

export function isAuthenticated(req: NextRequest): boolean {
  const header = req.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === "bt_session") return v.join("=") === "authenticated";
  }
  return false;
}

export function unauthorized() {
  return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
}
