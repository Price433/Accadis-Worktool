import { NextResponse } from "next/server";
import { istAngemeldet } from "@/lib/auth";
import { loadSet, saveSet } from "@/lib/storage";
import type { Dokument, StudySet } from "@/lib/types";

export const runtime = "nodejs";

// PDF → Text mit [S.x]-Markern, an das StudySet anhängen.
export async function POST(req: Request) {
  if (!(await istAngemeldet())) return NextResponse.json({ error: "nicht angemeldet" }, { status: 401 });

  const form = await req.formData();
  const fach = String(form.get("fach") || "");
  const von = String(form.get("von") || "anonym");
  const datei = form.get("datei") as File | null;
  if (!fach || !datei) return NextResponse.json({ error: "fach/datei fehlt" }, { status: 400 });

  const buf = Buffer.from(await datei.arrayBuffer());
  let text = "";
  let seiten = 0;
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buf });
    const res = (await parser.getText()) as { text: string; total?: number; pages?: { text: string; num: number }[] };
    await parser.destroy?.();
    if (res.pages?.length) {
      // pro Seite einen [S.x]-Marker → Quellen bekommen echte Seitenzahlen
      text = res.pages.map((p) => `\n[S.${p.num}]\n${p.text}`).join("\n");
      seiten = res.pages.length;
    } else {
      text = res.text || "";
      seiten = res.total ?? 0;
    }
  } catch (e) {
    return NextResponse.json({ error: "PDF konnte nicht gelesen werden: " + (e as Error).message }, { status: 422 });
  }

  const set: StudySet =
    (await loadSet(fach)) ?? {
      fach,
      titel: fach,
      stand: new Date().toISOString(),
      dokumente: [],
      karten: [],
      themen: [],
      quiz: [],
      klausurfragen: [],
    };

  const doc: Dokument = {
    id: "d_" + Date.now().toString(36),
    name: datei.name,
    woerter: text.split(/\s+/).filter(Boolean).length,
    seiten,
    hochgeladenVon: von,
    text,
  };
  set.dokumente.push(doc);
  await saveSet(set);

  return NextResponse.json({ ok: true, dokument: { id: doc.id, name: doc.name, woerter: doc.woerter, seiten: doc.seiten, hochgeladenVon: doc.hochgeladenVon } });
}
