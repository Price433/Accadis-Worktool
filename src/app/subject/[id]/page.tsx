"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft, FileText, Upload, RefreshCw, ThumbsUp, ThumbsDown, Pencil, Trash2,
  Quote, ChevronDown, Layers, AlignLeft, ListChecks, Sparkles, Check, Brain, Play, CalendarClock,
} from "lucide-react";
import Tilt from "@/components/Tilt";
import Lernmodus from "@/components/Lernmodus";
import { STRATEGIE, lernplan } from "@/lib/lernen";
import termine from "@/data/termine.json";
import type { StudySet, Karte, ThemaBlock, QuizFrage, KlausurFrage, Quelle } from "@/lib/types";

type Tab = "karten" | "themen" | "quiz" | "klausur";

function naechsteKlausurTage(fachId: string): number | null {
  const heute = new Date(); heute.setHours(0, 0, 0, 0);
  const k = (termine as { datum: string; typ: string; fachId: string }[])
    .filter((t) => t.fachId === fachId && t.typ === "klausur")
    .map((t) => Math.round((new Date(t.datum + "T00:00:00").getTime() - heute.getTime()) / 86400000))
    .filter((d) => d >= 0).sort((a, b) => a - b);
  return k.length ? k[0] : null;
}

export default function SubjectPage() {
  const fach = decodeURIComponent(useParams().id as string);
  const [set, setSet] = useState<StudySet | null>(null);
  const [tab, setTab] = useState<Tab>("karten");
  const [busy, setBusy] = useState("");
  const [von, setVon] = useState("");
  const [lernen, setLernen] = useState(false);

  async function load() {
    const r = await fetch(`/api/studyset?fach=${encodeURIComponent(fach)}`);
    if (r.ok) setSet(await r.json());
  }
  useEffect(() => { load(); }, [fach]);

  async function speichern(next: StudySet) {
    setSet({ ...next });
    await fetch("/api/studyset", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
  }
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy("Lese PDF …");
    const fd = new FormData(); fd.append("fach", fach); fd.append("von", von || "anonym"); fd.append("datei", f);
    const r = await fetch("/api/ingest", { method: "POST", body: fd });
    const j = await r.json();
    setBusy(r.ok ? `${j.dokument.name} (${j.dokument.seiten} S.) hinzugefügt — jetzt neu generieren.` : `Fehler: ${j.error}`);
    e.target.value = ""; load();
  }
  async function generieren() {
    setBusy("KI wertet die Mitschriften aus … (~30 s)");
    const r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fach }) });
    const j = await r.json();
    setBusy(r.ok ? "Aktualisiert." : `Fehler: ${j.error}`);
    load();
  }

  if (!set) return <div className="flex min-h-screen items-center justify-center t-caption">Lädt …</div>;

  const tage = naechsteKlausurTage(set.fach);
  const plan = lernplan(tage, set.karten.length);

  const tabs: [Tab, string, number, React.ReactNode][] = [
    ["karten", "Karteikarten", set.karten.length, <Layers key="a" size={15} />],
    ["themen", "Zusammenfassung", set.themen.length, <AlignLeft key="b" size={15} />],
    ["quiz", "Quiz", set.quiz.length, <ListChecks key="c" size={15} />],
    ["klausur", "Prognose", set.klausurfragen.length, <Sparkles key="d" size={15} />],
  ];

  return (
    <>
      <header className="material-bar sticky top-0 z-20">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-3.5">
          <Link href="/" className="btn-plain inline-flex items-center text-[0.95rem]"><ChevronLeft size={18} /> Fächer</Link>
          <span className="t-headline truncate">{set.titel}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-28 pt-8">
        {/* Quellen / Upload */}
        <Tilt max={4}>
          <section className="card card-pad">
            <div className="t-eyebrow mb-2.5">Original-Mitschriften</div>
            <div className="flex flex-wrap gap-2">
              {set.dokumente.map((d) => (
                <span key={d.id} className="chip" title={`${d.woerter} Wörter · ${d.hochgeladenVon}`}>
                  <FileText size={13} color="var(--accent)" /> {d.name} <span className="t-caption">· {d.seiten} S.</span>
                </span>
              ))}
              {!set.dokumente.length && <span className="t-caption">noch keine</span>}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <input value={von} onChange={(e) => setVon(e.target.value)} placeholder="dein Name" className="field" style={{ width: "auto", flex: "0 1 9rem" }} />
              <label className="btn btn-primary btn-sm cursor-pointer"><Upload size={15} /> Mitschrift (PDF)
                <input type="file" accept="application/pdf" className="hidden" onChange={upload} />
              </label>
              <button onClick={generieren} className="btn btn-secondary btn-sm"><RefreshCw size={15} /> Neu generieren</button>
              {busy && <span className="t-caption">{busy}</span>}
            </div>
          </section>
        </Tilt>

        {/* Strategie & Plan */}
        <Tilt max={3}>
          <section className="card card-pad mt-5" style={{ background: "var(--accent-soft)", borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)" }}>
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex-1 min-w-[60%]">
                <div className="t-eyebrow mb-1.5 flex items-center gap-1.5" style={{ color: "var(--accent-ink)" }}><Brain size={13} /> Lernstrategie</div>
                <p className="t-headline" style={{ color: "var(--accent-ink)" }}>{plan.headline}</p>
                <p className="t-body t-secondary mt-1.5 text-[0.92rem]">{plan.hinweis}</p>
                <p className="t-caption mt-2 flex items-center gap-1.5">
                  <CalendarClock size={12} /> {tage === null ? "Kein fixer Klausurtermin" : `Klausur in ${tage} Tagen`}
                  &nbsp;·&nbsp; Empfehlung: ~{plan.proTag} Karten/Tag
                </p>
              </div>
              <button onClick={() => setLernen(true)} className="btn btn-primary"><Play size={16} /> Lernmodus starten</button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {STRATEGIE.prinzipien.map((p) => (
                <div key={p.name} className="rounded-xl px-3 py-2" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                  <div className="t-headline" style={{ fontSize: "0.9rem" }}>{p.name} <span className="t-caption">· {p.kurz}</span></div>
                  <div className="t-caption mt-0.5">{p.text}</div>
                </div>
              ))}
            </div>
            <p className="t-caption mt-2.5">Evidenzbasiert · {STRATEGIE.quelle}</p>
          </section>
        </Tilt>

        {/* Segmented Control */}
        <nav className="seg mt-7">
          {tabs.map(([t, label, n, icon]) => (
            <button key={t} className="seg-item inline-flex items-center justify-center gap-1.5" data-active={tab === t} onClick={() => setTab(t)}>
              {icon}<span className="hidden sm:inline">{label}</span><span style={{ opacity: 0.5 }}>{n}</span>
            </button>
          ))}
        </nav>

        <div className="mt-6 space-y-4">
          {tab === "karten" && set.karten.map((k, i) => (
            <Anim key={k.id} i={i}><Tilt max={5}>
              <KarteCard k={k}
                onVote={(d) => { const c = [...set.karten]; c[i] = { ...k, [d]: k[d] + 1 }; speichern({ ...set, karten: c }); }}
                onSave={(nf, na) => { const c = [...set.karten]; c[i] = { ...k, frage: nf, antwort: na }; speichern({ ...set, karten: c }); }}
                onDel={() => speichern({ ...set, karten: set.karten.filter((x) => x.id !== k.id) })} />
            </Tilt></Anim>
          ))}
          {tab === "themen" && set.themen.map((t, i) => <Anim key={t.id} i={i}><Tilt max={5}><ThemaCard t={t} /></Tilt></Anim>)}
          {tab === "quiz" && set.quiz.map((q, i) => <Anim key={q.id} i={i}><Tilt max={5}><QuizCard q={q} /></Tilt></Anim>)}
          {tab === "klausur" && set.klausurfragen.map((f, i) => <Anim key={f.id} i={i}><Tilt max={5}><KlausurCard f={f} /></Tilt></Anim>)}
        </div>
      </main>

      {lernen && <Lernmodus fach={set.fach} karten={set.karten} onClose={() => setLernen(false)} />}
    </>
  );
}

