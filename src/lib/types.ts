// Kern-Datenmodell des Klausur-Radars

export type Quelle = {
  doc: string;        // Name der Original-Mitschrift / des Dokuments
  seite?: string;     // Seite / Abschnitt, z.B. "S. 12" oder "Übung 3"
  original?: string;  // VERBATIM-Ausschnitt aus der Originaldatei (zum Nachvollziehen/Lernen)
};

export type Karte = {
  id: string;
  frage: string;
  antwort: string;
  thema: string;
  relevanz: 1 | 2 | 3;        // 3 = vom Dozenten als klausurrelevant markiert
  quelle: Quelle;
  up: number;
  down: number;
};

export type ThemaBlock = {
  id: string;
  thema: string;
  punkte: string[];
  relevanz: 1 | 2 | 3;
  quelle: Quelle;
};

export type QuizFrage = {
  id: string;
  frage: string;
  optionen: string[];
  loesungIndex: number;
  erklaerung: string;
  quelle: Quelle;
};

export type KlausurFrage = {
  id: string;
  frage: string;
  warum: string;              // warum wahrscheinlich (Dozenten-Signal)
  quelle: Quelle;
};

export type Dokument = {
  id: string;
  name: string;
  woerter: number;
  seiten: number;
  hochgeladenVon: string;
  text: string;               // extrahierter Text mit [S.x]-Markern
};

export type StudySet = {
  fach: string;               // z.B. "EAL 101"
  titel: string;
  stand: string;              // ISO-Datum
  dokumente: Dokument[];
  karten: Karte[];
  themen: ThemaBlock[];
  quiz: QuizFrage[];
  klausurfragen: KlausurFrage[];
};
