// Liest den Lern-Fortschritt (Leitner-Boxen aus dem Lernmodus) aus dem localStorage.
// box >= 3 gilt als „gut gelernt".

export function gemeistert(fach: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const f = JSON.parse(localStorage.getItem(`kr_lern_${fach}`) || "{}") as Record<string, { box: number }>;
    return Object.values(f).filter((x) => x.box >= 3).length;
  } catch { return 0; }
}
