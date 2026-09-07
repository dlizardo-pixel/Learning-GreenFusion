/**
 * Prüfungen und Zertifikat "GF Heiz-Kompass – Level 1".
 *
 * Der Führerschein-Gedanke ernst genommen: acht Modulprüfungen, danach
 * eine Abschlussprüfung über alles. Eine Prüfung unterscheidet sich in
 * drei Punkten von einer Lektion, und jeder davon ist Absicht:
 *
 * 1. **Keine Wiederholung von Fehlern.** In der Lektion kommt eine falsche
 *    Antwort am Ende nochmal, weil das den Lerneffekt bringt. In der
 *    Prüfung zählt der erste Versuch — sonst prüft sie nichts.
 * 2. **Rückmeldung erst am Ende.** Wer nach jeder Frage die Auflösung
 *    sieht, macht eine Übung, keine Prüfung. Die Erklärungen kommen
 *    vollständig im Debrief, damit die Prüfung trotzdem lehrt.
 * 3. **Querschnitt statt Zufall.** Gezogen wird über alle Lektionen des
 *    Moduls verteilt, nicht zufällig aus dem Topf. Sonst kann eine
 *    Prüfung ein halbes Modul auslassen.
 */
import type { ExamResult, Item, Progress } from './types'
import { today } from './srs'

/** Fragen je Modulprüfung. */
export const EXAM_SIZE = 12
/** Fragen in der Abschlussprüfung – breiter, weil sie alles abdeckt. */
export const FINAL_EXAM_SIZE = 24
/** Bestehensgrenze. Ein Zertifikat, das man mit der Hälfte bekommt, ist keins. */
export const PASS_RATIO = 0.8
/** Schlüssel der Abschlussprüfung im Prüfungsstand. */
export const FINAL = 'final'

export interface ExamRequest {
  items: Item[]
  /** Modul-ID, oder FINAL für die Abschlussprüfung. */
  examId: string
  size?: number
  random?: () => number
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Fragen einer Gruppe reihum ziehen, damit keine Untergruppe ausfällt. */
function roundRobin<T>(groups: T[][], size: number): T[] {
  const out: T[] = []
  let round = 0
  while (out.length < size && groups.some((g) => g.length > round)) {
    for (const g of groups) {
      if (out.length >= size) break
      if (g.length > round) out.push(g[round])
    }
    round++
  }
  return out
}

/** Nach Schlüssel gruppieren, Gruppen stabil sortiert und intern gemischt. */
function grouped<T>(list: T[], key: (x: T) => string, rnd: () => number): T[][] {
  const map = new Map<string, T[]>()
  for (const x of list) {
    const k = key(x)
    const g = map.get(k) ?? []
    g.push(x)
    map.set(k, g)
  }
  return [...map.keys()].sort().map((k) => shuffle(map.get(k)!, rnd))
}

/**
 * Prüfungsfragen ziehen – reihum, damit keine Lektion ausgelassen wird.
 *
 * Zweistufig, und das ist nötig: die Abschlussprüfung muss über die
 * **Module** reihum ziehen, nicht über die Lektionen. Zieht man nur über
 * Lektionen, greift man bei 43 Lektionen und 24 Fragen die ersten 24 in
 * alphabetischer Folge ab — und deckt damit nur die halbe Ausbildung ab.
 * Innerhalb eines Moduls wird dann wieder über die Lektionen verteilt.
 */
export function buildExam(req: ExamRequest): Item[] {
  const rnd = req.random ?? Math.random
  const isFinal = req.examId === FINAL
  const size = req.size ?? (isFinal ? FINAL_EXAM_SIZE : EXAM_SIZE)

  const pool = isFinal ? req.items : req.items.filter((i) => i.moduleId === req.examId)
  if (!pool.length) return []

  if (!isFinal) {
    return shuffle(roundRobin(grouped(pool, (i) => i.unitId, rnd), size), rnd)
  }

  // Je Modul eine lektionsübergreifend ausbalancierte Reihe bilden …
  const perModule = grouped(pool, (i) => i.moduleId, rnd).map((moduleItems) =>
    roundRobin(grouped(moduleItems, (i) => i.unitId, rnd), size),
  )
  // … und dann reihum über die Module ziehen.
  return shuffle(roundRobin(perModule, size), rnd)
}

export const emptyExamResult = (): ExamResult => ({
  bestScore: 0,
  passed: false,
  attempts: 0,
  passedAt: null,
})

export const examFor = (progress: Progress, examId: string): ExamResult =>
  progress.exams[examId] ?? emptyExamResult()

export const examPassed = (progress: Progress, examId: string) =>
  examFor(progress, examId).passed

/** Versuch verbuchen. Der beste Wert bleibt stehen, ein Fehlversuch nimmt nichts weg. */
export function recordExamAttempt(
  progress: Progress,
  examId: string,
  score: number,
  now: Date = new Date(),
): Progress {
  const prev = examFor(progress, examId)
  const passed = prev.passed || score >= PASS_RATIO
  return {
    ...progress,
    exams: {
      ...progress.exams,
      [examId]: {
        bestScore: Math.max(prev.bestScore, score),
        passed,
        attempts: prev.attempts + 1,
        passedAt: prev.passedAt ?? (score >= PASS_RATIO ? today(now) : null),
      },
    },
  }
}

/**
 * Ist die Abschlussprüfung freigeschaltet?
 *
 * Erst wenn alle Modulprüfungen bestanden sind. Das ist der einzige Ort in
 * der App mit einer echten Sperre — beim freien Lernen wäre sie falsch,
 * bei einer Prüfungsreihenfolge ist sie der Sinn der Sache.
 */
export const finalExamUnlocked = (progress: Progress, moduleIds: string[]) =>
  moduleIds.every((id) => examPassed(progress, id))

export interface CertificateStatus {
  /** Bestandene Modulprüfungen. */
  modulesPassed: number
  modulesTotal: number
  finalUnlocked: boolean
  finalPassed: boolean
  /** Zertifikat erreicht: alle Module plus Abschlussprüfung. */
  earned: boolean
  earnedAt: string | null
}

export function certificateStatus(progress: Progress, moduleIds: string[]): CertificateStatus {
  const modulesPassed = moduleIds.filter((id) => examPassed(progress, id)).length
  const finalUnlocked = finalExamUnlocked(progress, moduleIds)
  const final = examFor(progress, FINAL)
  return {
    modulesPassed,
    modulesTotal: moduleIds.length,
    finalUnlocked,
    finalPassed: final.passed,
    earned: finalUnlocked && final.passed,
    earnedAt: final.passedAt,
  }
}

/** XP für eine bestandene Prüfung – deutlich mehr als eine Lektion. */
export const EXAM_XP = { module: 150, final: 500 } as const
