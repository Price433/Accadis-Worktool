import Anthropic from "@anthropic-ai/sdk";
import type { StudySet, Dokument } from "./types";

const MODEL = "claude-sonnet-4-6";

function client() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY fehlt — in .env.local / Vercel setzen.");
  return new Anthropic({ apiKey: key });
}

const SYSTEM = `Du bist ein Lern-Assistent für Hochschul-Klausuren. Du erzeugst Lernmaterial AUSSCHLIESSLICH aus den bereitgestellten Original-Mitschriften und -Dokumenten der Studierenden.

HARTE REGELN:
- Erfinde NICHTS. Jede Aussage muss aus den Quellen stammen.
- Jede Karte/jeder Punkt/jede Frage MUSS eine "quelle" haben: { "doc": <Dokumentname>, "seite": <z.B. "S. 12" aus dem [S.x]-Marker oder Abschnitt/Übung>, "original": <WÖRTLICHER Ausschnitt> }.
- "original" ist PFLICHT und SEHR WICHTIG: Kopiere den **verbatim Originaltext-Ausschnitt** (1–3 Sätze, exakt aus der Quelle, NICHT umformuliert), aus dem du die Karte abgeleitet hast — damit man beim Lernen den Originalbeleg sieht. Inkl. relevantem Detail wie Paragraf/Beispiel.
- GEWICHTE Klausurrelevanz nach DOZENTEN-SIGNALEN: Markierungen wie "klausurrelevant", "das kommt dran", genannte Themenlisten, Wiederholungen, Übungsaufgaben/Beispiele die man auswendig können muss → relevanz=3. Wichtig aber nicht explizit → 2. Hintergrund → 1.
- Übungen/Beispiele aus den Mitschriften (z.B. "Beispiel auf S. X") sind besonders wertvoll: als Karten mit konkretem Seitenverweis + Original-Ausschnitt aufnehmen.
- Sprache: Deutsch (außer Fachbegriffe).

Antworte NUR mit gültigem JSON nach diesem Schema (keine Markdown-Codefence):
{
 "karten":[{"frage":"","antwort":"","thema":"","relevanz":3,"quelle":{"doc":"","seite":"","original":""}}],
 "themen":[{"thema":"","punkte":["",""],"relevanz":3,"quelle":{"doc":"","seite":"","original":""}}],
 "quiz":[{"frage":"","optionen":["","","",""],"loesungIndex":0,"erklaerung":"","quelle":{"doc":"","seite":"","original":""}}],
 "klausurfragen":[{"frage":"","warum":"","quelle":{"doc":"","seite":"","original":""}}]
}`;

let counter = 0;
const uid = (p: string) => `${p}_${Date.now().toString(36)}_${(counter++).toString(36)}`;

export async function generate(fach: string, titel: string, docs: Dokument[]): Promise<Partial<StudySet>> {
  const quellen = docs
    .map((d) => `### DOKUMENT: ${d.name}\n${d.text}`)
    .join("\n\n---\n\n");

  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: [
      { type: "text", text: SYSTEM },
      // großer, stabiler Quellenblock → Prompt-Caching spart Kosten bei Re-Generierung
      { type: "text", text: `QUELLEN FÜR ${fach} (${titel}):\n\n${quellen}`, cache_control: { type: "ephemeral" } },
    ],
    messages: [
      {
        role: "user",
        content:
          "Erzeuge das Lernmaterial. Ziel: ~20 Karten (priorisiere relevanz=3 und Übungen/Beispiele mit Seitenverweis), 6–10 Themen-Blöcke, 8 Quizfragen, 6 wahrscheinliche Klausurfragen. NUR JSON.",
      },
    ],
  });

  const raw = msg.content.find((c) => c.type === "text");
  const text = raw && "text" in raw ? raw.text : "{}";
  const json = JSON.parse(text.replace(/^```json?\s*/i, "").replace(/```$/, "").trim());

  return {
    karten: (json.karten || []).map((k: Record<string, unknown>) => ({ id: uid("k"), up: 0, down: 0, ...k })),
    themen: (json.themen || []).map((t: Record<string, unknown>) => ({ id: uid("t"), ...t })),
    quiz: (json.quiz || []).map((q: Record<string, unknown>) => ({ id: uid("q"), ...q })),
    klausurfragen: (json.klausurfragen || []).map((f: Record<string, unknown>) => ({ id: uid("f"), ...f })),
  };
}
