// Evidenzbasierte Lernstrategie (Dunlosky 2013; Donoghue & Hattie 2021)
// Die zwei wirksamsten Techniken: Active Recall + Spaced Repetition. Dazu Interleaving + Elaboration.

export const STRATEGIE = {
  titel: "So lernst du am effizientesten",
  quelle: "Dunlosky et al. (2013) · Donoghue & Hattie (2021)",
  prinzipien: [
    {
      name: "Active Recall",
      kurz: "Abfragen statt nochmal lesen",
      text: "Decke die Antwort ab und ruf sie aktiv aus dem Gedächtnis ab. Wer sich abfragt, behält nach einer Woche ~80 % statt ~34 % beim bloßen Wiederlesen.",
    },
    {
      name: "Spaced Repetition",
      kurz: "Verteilt wiederholen",
      text: "Wiederhole in wachsenden Abständen (heute, in 2 Tagen, in 4, in 8). Schwere Karten öfter, leichte seltener — das erzeugt dauerhaftes Wissen statt Bulimie-Lernen.",
    },
    {
      name: "Interleaving",
      kurz: "Themen mischen",
      text: "Mische verschiedene Themen/Fragetypen in einer Session, statt ein Thema am Stück. Das trainiert das Unterscheiden — genau was die Klausur verlangt.",
    },
    {
      name: "Elaboration",
      kurz: "Mit Wissen verknüpfen",
      text: "Erklär dir laut, WARUM etwas gilt und wie es mit Bekanntem zusammenhängt. Nutze die Original-Auszüge als Beleg.",
    },
  ],
};

// Aus „Tage bis zur Klausur" einen konkreten Pacing-Plan ableiten.
export function lernplan(tageBisKlausur: number | null, kartenAnzahl: number) {
  if (tageBisKlausur === null) {
    return {
      headline: "Kein fixer Klausurtermin — baue jetzt eine solide Basis.",
      proTag: Math.max(5, Math.ceil(kartenAnzahl / 7)),
      hinweis: "Starte mit Active Recall über alle Karten, dann 2–3× pro Woche im Spaced-Repetition-Modus wiederholen.",
    };
  }
  if (tageBisKlausur <= 0)
    return { headline: "Heute ist es soweit — kurzer Aktiv-Abruf aller klausurrelevanten Karten.", proTag: kartenAnzahl, hinweis: "Nur noch abrufen, nichts Neues. Ruhig bleiben." };

  const lernTage = Math.max(1, tageBisKlausur - 1); // letzter Tag = Puffer/Wiederholung
  const proTag = Math.max(4, Math.ceil(kartenAnzahl / Math.min(lernTage, 6)) + 4);
  let headline: string;
  if (tageBisKlausur <= 3) headline = `Endspurt: ${tageBisKlausur} Tage. Täglich ALLE Karten aktiv abrufen + Quiz.`;
  else if (tageBisKlausur <= 10) headline = `${tageBisKlausur} Tage: jeden Tag eine Spaced-Repetition-Runde, schwache Karten doppelt.`;
  else headline = `${tageBisKlausur} Tage: entspanntes verteiltes Lernen — lieber täglich kurz als selten lang.`;
  return {
    headline,
    proTag,
    hinweis: "Reihenfolge pro Session: 1) neue Karten (Active Recall) → 2) fällige Wiederholungen → 3) ein Quiz zur Kontrolle.",
  };
}

export function tageBis(datumISO: string, heuteISO: string): number {
  const ms = new Date(datumISO + "T00:00:00").getTime() - new Date(heuteISO + "T00:00:00").getTime();
  return Math.round(ms / 86400000);
}
