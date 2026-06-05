"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft, FileText, ThumbsUp, ThumbsDown, Quote, ChevronDown,
  Layers, AlignLeft, ListChecks, Sparkles, Brain, Play, CalendarClock, Check, Image as ImageIcon,
} from "lucide-react";
import Tilt from "@/components/Tilt";
import TopNav from "@/components/TopNav";
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
      <TopNav />

      <main className="mx-auto max-w-3xl px-6 pb-28 pt-8">
        <Link href="/" className="btn-plain mb-2 inline-flex items-center text-[0.9rem]"><ChevronLeft size={16} /> Übersicht</Link>
        <h1 className="t-title mb-5">{set.titel}</h1>

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
                onVote={(d) => { const c = [...set.karten]; c[i] = { ...k, [d]: k[d] + 1 }; speichern({ ...set, karten: c }); }} />
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
  const hat = q.original || q.bild;
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="t-caption inline-flex items-center gap-1"><FileText size={12} /> {q.doc}{q.seite ? ` · ${q.seite}` : ""}</span>
        {hat && (
          <button className="src-toggle inline-flex items-center gap-1" onClick={() => setOpen(!open)}>
            {q.bild ? <ImageIcon size={12} /> : <Quote size={12} />} {open ? "Original ausblenden" : "Original-Folie anzeigen"}
            <ChevronDown size={12} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
          </button>
        )}
      </div>
      {open && hat && (
        <div className="src-quote">
          {q.bild && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={q.bild} alt="Original-Folie" className="mb-2 w-full rounded-lg"
              style={{ border: "1px solid var(--line)" }} />
          )}
          {q.original && <div>{q.original}</div>}
          <span className="src-meta inline-flex items-center gap-1"><Quote size={11} /> Original · {q.doc}{q.seite ? ` · ${q.seite}` : ""}</span>
        </div>
      )}
    </div>
  );
}

function KarteCard({ k, onVote }: { k: Karte; onVote: (d: "up" | "down") => void }) {
  return (
    <div className="card card-pad">
      <div className="pop mb-2 flex items-center gap-2"><Rel r={k.relevanz} /><span className="t-caption">{k.thema}</span></div>
      <p className="t-headline pop">{k.frage}</p>
      <p className="t-body t-secondary mt-1.5">{k.antwort}</p>
      <div className="mt-3.5 border-t pt-3 hair-line" style={{ borderTopWidth: "1px" }}>
        <div className="flex items-center gap-2 text-[0.85rem]">
          <button onClick={() => onVote("up")} className="btn-plain inline-flex items-center gap-1" style={{ color: "var(--green)" }} title="hilfreich"><ThumbsUp size={14} /> {k.up}</button>
          <button onClick={() => onVote("down")} className="btn-plain inline-flex items-center gap-1" style={{ color: "var(--ink-3)" }} title="unklar"><ThumbsDown size={14} /> {k.down}</button>
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
