"use client";
import termine from "@/data/termine.json";
import { GraduationCap, FileText, Presentation, Info } from "lucide-react";

type Termin = { datum: string; titel: string; typ: string; fach: string; fachId: string };

const TYP: Record<string, { label: string; color: string; Icon: typeof Info }> = {
  klausur:       { label: "Klausur",       color: "#b42318", Icon: GraduationCap },
  abgabe:        { label: "Abgabe",        color: "#9a6400", Icon: FileText },
  praesentation: { label: "Präsentation",  color: "#004c93", Icon: Presentation },
  info:          { label: "Termin",        color: "#5b6473", Icon: Info },
};

function fmt(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}

export default function Timeline() {
  const heute = new Date(); heute.setHours(0, 0, 0, 0);
  const items = (termine as Termin[])
    .map((t) => ({ ...t, tage: Math.round((new Date(t.datum + "T00:00:00").getTime() - heute.getTime()) / 86400000) }))
    .filter((t) => t.tage >= 0)
    .sort((a, b) => a.tage - b.tage);

  return (
    <ol className="relative ml-3 border-l hair-line" style={{ borderLeftWidth: "2px" }}>
      {items.map((t) => {
        const meta = TYP[t.typ] ?? TYP.info;
        const soon = t.tage <= 7;
        return (
          <li key={t.datum + t.titel} className="relative pl-6 pb-5 last:pb-0">
            <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full ring-4"
              style={{ background: meta.color, boxShadow: "0 0 0 4px var(--bg)" }} />
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="t-headline" style={{ fontSize: "0.95rem" }}>{fmt(t.datum)}</span>
              <span className="badge" style={{ color: meta.color, borderColor: meta.color + "55", background: meta.color + "14" }}>
                <meta.Icon size={11} /> {meta.label}
              </span>
              <span className="t-caption">{t.fach}</span>
              <span className="t-caption ml-auto" style={{ color: soon ? meta.color : "var(--ink-3)", fontWeight: soon ? 700 : 400 }}>
                {t.tage === 0 ? "heute" : `in ${t.tage} Tagen`}
              </span>
            </div>
            <div className="t-body t-secondary mt-0.5 text-[0.95rem]">{t.titel}</div>
          </li>
        );
      })}
      {!items.length && <li className="t-secondary pl-6">Keine anstehenden Termine.</li>}
    </ol>
  );
}
