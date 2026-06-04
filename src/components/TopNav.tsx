"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radar } from "lucide-react";

// Obere Leiste: Logo + alle Fächer als Ein-Klick-Links. Auf allen Seiten gleich.
export default function TopNav() {
  const [faecher, setFaecher] = useState<{ fach: string; titel: string }[]>([]);
  const pathname = usePathname();
  const aktiv = decodeURIComponent(pathname.split("/subject/")[1] || "");

  useEffect(() => {
    fetch("/api/studyset").then((r) => (r.ok ? r.json() : { faecher: [] })).then((j) => setFaecher(j.faecher || [])).catch(() => {});
  }, []);

  // Kürzel aus dem Titel (Teil vor dem ersten „—") für eine kompakte Leiste.
  const kurz = (titel: string, fach: string) => {
    const m = titel.split("—")[0].trim();
    return m || fach.toUpperCase();
  };

  return (
    <header className="material-bar sticky top-0 z-30">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Radar size={18} color="var(--accent)" />
          <span className="t-headline hidden sm:inline">Klausur-Radar</span>
        </Link>
        {faecher.length > 0 && (
          <nav className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {faecher.map((f) => {
              const on = aktiv === f.fach;
              return (
                <Link key={f.fach} href={`/subject/${encodeURIComponent(f.fach)}`}
                  className="shrink-0 rounded-full px-3 py-1.5 text-[0.82rem] font-semibold transition"
                  style={on
                    ? { background: "var(--accent)", color: "#fff" }
                    : { background: "var(--bg-soft)", color: "var(--ink-2)", border: "1px solid var(--line)" }}>
                  {kurz(f.titel, f.fach)}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
