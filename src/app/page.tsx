"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Radar, ArrowUpRight, ScanLine, CalendarClock, Layers, Brain, Play, Flame, GraduationCap } from "lucide-react";
import Tilt from "@/components/Tilt";
import Timeline from "@/components/Timeline";
import TopNav from "@/components/TopNav";
import CountUp from "@/components/CountUp";
import Safe3D from "@/components/Safe3D";
import { gemeistert } from "@/lib/fortschritt";
import termine from "@/data/termine.json";

type Fach = { fach: string; titel: string; anzahl: number };

export default function Home() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [faecher, setFaecher] = useState<Fach[]>([]);
  const [prog, setProg] = useState<Record<string, number>>({});

  async function load() {
    const r = await fetch("/api/studyset");
    const j = await r.json();
    const fs: Fach[] = j.faecher || [];
    setFaecher(fs);
    const p: Record<string, number> = {};
    fs.forEach((f) => (p[f.fach] = gemeistert(f.fach)));
    setProg(p);
  }
  async function check() {
    const r = await fetch("/api/login");
    const j = await r.json();
    setAuthed(j.angemeldet);
    if (j.angemeldet) load();
  }
  useEffect(() => { check(); }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const r = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passwort: pw }) });
    if (r.ok) { setAuthed(true); load(); } else setErr("Falsches Passwort.");
  }

  if (authed === null) return <div className="flex min-h-screen items-center justify-center t-caption">…</div>;

  if (!authed)
    return (
      <div className="relative flex min-h-screen items-center justify-center px-6">
        <div className="pointer-events-none absolute inset-0 opacity-90"><Safe3D /></div>
        <Tilt max={6} className="relative w-full max-w-sm">
          <form onSubmit={login} className="card" style={{ padding: "2.2rem" }}>
            <div className="pop mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "var(--accent)" }}>
              <Radar size={24} color="#fff" />
            </div>
            <h1 className="t-title">Klausur-Radar</h1>
            <p className="t-body t-secondary mt-1.5 mb-6 text-[0.95rem]">Melde dich mit dem Gruppen-Passwort an.</p>
            <input autoFocus type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="field" placeholder="Passwort" />
            {err && <p className="mt-2 text-[0.85rem]" style={{ color: "var(--red)" }}>{err}</p>}
            <button className="btn btn-primary mt-5 w-full">Anmelden</button>
          </form>
        </Tilt>
      </div>
    );

  // KPIs & Empfehlung
  const heute = new Date(); heute.setHours(0, 0, 0, 0);
  const fachIds = new Set(faecher.map((f) => f.fach));
  const klausuren = (termine as { datum: string; typ: string; fachId: string }[])
    .filter((t) => t.typ === "klausur")
    .map((t) => ({ fachId: t.fachId, tage: Math.round((new Date(t.datum + "T00:00:00").getTime() - heute.getTime()) / 86400000) }))
    .filter((t) => t.tage >= 0).sort((a, b) => a.tage - b.tage);
  const naechsteTage = klausuren.length ? klausuren[0].tage : null;
  const empfFach = klausuren.find((k) => fachIds.has(k.fachId))?.fachId || faecher[0]?.fach;
  const empfTitel = faecher.find((f) => f.fach === empfFach)?.titel.split("—")[0].trim() || "";
  const gesamtKarten = faecher.reduce((s, f) => s + f.anzahl, 0);
  const gesamtGemeistert = Object.values(prog).reduce((s, n) => s + n, 0);

  const A = (i: number) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: i * 0.06, ease: [0.2, 0.7, 0.2, 1] as [number, number, number, number] } });

  return (
    <>
      <TopNav />

      <main className="mx-auto max-w-5xl px-5 pb-28 pt-7 sm:px-6">
        {/* ===== Bento-Command-Center ===== */}
        <section className="bento">
          {/* Hero */}
          <motion.div {...A(0)} className="tile tile-hero col-2 row-2">
            <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 opacity-90 sm:right-0 sm:h-72 sm:w-72"><Safe3D /></div>
            <div className="relative z-10 flex h-full flex-col">
              <div className="chip mb-3 w-fit" style={{ background: "rgba(255,255,255,.16)", borderColor: "rgba(255,255,255,.25)", color: "#fff" }}>
                <ScanLine size={14} /> Dein Lern-Sparringpartner
              </div>
              <h1 className="t-largetitle" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>Lernen, was<br />wirklich drankommt.</h1>
              <p className="mt-3 max-w-sm text-[1rem]" style={{ color: "rgba(255,255,255,.85)" }}>
                Klausurrelevanter Stoff aus euren Original-Mitschriften — mit der wirksamsten Lernmethode.
              </p>
              <div className="mt-auto pt-5">
                {empfFach && (
                  <Link href={`/subject/${encodeURIComponent(empfFach)}`} className="btn"
                    style={{ background: "#fff", color: "var(--accent)" }}>
                    <Play size={16} /> Jetzt lernen{empfTitel ? ` · ${empfTitel}` : ""}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>

          {/* KPI: Fächer */}
          <motion.div {...A(1)} className="tile tile-hover">
            <Layers size={18} color="var(--accent)" />
            <div className="kpi-num kpi-accent mt-3" style={{ color: "var(--accent)" }}><CountUp to={faecher.length} /></div>
            <div className="kpi-label">Fächer parat</div>
          </motion.div>

          {/* KPI: Karten */}
          <motion.div {...A(2)} className="tile tile-hover">
            <Brain size={18} color="var(--accent)" />
            <div className="kpi-num mt-3"><CountUp to={gesamtKarten} /></div>
            <div className="kpi-label">Karteikarten</div>
          </motion.div>

          {/* KPI: nächste Klausur */}
          <motion.div {...A(3)} className="tile tile-hover">
            <GraduationCap size={18} color="var(--red)" />
            <div className="kpi-num mt-3" style={{ color: "var(--red)" }}>
              {naechsteTage === null ? "–" : <CountUp to={naechsteTage} />}
            </div>
            <div className="kpi-label">Tage bis zur nächsten Klausur</div>
          </motion.div>

          {/* gemeistert / Empfehlung */}
          <motion.div {...A(4)} className="tile tile-hover">
            <Flame size={18} color="var(--amber)" />
            <div className="kpi-num mt-3"><CountUp to={gesamtGemeistert} /></div>
            <div className="kpi-label">Karten gemeistert</div>
          </motion.div>
        </section>

        {/* ===== Zeitstrahl ===== */}
        <motion.section {...A(2)} className="mt-12">
          <h2 className="t-eyebrow mb-4 flex items-center gap-2"><CalendarClock size={14} /> Anstehende Termine</h2>
          <div className="tile"><Timeline /></div>
        </motion.section>

        {/* ===== Fächer ===== */}
        <section className="mt-12">
          <h2 className="t-eyebrow mb-4 flex items-center gap-2"><Radar size={14} /> Fächer — auswählen &amp; loslernen</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {faecher.map((f, i) => {
              const p = f.anzahl ? Math.round(((prog[f.fach] || 0) / f.anzahl) * 100) : 0;
              return (
                <motion.div key={f.fach} {...A(i)}>
                  <Tilt max={8}>
                    <Link href={`/subject/${encodeURIComponent(f.fach)}`} className="tile tile-hover block">
                      <div className="pop flex items-start justify-between gap-2">
                        <div>
                          <div className="t-caption">{f.fach.toUpperCase()}</div>
                          <div className="t-headline mt-0.5">{f.titel.split("—")[0].trim()}</div>
                        </div>
                        <div className="ring" style={{ ["--p" as string]: p }}><span>{p}%</span></div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="t-caption">{f.anzahl} Karten</span>
                        <span className="inline-flex items-center gap-1 text-[0.82rem]" style={{ color: "var(--accent)", fontWeight: 600 }}>
                          Lernen <ArrowUpRight size={15} />
                        </span>
                      </div>
                    </Link>
                  </Tilt>
                </motion.div>
              );
            })}
            {!faecher.length && <p className="t-secondary">Noch keine Fächer.</p>}
          </div>
        </section>
      </main>
    </>
  );
}
