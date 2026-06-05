import { promises as fs } from "fs";
import path from "path";
import { put, list } from "@vercel/blob";
import type { StudySet } from "./types";

// Persistenz:
//  - Mit BLOB_READ_WRITE_TOKEN (Vercel + lokal via .env.local) → Vercel Blob (geteilt, dauerhaft).
//  - Sonst → lokale .data/-Dateien.
// Seeds (src/data/*.json) sind der Startinhalt; sobald ein Fach gespeichert wurde, gilt der Blob-/Datei-Stand.

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const DATA_DIR = process.env.VERCEL ? "/tmp/kr-data" : path.join(process.cwd(), ".data");
const SEED_DIR = path.join(process.cwd(), "src", "data");
const blobPath = (fach: string) => `studysets/${fach}.json`;

async function readSeed(fach: string): Promise<StudySet | null> {
  try { return JSON.parse(await fs.readFile(path.join(SEED_DIR, `${fach}.json`), "utf8")) as StudySet; } catch { return null; }
}
async function seedIds(): Promise<string[]> {
  try { return (await fs.readdir(SEED_DIR)).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")); } catch { return []; }
}

export async function listFaecher(): Promise<{ fach: string; titel: string; anzahl: number }[]> {
  const ids = new Set<string>(await seedIds());
  if (USE_BLOB) {
    try { for (const b of (await list({ prefix: "studysets/" })).blobs) ids.add(b.pathname.replace(/^studysets\//, "").replace(/\.json$/, "")); } catch {}
  } else {
    try { await fs.mkdir(DATA_DIR, { recursive: true }); for (const f of await fs.readdir(DATA_DIR)) if (f.endsWith(".json")) ids.add(f.replace(/\.json$/, "")); } catch {}
  }
  const out: { fach: string; titel: string; anzahl: number }[] = [];
  for (const id of ids) {
    if (id === "termine") continue;
    const s = await loadSet(id);
    if (s && s.titel && Array.isArray(s.karten)) out.push({ fach: id, titel: s.titel, anzahl: s.karten.length });
  }
  return out.sort((a, b) => a.fach.localeCompare(b.fach));
}

export async function loadSet(fach: string): Promise<StudySet | null> {
  if (USE_BLOB) {
    try {
      const found = (await list({ prefix: blobPath(fach), limit: 1 })).blobs[0];
      if (found) {
        const r = await fetch(found.url, { cache: "no-store" });
        if (r.ok) return (await r.json()) as StudySet;
      }
    } catch {}
    return readSeed(fach);
  }
  try { return JSON.parse(await fs.readFile(path.join(DATA_DIR, `${fach}.json`), "utf8")) as StudySet; } catch {}
  return readSeed(fach);
}

export async function saveSet(set: StudySet): Promise<void> {
  set.stand = new Date().toISOString();
  const body = JSON.stringify(set, null, 2);
  if (USE_BLOB) {
    await put(blobPath(set.fach), body, { access: "public", contentType: "application/json", allowOverwrite: true, addRandomSuffix: false });
    return;
  }
  try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch {}
  await fs.writeFile(path.join(DATA_DIR, `${set.fach}.json`), body, "utf8");
}
