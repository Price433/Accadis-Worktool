# 📡 Klausur-Radar

Web-App, die aus **Original-Mitschriften** der Studierenden den **klausurrelevanten** Stoff
herausfiltert — gewichtet nach **Dozenten-Signalen** — und als Karteikarten, Zusammenfassung,
Quiz und wahrscheinliche Klausurfragen ausgibt. Kollaborativ, mit Quellen- & Seitenverweis.

## Features (V1)
- 🔑 Login mit Gruppen-Passwort (`APP_PASSWORD`)
- 📄 PDF-Mitschriften hochladen → Text + **Seitenmarker [S.x]**
- 🤖 KI-Generierung (Claude) → Material **nur aus den Quellen**, jede Karte mit `Quelle{doc, seite}`
- 🃏 Karteikarten · 📄 Zusammenfassung · ❓ Quiz · 🔮 Wahrscheinliche Fragen
- ✎ Manuell bearbeiten · 👍/👎 voten · 🗑 löschen
- 🔴/🟡/⚪ Relevanz (3 = vom Dozenten als klausurrelevant signalisiert)

## Lokal starten
```bash
nvm use 20
npm install
# .env.local: APP_PASSWORD setzen, ANTHROPIC_API_KEY für Live-Generierung
PORT=3939 npm run dev
```
→ http://localhost:3939 · Passwort aus `.env.local` (Default-Seed: Fach **EAL 101**).

## Architektur
- **Next.js 16 (App Router) + Tailwind**, TypeScript
- `src/lib/` — `types`, `storage` (lokal `.data/`, Vercel später `@vercel/blob`), `claude` (Generierung + Prompt-Caching), `auth`
- `src/app/api/` — `login`, `ingest` (PDF→Text), `generate` (Claude), `studyset` (laden/speichern)
- `src/data/*.json` — Seed-Fächer (Startinhalt)

## TODO Deploy / V2
- [ ] `ANTHROPIC_API_KEY` setzen (für Upload→Generierung)
- [ ] Storage auf **Vercel Blob/KV** umstellen (echtes Multi-User-Sharing) — 1 Funktion in `storage.ts`
- [ ] Deploy auf Vercel, `APP_PASSWORD` + Key als Env
- [ ] Handschrift-Scans (OCR) zusätzlich zu PDF
- [ ] Tester-Feedback einarbeiten
