"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Radar, ArrowUpRight, BookOpen, ScanLine, CalendarClock } from "lucide-react";
import Tilt from "@/components/Tilt";
import Timeline from "@/components/Timeline";

const Hero3D = dynamic(() => import("@/components/Hero3D"), { ssr: false });

export default function Home() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [faecher, setFaecher] = useState<{ fach: string; titel: string }[]>([]);

  async function load() {
    const r = await fetch("/api/studyset");
    const j = await r.json();
    setFaecher(j.faecher || []);
  }
  async function check() {
    const r = await fetch("/api/login");
    const j = await r.json();
    setAuthed(j.angemeldet);
    if (j.angemeldet) load();
  }
  useEffect(() => { check(); }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passwort: pw }) });
    if (r.ok) { setAuthed(true); load(); } else setErr("Falsches Passwort.");
  }

  if (authed === null)
    return <div className="flex min-h-screen items-center justify-center t-caption">…</div>;

  if (!authed)
    return (
      <div className="relative flex min-h-screen items-center justify-center px-6">
        <div className="pointer-events-none absolute inset-0 opacity-90"><Hero3D /></div>
        <Tilt max={6} className="relative w-full max-w-sm">
          <form onSubmit={login} className="card" style={{ padding: "2.2rem" }}>
            <div className="pop mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: "var(--accent)" }}>
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

  return (
    <>
      <header className="material-bar sticky top-0 z-20">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-6 py-3.5">
          <Radar size={18} color="var(--accent)" />
          <span className="t-headline">Klausur-Radar</span>
        </div>
      </header>

      {/* 3D-Hero */}
      <section className="relative mx-auto max-w-5xl px-6">
        <div className="grid items-center gap-4 pt-10 sm:grid-cols-2 sm:pt-16">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}>
            <div className="chip mb-4"><ScanLine size={14} color="var(--accent)" /> KI-gestützte Klausurvorbereitung</div>
            <h1 className="t-largetitle">Lernen,<br />was wirklich<br /><span className="accent">drankommt.</span></h1>
            <p className="t-body t-secondary mt-5 max-w-md text-[1.1rem]">
              Klausurrelevanter Stoff aus euren Original-Mitschriften — gewichtet nach den Hinweisen der Dozent:innen.
            </p>
          </motion.div>
          <div className="relative h-[300px] sm:h-[420px]">
            <Hero3D />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-6 pb-28 pt-10">
        {/* Zeitstrahl */}
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-12">
          <h2 className="t-eyebrow mb-4 flex items-center gap-2"><CalendarClock size={14} /> Anstehende Termine</h2>
          <div className="card card-pad"><Timeline /></div>
        </motion.section>

        <h2 className="t-eyebrow mb-4 flex items-center gap-2"><BookOpen size={14} /> Fächer — auswählen &amp; loslernen</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {faecher.map((f, i) => (
            <motion.div key={f.fach} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.06, ease: [0.2, 0.7, 0.2, 1] }}>
              <Tilt max={9}>
                <Link href={`/subject/${encodeURIComponent(f.fach)}`} className="card card-pad card-hover block">
                  <div className="pop flex items-start justify-between">
                    <div className="t-headline pr-2">{f.titel}</div>
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}>
                      <ArrowUpRight size={16} color="var(--accent)" />
                    </span>
                  </div>
                  <div className="t-caption mt-2">{f.fach.toUpperCase()}</div>
                </Link>
              </Tilt>
            </motion.div>
          ))}
          {!faecher.length && <p className="t-secondary">Noch keine Fächer.</p>}
        </div>
      </main>
    </>
  );
}
