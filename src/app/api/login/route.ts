import { NextResponse } from "next/server";
import { anmelden, istAngemeldet } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ angemeldet: await istAngemeldet() });
}

export async function POST(req: Request) {
  const { passwort } = await req.json();
  const ok = await anmelden(String(passwort || ""));
  return NextResponse.json({ ok }, { status: ok ? 200 : 401 });
}
