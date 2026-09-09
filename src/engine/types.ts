/**
 * Inhaltsmodell der Lernapp.
 *
 * Leitgedanke: Ein Item ist eine *Prüfung eines Konzepts*, nicht nur eine Frage.
 * Darum tragen alle Items `concepts` (was wird geprüft), `why` (die Erklärung,
 * die nach der Antwort erscheint) und `source` (Herkunft in unseren Quellen).
 * Ohne `why` und `source` darf kein Item in die App — Lernen ohne Begründung
 * erzeugt Ratewissen, und Wissen ohne Quelle veraltet unbemerkt.
 */

/**
 * Die Module des Zertifikats "GF Heiz-Kompass – Level 1".
 *
 * Reihenfolge ist didaktisch: Physik vor Regelung vor Produkt. Wer die
 * Heizkurve nicht kennt, kann die Optimierungsempfehlung nicht einordnen,
 * und wer das Produkt nicht kennt, kann die Regulatorik nicht verkaufen.
 *
 * Modul 9 ist nachträglich dazugekommen und steht bewusst am Ende, obwohl
 * es inhaltlich am Anfang stehen könnte: Wer nicht weiss, wie ein
 * Wohnungsunternehmen entscheidet, kann auch mit perfektem Fachwissen
 * nichts ausrichten. Es wurde ergänzt, weil in den Modulen 1 bis 8 die
 * Rollen nur als Kulisse in Rollenspielen vorkamen — das Vokabular war
 * da, das Wissen nicht.
 */
export type ModuleId =
  | 'm1-grundlagen'
  | 'm2-regelung'
  | 'm3-produkt'
  | 'm4-recht'
  | 'm5-markt'
  | 'm6-wirtschaft'
  | 'm7-sektorkopplung'
  | 'm8-praxis'
  | 'm9-wohnungswirtschaft'

export interface Source {
  /** Menschenlesbarer Name, z. B. "Product Specification 1.0 (08.26), Abschnitt 2.3" */
  label: string
  /** Link in Notion / Knowledge Base / Blog. Optional, weil manche Quellen nur intern zitiert werden. */
  url?: string
}

interface ItemBase {
  id: string
  moduleId: ModuleId
  /** Lektions-Bündel innerhalb des Kurses, z. B. "technik-1" */
  unitId: string
  /** 1 = Einstieg, 2 = Aufbau, 3 = Vertiefung. Steuert die Reihenfolge im Lernpfad. */
  level: 1 | 2 | 3
  /** Konzepte, die dieses Item prüft. Grundlage für Wiederholung und Lücken-Analyse. */
  concepts: string[]
  /** Erklärung, die nach der Antwort erscheint — immer, auch bei richtiger Antwort. */
  why: string
  source: Source
}

export interface MultipleChoiceItem extends ItemBase {
  type: 'mc'
  prompt: string
  options: string[]
  /** Index in `options` */
  answer: number
}

export interface MultiSelectItem extends ItemBase {
  type: 'multi'
  prompt: string
  options: string[]
  /** Indizes in `options`; Reihenfolge irrelevant */
  answer: number[]
}

export interface TrueFalseItem extends ItemBase {
  type: 'truefalse'
  /** Eine Behauptung, die stimmt oder nicht stimmt. */
  statement: string
  answer: boolean
}

export interface ClozeItem extends ItemBase {
  type: 'cloze'
  /** Text mit Platzhaltern {{0}}, {{1}} … in aufsteigender Reihenfolge. */
  template: string
  /** Korrekte Füllung je Platzhalter. */
  blanks: string[]
  /** Zusätzliche falsche Kacheln, damit es nicht trivial wird. */
  distractors: string[]
}

export interface MatchItem extends ItemBase {
  type: 'match'
  prompt: string
  pairs: { left: string; right: string }[]
}

export interface OrderItem extends ItemBase {
  type: 'order'
  prompt: string
  /** Schritte in der *korrekten* Reihenfolge; die App mischt sie. */
  steps: string[]
}

export interface HotspotItem extends ItemBase {
  type: 'hotspot'
  prompt: string
  /** Welches Schema gezeigt wird — siehe components/Schematic.tsx */
  schematic: 'gasboiler' | 'districtheating' | 'heatpump-pv'
  /** ID des korrekten Bauteils im Schema. */
  answer: string
}

