"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Tilt from "@/components/Tilt";
import type { StudySet, Karte, ThemaBlock, QuizFrage, KlausurFrage, Quelle } from "@/lib/types";

type Tab = "karten" | "themen" | "quiz" | "klausur";

export default function SubjectPage() {
  const fach = decodeURIComponent(useParams().id as string);
  const [set, setSet] = useState<StudySet | null>(null);
  const [tab, setTab] = useState<Tab>("karten");
  const [busy, setBusy] = useState("");
  const [von, setVon] = useState("");

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
    setBusy(r.ok ? `✓ ${j.dokument.name} (${j.dokument.seiten} S.) hinzugefügt — jetzt neu generieren.` : `Fehler: ${j.error}`);
    e.target.value = ""; load();
  }
  async function generieren() {
    setBusy("KI wertet die Mitschriften aus … (~30 s)");
    const r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fach }) });
    const j = await r.json();
    setBusy(r.ok ? "✓ Aktualisiert." : `Fehler: ${j.error}`);
    load();
  }

  if (!set) return <div className="flex min-h-screen items-center justify-center t-caption">Lädt …</div>;

  const tabs: [Tab, string, number][] = [
    ["karten", "Karteikarten", set.karten.length],
    ["themen", "Zusammenfassung", set.themen.length],
    ["quiz", "Quiz", set.quiz.length],
    ["klausur", "Prognose", set.klausurfragen.length],
  ];

  return (
    <>
      <header className="material-bar sticky top-0 z-10">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-3.5">
          <Link href="/" className="btn-plain text-[0.95rem]">‹ Fächer</Link>
          <span className="t-headline truncate">{set.titel}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-8">
        {/* Quellen / Upload */}
        <section className="card card-pad">
          <div className="t-eyebrow mb-2.5">Original-Mitschriften</div>
          <div className="flex flex-wrap gap-2">
            {set.dokumente.map((d) => (
              <span key={d.id} className="chip" title={`${d.woerter} Wörter · ${d.hochgeladenVon}`}>
                <span>📄</span> {d.name} <span className="t-caption">· {d.seiten} S.</span>
              </span>
            ))}
            {!set.dokumente.length && <span className="t-caption">noch keine</span>}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <input value={von} onChange={(e) => setVon(e.target.value)} placeholder="dein Name" className="field" style={{ width: "auto", flex: "0 1 9rem" }} />
            <label className="btn btn-primary btn-sm cursor-pointer">
              + Mitschrift (PDF)
              <input type="file" accept="application/pdf" className="hidden" onChange={upload} />
            </label>
            <button onClick={generieren} className="btn btn-secondary btn-sm">⟳ Neu generieren</button>
            {busy && <span className="t-caption">{busy}</span>}
          </div>
        </section>

        {/* Segmented Control */}
        <nav className="seg mt-7">
          {tabs.map(([t, label, n]) => (
            <button key={t} className="seg-item" data-active={tab === t} onClick={() => setTab(t)}>
              {label} <span style={{ opacity: 0.5 }}>{n}</span>
            </button>
          ))}
        </nav>

        <div className="mt-6 space-y-4">
          {tab === "karten" && set.karten.map((k, i) => (
            <Tilt key={k.id} max={5}>
              <KarteCard k={k}
                onVote={(d) => { const c = [...set.karten]; c[i] = { ...k, [d]: k[d] + 1 }; speichern({ ...set, karten: c }); }}
                onSave={(nf, na) => { const c = [...set.karten]; c[i] = { ...k, frage: nf, antwort: na }; speichern({ ...set, karten: c }); }}
                onDel={() => speichern({ ...set, karten: set.karten.filter((x) => x.id !== k.id) })} />
            </Tilt>
          ))}
          {tab === "themen" && set.themen.map((t) => <Tilt key={t.id} max={5}><ThemaCard t={t} /></Tilt>)}
          {tab === "quiz" && set.quiz.map((q) => <Tilt key={q.id} max={5}><QuizCard q={q} /></Tilt>)}
          {tab === "klausur" && set.klausurfragen.map((f) => <Tilt key={f.id} max={5}><KlausurCard f={f} /></Tilt>)}
        </div>
      </main>
    </>
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
      <div className="flex flex-wrap items-center gap-2">
        <span className="t-caption">📄 {q.doc}{q.seite ? ` · ${q.seite}` : ""}</span>
        {q.original && (
          <button className="src-toggle" onClick={() => setOpen(!open)}>
            {open ? "▾ Original ausblenden" : "▸ Original anzeigen"}
          </button>
        )}
      </div>
      {open && q.original && (
        <blockquote className="src-quote">
          {q.original}
          <span className="src-meta">— Originalauszug · {q.doc}{q.seite ? ` · ${q.seite}` : ""}</span>
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
      <div className="mb-2 flex items-center gap-2"><Rel r={k.relevanz} /><span className="t-caption">{k.thema}</span></div>
      {edit ? (
        <div className="space-y-2">
          <textarea value={f} onChange={(e) => setF(e.target.value)} className="field" rows={2} />
          <textarea value={a} onChange={(e) => setA(e.target.value)} className="field" rows={3} />
          <button onClick={() => { onSave(f, a); setEdit(false); }} className="btn btn-primary btn-sm">Speichern</button>
        </div>
      ) : (
        <>
          <p className="t-headline">{k.frage}</p>
          <p className="t-body t-secondary mt-1.5">{k.antwort}</p>
        </>
      )}
      <div className="mt-3.5 border-t pt-3 hair-line" style={{ borderTopWidth: "0.5px" }}>
        <div className="flex items-center gap-1 text-[0.85rem]">
          <button onClick={() => onVote("up")} className="btn-plain" style={{ color: "var(--green)" }}>👍 {k.up}</button>
          <button onClick={() => onVote("down")} className="btn-plain" style={{ color: "var(--ink-3)" }}>👎 {k.down}</button>
          <button onClick={() => setEdit(!edit)} className="btn-plain ml-auto" title="Bearbeiten">Bearbeiten</button>
          <button onClick={onDel} className="btn-plain" style={{ color: "var(--ink-3)" }} title="Löschen">Löschen</button>
        </div>
        <div className="mt-2"><QuelleTag q={k.quelle} /></div>
      </div>
    </div>
  );
}
function ThemaCard({ t }: { t: ThemaBlock }) {
  return (
    <div className="card card-pad">
      <div className="mb-2 flex items-center gap-2"><Rel r={t.relevanz} /><h3 className="t-headline">{t.thema}</h3></div>
      <ul className="ml-4 list-disc space-y-1 t-body t-secondary">{t.punkte.map((p, i) => <li key={i}>{p}</li>)}</ul>
      <div className="mt-3 border-t pt-3 hair-line" style={{ borderTopWidth: "0.5px" }}><QuelleTag q={t.quelle} /></div>
    </div>
  );
}
function QuizCard({ q }: { q: QuizFrage }) {
  const [sel, setSel] = useState<number | null>(null);
  return (
    <div className="card card-pad">
      <p className="t-headline">{q.frage}</p>
      <div className="mt-3 grid gap-2">
        {q.optionen.map((o, i) => {
          const show = sel !== null; const ok = i === q.loesungIndex;
          const style: React.CSSProperties = show
            ? ok ? { borderColor: "var(--green)", background: "color-mix(in srgb, var(--green) 12%, transparent)" }
                 : i === sel ? { borderColor: "var(--red)", background: "color-mix(in srgb, var(--red) 10%, transparent)" } : {}
            : {};
          return <button key={i} onClick={() => setSel(i)} style={style}
            className="rounded-[12px] border px-3.5 py-2.5 text-left t-body hair-line transition"
            >{o}{show && ok ? "  ✓" : ""}</button>;
        })}
      </div>
      {sel !== null && <p className="t-body t-secondary mt-3">{q.erklaerung}</p>}
      <div className="mt-3 border-t pt-3 hair-line" style={{ borderTopWidth: "0.5px" }}><QuelleTag q={q.quelle} /></div>
    </div>
  );
}
function KlausurCard({ f }: { f: KlausurFrage }) {
  return (
    <div className="card card-pad">
      <div className="flex items-start gap-2">
        <span className="text-lg leading-none">🔮</span>
        <p className="t-headline" style={{ fontSize: "1.1rem" }}>{f.frage}</p>
      </div>
      <p className="t-body t-secondary mt-2"><span style={{ color: "var(--ink)", fontWeight: 600 }}>Warum wahrscheinlich: </span>{f.warum}</p>
      <div className="mt-3 border-t pt-3 hair-line" style={{ borderTopWidth: "0.5px" }}><QuelleTag q={f.quelle} /></div>
    </div>
  );
}