function Anim({ children, i }: { children: React.ReactNode; i: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(i * 0.05, 0.4), ease: [0.2, 0.7, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}

function Rel({ r }: { r: 1 | 2 | 3 }) {
  const m = { 3: ["badge-red", "klausurrelevant"], 2: ["badge-orange", "wichtig"], 1: ["badge-gray", "Hintergrund"] } as const;
  return <span className={`badge ${m[r][0]}`}>{m[r][1]}</span>;
}
function QuelleTag({ q }: { q: Quelle }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="t-caption inline-flex items-center gap-1"><FileText size={12} /> {q.doc}{q.seite ? ` · ${q.seite}` : ""}</span>
        {q.original && (
          <button className="src-toggle inline-flex items-center gap-1" onClick={() => setOpen(!open)}>
            <Quote size={12} /> {open ? "Original ausblenden" : "Original anzeigen"}
            <ChevronDown size={12} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
          </button>
        )}
      </div>
      {open && q.original && (
        <blockquote className="src-quote">
          {q.original}
          <span className="src-meta inline-flex items-center gap-1"><Quote size={11} /> Originalauszug · {q.doc}{q.seite ? ` · ${q.seite}` : ""}</span>
        </blockquote>
      )}
    </div>
  );
}

function KarteCard({ k, onVote, onSave, onDel }: { k: Karte; onVote: (d: "up" | "down") => void; onSave: (f: string, a: string) => void; onDel: () => void }) {
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState(k.frage); const [a, setA] = useState(k.antwort);
  return (
    <div className="card card-pad">
      <div className="pop mb-2 flex items-center gap-2"><Rel r={k.relevanz} /><span className="t-caption">{k.thema}</span></div>
      {edit ? (
        <div className="space-y-2">
          <textarea value={f} onChange={(e) => setF(e.target.value)} className="field" rows={2} />
          <textarea value={a} onChange={(e) => setA(e.target.value)} className="field" rows={3} />
          <button onClick={() => { onSave(f, a); setEdit(false); }} className="btn btn-primary btn-sm"><Check size={15} /> Speichern</button>
        </div>
      ) : (
        <>
          <p className="t-headline pop">{k.frage}</p>
          <p className="t-body t-secondary mt-1.5">{k.antwort}</p>
        </>
      )}
      <div className="mt-3.5 border-t pt-3 hair-line" style={{ borderTopWidth: "1px" }}>
        <div className="flex items-center gap-1 text-[0.85rem]">
          <button onClick={() => onVote("up")} className="btn-plain inline-flex items-center gap-1" style={{ color: "var(--green)" }}><ThumbsUp size={14} /> {k.up}</button>
          <button onClick={() => onVote("down")} className="btn-plain inline-flex items-center gap-1" style={{ color: "var(--ink-3)" }}><ThumbsDown size={14} /> {k.down}</button>
          <button onClick={() => setEdit(!edit)} className="btn-plain ml-auto inline-flex items-center gap-1" title="Bearbeiten"><Pencil size={13} /> Bearbeiten</button>
          <button onClick={onDel} className="btn-plain inline-flex items-center gap-1" style={{ color: "var(--ink-3)" }} title="Löschen"><Trash2 size={13} /></button>
        </div>
        <div className="mt-2.5"><QuelleTag q={k.quelle} /></div>
      </div>
    </div>
  );
}
function ThemaCard({ t }: { t: ThemaBlock }) {
  return (
    <div className="card card-pad">
      <div className="pop mb-2 flex items-center gap-2"><Rel r={t.relevanz} /><h3 className="t-headline">{t.thema}</h3></div>
      <ul className="ml-4 list-disc space-y-1 t-body t-secondary">{t.punkte.map((p, i) => <li key={i}>{p}</li>)}</ul>
      <div className="mt-3 border-t pt-3 hair-line" style={{ borderTopWidth: "1px" }}><QuelleTag q={t.quelle} /></div>
    </div>
  );
}
function QuizCard({ q }: { q: QuizFrage }) {
  const [sel, setSel] = useState<number | null>(null);
  return (
    <div className="card card-pad">
      <p className="t-headline pop">{q.frage}</p>
      <div className="mt-3 grid gap-2">
        {q.optionen.map((o, i) => {
          const show = sel !== null; const ok = i === q.loesungIndex;
          const style: React.CSSProperties = show
            ? ok ? { borderColor: "var(--green)", background: "color-mix(in srgb, var(--green) 12%, transparent)" }
                 : i === sel ? { borderColor: "var(--red)", background: "color-mix(in srgb, var(--red) 10%, transparent)" } : {}
            : {};
          return <button key={i} onClick={() => setSel(i)} style={style}
            className="flex items-center justify-between rounded-[12px] border px-3.5 py-2.5 text-left t-body hair-line transition">
            <span>{o}</span>{show && ok && <Check size={16} color="var(--green)" />}</button>;
        })}
      </div>
      {sel !== null && <p className="t-body t-secondary mt-3">{q.erklaerung}</p>}
      <div className="mt-3 border-t pt-3 hair-line" style={{ borderTopWidth: "1px" }}><QuelleTag q={q.quelle} /></div>
    </div>
  );
}
function KlausurCard({ f }: { f: KlausurFrage }) {
  return (
    <div className="card card-pad">
      <div className="pop flex items-start gap-2">
        <Sparkles size={20} color="var(--accent)" className="mt-0.5 shrink-0" />
        <p className="t-headline" style={{ fontSize: "1.1rem" }}>{f.frage}</p>
      </div>
      <p className="t-body t-secondary mt-2"><span style={{ color: "var(--ink)", fontWeight: 600 }}>Warum wahrscheinlich: </span>{f.warum}</p>
      <div className="mt-3 border-t pt-3 hair-line" style={{ borderTopWidth: "1px" }}><QuelleTag q={f.quelle} /></div>
    </div>
  );
}