export interface EstimateItem extends ItemBase {
  type: 'estimate'
  prompt: string
  unit: string
  min: number
  max: number
  step: number
  answer: number
  /** Erlaubte Abweichung nach oben/unten, damit Schätzen nicht Glücksspiel ist. */
  tolerance: number
}

export interface ScenarioItem extends ItemBase {
  type: 'scenario'
  /** Wer spricht, z. B. "Technische Leiterin einer Genossenschaft" */
  persona: string
  /** Was die Person sagt — wortnahe Kundensprache. */
  quote: string
  prompt: string
  options: string[]
  answer: number
  /** Warum die *anderen* Antworten schlechter sind. Je Option ein kurzer Satz. */
  optionFeedback: string[]
}

export interface ReadSummarizeItem extends ItemBase {
  type: 'readSummarize'
  title: string
  /** Lesetext in Absätzen. Zielgröße 150–350 Wörter — eine Kaffeepause. */
  passage: string[]
  prompt: string
  /**
   * Konzepte, die eine gute Zusammenfassung abdecken muss.
   * `keywords` enthält Synonyme/Schreibweisen, die als Treffer zählen.
   */
  rubric: { concept: string; keywords: string[]; hint: string }[]
  /** Musterlösung, die nach der Abgabe gezeigt wird. */
  modelAnswer: string
  /** Anteil der Rubrik-Punkte, ab dem die Aufgabe als bestanden gilt. */
  passRatio: number
}

/**
 * Sortieren in Körbe – für "Wer macht das?" (Green Fusion / Partner / Kunde)
 * und für den Aufbau eines Heizsystems (Erzeuger / Verteilung / Verbraucher).
 *
 * Unterscheidet sich von der Zuordnung darin, dass mehrere Begriffe in
 * denselben Korb gehören. Genau das ist bei Zuständigkeiten der Normalfall.
 */
export interface BucketsItem extends ItemBase {
  type: 'buckets'
  prompt: string
  buckets: { id: string; label: string; hint?: string }[]
  /** Jeder Begriff gehört in genau einen Korb. */
  entries: { text: string; bucketId: string }[]
}

/**
 * Datenkarte mit Entscheidung – für "Fernoptimierbar oder nicht?".
 *
 * Die Karte zeigt Merkmale (Reglermodell, Bus, Gateway, GreenBox-Generation),
 * und es ist zu entscheiden, was daraus folgt. Das trainiert genau die
 * Urteilsbildung, die im Termin gebraucht wird: nicht das Reglermodell
 * auswendig kennen, sondern aus seinen Merkmalen die Folge ableiten.
 */
export interface CardItem extends ItemBase {
  type: 'card'
  /** Titel der Karte, z. B. "Samson Trovis 5576" */
  cardTitle: string
  /** Merkmale als Feld-Wert-Paare. */
  cardFacts: { label: string; value: string }[]
  prompt: string
  options: string[]
  answer: number
  /** Warum die jeweilige Option richtig oder falsch ist. */
  optionFeedback: string[]
}

/**
 * Mehrstufige Gesprächssimulation.
 *
 * Für die Fallstudien des Lehrplans: "Herr Kamp fragt nach Umlagefähigkeit"
 * und "Der kritische technische Leiter". Jeder Zug hat eine beste Antwort;
 * die Wahl bestimmt, was die Person als Nächstes sagt.
 *
 * Bewusst keine echte Verzweigung in getrennte Pfade: eine falsche Antwort
 * führt nicht in einen Sackgassen-Pfad, sondern die Person reagiert
 * entsprechend und das Gespräch geht weiter. Wer im Rollenspiel abbricht,
 * lernt nichts über die Rettung eines schiefgelaufenen Gesprächs.
 */
export interface DialogueItem extends ItemBase {
  type: 'dialogue'
  persona: string
  /** Vorspann: Wer sitzt da, worum geht es, was ist der Anlass. */
  situation: string
  turns: {
    /** Was die Person sagt. */
    says: string
    prompt: string
    options: string[]
    answer: number
    optionFeedback: string[]
    /** Reaktion der Person nach der Wahl – gleich für alle Wege. */
    reaction: string
  }[]
  /** Anteil richtiger Züge, ab dem das Gespräch als gelungen gilt. */
  passRatio: number
}

