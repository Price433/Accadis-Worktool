import { NextResponse } from "next/server";

// Sagt dem Frontend, ob KI-Generierung verfügbar ist (API-Key gesetzt).
export async function GET() {
  return NextResponse.json({ ki: !!process.env.ANTHROPIC_API_KEY });
}
