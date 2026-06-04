"use client";
import { useMemo, useState } from "react";
import { X, RotateCcw, Check, Eye, Quote, PartyPopper } from "lucide-react";
import type { Karte } from "@/lib/types";

// Leitner-Intervalle in Tagen je Box (1..5). Spaced Repetition.
const INTERVALL = [1, 2, 4, 8, 16];
type Fortschritt = Record<string, { box: number; due: number }>;

function laden(fach: string): Fortschritt {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(`kr_lern_${fach}`) || "{}"); } catch { return {}; }
}
function speichern(fach: string, f: Fortschritt) {
  try { localStorage.setItem(`kr_lern_${fach}`, JSON.stringify(f)); } catch {}
}
function shuffle<T>(a: T[]): T[] { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; }

export default function Lernmodus({ fach, karten, onClose }: { fach: string; karten: Karte[]; onClose: () => void }) {
  const [fortschritt, setFortschritt] = useState<Fortschritt>(() => laden(fach));
  // Fällige + neue Karten, thematisch gemischt (Interleaving). Klausurrelevante zuerst.
  const startQueue = useMemo(() => {
    const now = Date.now();
    const faellig = karten.filter((k) => { const r = fortschritt[k.id]; return !r || r.due <= now; });
    const pool = faellig.length ? faellig : karten;
    return shuffle(pool).sort((a, b) => b.relevanz - a.relevanz).slice(0, 24);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [queue, setQueue] = useState<Karte[]>(startQueue);
  const [idx, setIdx] = useState(0);
  const [zeige, setZeige] = useState(false);
  const [zeigeQuelle, setZeigeQuelle] = useState(false);
  const [gewusst, setGewusst] = useState(0);
  const total = startQueue.length;

  if (!total)
    return <Overlay onClose={onClose}><Fertig text="Keine Karten zum Lernen." gewusst={0} total={0} onClose={onClose} /></Overlay>;

  const fertig = idx >= queue.length;
  const k = queue[idx];

  function bewerten(ok: boolean) {
    const r = fortschritt[k.id] ?? { box: 1, due: 0 };
    const box = ok ? Math.min(5, r.box + 1) : 1;
    const due = ok ? Date.now() + INTERVALL[box - 1] * 86400000 : Date.now();
    const nf = { ...fortschritt, [k.id]: { box, due } };
    setFortschritt(nf); speichern(fach, nf);
    if (ok) setGewusst((g) => g + 1);
    else setQueue((q) => [...q, k]); // „Nochmal“ → ans Ende der Session
    setZeige(false); setZeigeQuelle(false); setIdx((i) => i + 1);
  }

  if (fertig)
    return <Overlay onClose={onClose}><Fertig text="Session geschafft!" gewusst={gewusst} total={total} onClose={onClose} /></Overlay>;

  const fortschrittPct = Math.round((idx / queue.length) * 100);

  return (
    <Overlay onClose={onClose}>
      <div className="mb-5 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${fortschrittPct}%`, background: "var(--accent)" }} />
        </div>
        <span className="t-caption whitespace-nowrap">{idx} / {queue.length}</span>
      </div>

      <div className="card card-pad" style={{ minHeight: 280 }}>
        <div className="mb-3 flex items-center gap-2">
          <Rel r={k.relevanz} /><span className="t-caption">{k.thema}</span>
        </div>
        <p className="t-title" style={{ fontSize: "1.35rem" }}>{k.frage}</p>

        {!zeige ? (
          <button onClick={() => setZeige(true)} className="btn btn-primary mt-6"><Eye size={16} /> Antwort zeigen</button>
        ) : (
          <>
            <p className="t-body mt-4">{k.antwort}</p>
            {k.quelle.original && (
              <div className="mt-3">
                <button className="src-toggle inline-flex items-center gap-1" onClick={() => setZeigeQuelle((s) => !s)}>
                  <Quote size={12} /> {zeigeQuelle ? "Original ausblenden" : "Original anzeigen"}
                </button>
                {zeigeQuelle && (
                  <blockquote className="src-quote">{k.quelle.original}
                    <span className="src-meta">{k.quelle.doc}{k.quelle.seite ? ` · ${k.quelle.seite}` : ""}</span>
                  </blockquote>
                )}
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <button onClick={() => bewerten(false)} className="btn btn-secondary flex-1" style={{ color: "var(--red)", borderColor: "var(--red)" }}>
                <RotateCcw size={16} /> Nochmal
              </button>
              <button onClick={() => bewerten(true)} className="btn btn-primary flex-1"><Check size={16} /> Gewusst</button>
            </div>
          </>
        )}
      </div>
      <p className="t-caption mt-4 text-center">Erst selbst abrufen, dann aufdecken — und ehrlich bewerten. Schwache Karten kommen häufiger.</p>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto p-4 sm:p-8"
      style={{ background: "color-mix(in srgb, var(--ink) 45%, transparent)", backdropFilter: "blur(6px)" }}>
      <div className="relative w-full max-w-lg">
        <button onClick={onClose} className="absolute -top-1 right-0 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: "var(--surface)", border: "1px solid var(--line)" }} aria-label="Schließen"><X size={18} /></button>
        <div className="pt-10">{children}</div>
      </div>
    </div>
  );
}
function Fertig({ text, gewusst, total, onClose }: { text: string; gewusst: number; total: number; onClose: () => void }) {
  return (
    <div className="card card-pad text-center">
      <PartyPopper size={36} color="var(--accent)" className="mx-auto" />
      <h3 className="t-title mt-3">{text}</h3>
      {total > 0 && <p className="t-body t-secondary mt-2">{gewusst} von {total} auf Anhieb gewusst. Die anderen kommen bald zur Wiederholung wieder.</p>}
      <button onClick={onClose} className="btn btn-primary mt-5">Fertig</button>
    </div>
  );
}
function Rel({ r }: { r: 1 | 2 | 3 }) {
  const m = { 3: ["badge-red", "klausurrelevant"], 2: ["badge-orange", "wichtig"], 1: ["badge-gray", "Hintergrund"] } as const;
  return <span className={`badge ${m[r][0]}`}>{m[r][1]}</span>;
}
