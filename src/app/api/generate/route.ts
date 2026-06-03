import { NextResponse } from "next/server";
import { istAngemeldet } from "@/lib/auth";
import { loadSet, saveSet } from "@/lib/storage";
import { generate } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

// Aus allen Dokumenten des Fachs das Lernmaterial (neu) erzeugen.
export async function POST(req: Request) {
  if (!(await istAngemeldet())) return NextResponse.json({ error: "nicht angemeldet" }, { status: 401 });

  const { fach } = await req.json();
  const set = await loadSet(String(fach || ""));
  if (!set) return NextResponse.json({ error: "Fach nicht gefunden" }, { status: 404 });
  if (!set.dokumente.length) return NextResponse.json({ error: "Noch keine Mitschriften hochgeladen" }, { status: 400 });

  try {
    const erg = await generate(set.fach, set.titel, set.dokumente);
    set.karten = erg.karten ?? [];
    set.themen = erg.themen ?? [];
    set.quiz = erg.quiz ?? [];
    set.klausurfragen = erg.klausurfragen ?? [];
    await saveSet(set);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