export type Item =
  | MultipleChoiceItem
  | MultiSelectItem
  | TrueFalseItem
  | ClozeItem
  | MatchItem
  | OrderItem
  | HotspotItem
  | EstimateItem
  | ScenarioItem
  | ReadSummarizeItem
  | BucketsItem
  | CardItem
  | DialogueItem

export type ItemType = Item['type']

export interface Unit {
  id: string
  moduleId: ModuleId
  /** Nummer im Lehrplan, z. B. "1.2" – macht die App zum Lehrplan nachvollziehbar. */
  code: string
  title: string
  /** Ein Satz: was kann ich danach, was ich vorher nicht konnte. */
  goal: string
  icon: string
  /**
   * Optionale Lektion: gehört nicht zum Pflichtstoff des Zertifikats.
   *
   * Sie kommt nicht in die Tageslektion, nicht in die Prüfungen, zählt
   * nicht zur Mastery und füllt keine andere Lektion auf. Sie erscheint
   * nur, wenn man sie selbst öffnet.
   *
   * Hintergrund: Gesprächstechnik und Formulierungshilfen sind für einen
   * Teil der Nutzenden das Nützlichste an der App und für einen anderen
   * Teil Ballast. Beides gleichzeitig geht nur, wenn dieser Stoff
   * erreichbar bleibt, aber nichts erzwingt.
   */
  optional?: boolean
}

export interface LearningModule {
  id: ModuleId
  /** Modulnummer 1–8. */
  number: number
  title: string
  subtitle: string
  icon: string
  /** Akzentfarbe aus dem Green Fusion Design System. */
  color: string
  units: Unit[]
}

/** Ergebnis einer Modulprüfung. */
export interface ExamResult {
  /** Bester erreichter Anteil richtiger Antworten, 0..1 */
  bestScore: number
  passed: boolean
  attempts: number
  /** ISO-Datum des Bestehens. */
  passedAt: string | null
}

/** Lernstand pro Item — die Grundlage der verteilten Wiederholung. */
export interface ItemProgress {
  itemId: string
  /** Leitner-Box 0–5. 0 = neu/falsch, 5 = sitzt. */
  box: number
  /** ISO-Datum, ab wann das Item wieder fällig ist. */
  dueAt: string
  lastSeenAt: string
  timesCorrect: number
  timesWrong: number
}

/** Fortschritt der Tages-Challenge. */
export interface ChallengeProgress {
  /** Tag, für den gezählt wird. Wechselt der Tag, beginnt die Zählung neu. */
  day: string
  count: number
  /** Belohnung schon vergeben? Verhindert doppelte Gutschrift. */
  claimed: boolean
}

/** Eine verlorene Serie, solange sie noch zu retten ist. */
export interface LostStreak {
  value: number
  lostOn: string
}

export interface Progress {
  version: 1
  xp: number
  /** Aktuelle Serie in Tagen. */
  streak: number
  longestStreak: number
  /** ISO-Datum (YYYY-MM-DD) des letzten abgeschlossenen Lerntages. */
  lastActiveDay: string | null
  /** Tagesziel in XP. */
  dailyGoal: number
  /** XP pro Tag, für Serie und Wochenansicht. */
  xpByDay: Record<string, number>
  items: Record<string, ItemProgress>
  /** Abgeschlossene Lektionen: unitId -> Anzahl fehlerfreier Durchläufe. */
  unitsCompleted: Record<string, number>

  /** Verfügbare Schutztage für die Serie. */
  freezes: number
  /** Woche (ISO-Montag), für die der letzte Schutztag gewährt wurde. */
  freezeGrantedWeek: string | null
  /** Tage, die ein Schutztag überbrückt hat – für die Wochenansicht. */
  frozenDays: string[]
  /** Verlorene Serie, solange das Zeitfenster zur Rettung offen ist. */
  lostStreak: LostStreak | null
  challenge: ChallengeProgress | null
  /** Prüfungsstand je Modul. */
  exams: Record<string, ExamResult>
}
