import { promises as fs } from "fs";
import path from "path";
import type { StudySet } from "./types";

// Storage-Abstraktion.
// Lokal (Dev): JSON-Dateien unter .data/   ·   Vercel später: @vercel/blob (1 Funktion tauschen).
// Seeds liegen schreibgeschützt unter src/data/ und werden beim ersten Zugriff nach .data/ kopiert.

const DATA_DIR = path.join(process.cwd(), ".data");
const SEED_DIR = path.join(process.cwd(), "src", "data");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function file(fach: string) {
  return path.join(DATA_DIR, `${fach}.json`);
}

export async function listFaecher(): Promise<{ fach: string; titel: string }[]> {
  await ensureDir();
  // Seeds + bereits gespeicherte zusammenführen
  const ids = new Set<string>();
  for (const dir of [SEED_DIR, DATA_DIR]) {
    try {
      for (const f of await fs.readdir(dir)) if (f.endsWith(".json")) ids.add(f.replace(/\.json$/, ""));
    } catch {}
  }
  const out: { fach: string; titel: string }[] = [];
  for (const id of ids) {
    const s = await loadSet(id);
    if (s) out.push({ fach: id, titel: s.titel });
  }
  return out.sort((a, b) => a.fach.localeCompare(b.fach));
}

export async function loadSet(fach: string): Promise<StudySet | null> {
  await ensureDir();
  try {
    return JSON.parse(await fs.readFile(file(fach), "utf8")) as StudySet;
  } catch {}
  // Fallback: Seed
  try {
    return JSON.parse(await fs.readFile(path.join(SEED_DIR, `${fach}.json`), "utf8")) as StudySet;
  } catch {}
  return null;
}

export async function saveSet(set: StudySet): Promise<void> {
  await ensureDir();
  set.stand = new Date().toISOString();
  await fs.writeFile(file(set.fach), JSON.stringify(set, null, 2), "utf8");
}
