import { NextResponse } from "next/server";
import { istAngemeldet } from "@/lib/auth";
import { loadSet, saveSet, listFaecher } from "@/lib/storage";
import type { StudySet } from "@/lib/types";

export const runtime = "nodejs";

// GET ?fach=EAL 101  → StudySet   |   GET (ohne fach) → Liste
export async function GET(req: Request) {
  if (!(await istAngemeldet())) return NextResponse.json({ error: "nicht angemeldet" }, { status: 401 });
  const fach = new URL(req.url).searchParams.get("fach");
  if (!fach) return NextResponse.json({ faecher: await listFaecher() });
  const set = await loadSet(fach);
  if (!set) return NextResponse.json({ error: "nicht gefunden" }, { status: 404 });
  return NextResponse.json(set);
}

// PUT → komplettes (bearbeitetes) StudySet speichern
export async function PUT(req: Request) {
  if (!(await istAngemeldet())) return NextResponse.json({ error: "nicht angemeldet" }, { status: 401 });
  const set = (await req.json()) as StudySet;
  if (!set?.fach) return NextResponse.json({ error: "ungültig" }, { status: 400 });
  await saveSet(set);
  return NextResponse.json({ ok: true });
}
