"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Tilt from "@/components/Tilt";

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
      <div className="flex min-h-screen items-center justify-center px-6">
        <Tilt max={6} className="w-full max-w-sm">
          <form onSubmit={login} className="card" style={{ padding: "2rem" }}>
            <div className="mb-1 text-4xl pop">📡</div>
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
      <header className="material-bar sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-6 py-3.5">
          <span className="text-lg">📡</span>
          <span className="t-headline">Klausur-Radar</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-24 pt-12">
        <h1 className="t-largetitle">Lernen, was<br />wirklich drankommt.</h1>
        <p className="t-body t-secondary mt-4 max-w-xl text-[1.12rem]">
          Klausurrelevanter Stoff aus euren Original-Mitschriften — gewichtet nach den Hinweisen der Dozent:innen.
        </p>

        <h2 className="t-eyebrow mt-14 mb-4">Fächer</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {faecher.map((f) => (
            <Tilt key={f.fach} max={8}>
              <Link href={`/subject/${encodeURIComponent(f.fach)}`} className="card card-pad card-hover block">
                <div className="t-headline pop">{f.titel}</div>
                <div className="t-caption mt-1.5 flex items-center justify-between">
                  <span>{f.fach.toUpperCase()}</span>
                  <span style={{ color: "var(--blue)", fontWeight: 600 }}>Öffnen →</span>
                </div>
              </Link>
            </Tilt>
          ))}
          {!faecher.length && <p className="t-secondary">Noch keine Fächer.</p>}
        </div>
      </main>
    </>
  );
}
