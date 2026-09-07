/**
 * Tages-Challenge.
 *
 * Eine variable Tagesaufgabe zusätzlich zum festen Tagesziel. Der Zweck ist
 * nicht die Belohnung, sondern der Grund, die App überhaupt zu öffnen: ein
 * gleichbleibendes Ziel wird nach zwei Wochen zur Routine, die man auch
 * überspringen kann. Eine wechselnde Aufgabe erzeugt jeden Tag eine kleine
 * neue Frage — "welche ist es heute?".
 *
 * Bewusst *nicht* zufällig belohnt: die Aufgabe wechselt, die Belohnung ist
 * fest. Zufalls-Multiplikatoren funktionieren, fühlen sich im
 * Arbeitswerkzeug aber manipulativ an und kosten mehr Vertrauen als sie
 * Engagement bringen.
 *
 * Die Aufgabe des Tages ist aus dem Datum abgeleitet und damit für alle
 * gleich — das macht sie im Team besprechbar ("hast du die heutige schon?")
 * und verhindert, dass ein Neuladen eine leichtere Aufgabe auswürfelt.
 */
import type { Item, ModuleId, Progress } from './types'
import { today } from './srs'

export type ChallengeKind =
  | { kind: 'moduleCorrect'; moduleId: ModuleId }
  | { kind: 'reviews' }
  | { kind: 'perfectLesson' }
  | { kind: 'summarize' }
  | { kind: 'scenarios' }

export interface DailyChallenge {
  id: string
  title: string
  /** Was zählt – in einem Satz, ohne Fachjargon. */
  description: string
  target: number
  xp: number
  spec: ChallengeKind
}

const POOL: DailyChallenge[] = [
  {
    id: 'm1-3',
    title: 'Kellerwissen',
    description: 'Beantworte drei Aufgaben aus Modul 1 (Physik & Technik) richtig.',
    target: 3,
    xp: 30,
    spec: { kind: 'moduleCorrect', moduleId: 'm1-grundlagen' },
  },
  {
    id: 'm3-3',
    title: 'Produktcheck',
    description: 'Beantworte drei Aufgaben aus Modul 3 (Produktlogik) richtig.',
    target: 3,
    xp: 30,
    spec: { kind: 'moduleCorrect', moduleId: 'm3-produkt' },
  },
  {
    id: 'm6-3',
    title: 'Vertriebsrunde',
    description: 'Beantworte drei Aufgaben aus Modul 6 (Wirtschaftlichkeit & Vertrieb) richtig.',
    target: 3,
    xp: 30,
    spec: { kind: 'moduleCorrect', moduleId: 'm6-wirtschaft' },
  },
  {
    id: 'm4-3',
    title: 'Paragrafen',
    description: 'Beantworte drei Aufgaben aus Modul 4 (Regulatorik & Recht) richtig.',
    target: 3,
    xp: 30,
    spec: { kind: 'moduleCorrect', moduleId: 'm4-recht' },
  },
  {
    id: 'reviews-5',
    title: 'Auffrischen',
    description: 'Beantworte fünf fällige Wiederholungen richtig.',
    target: 5,
    xp: 40,
    spec: { kind: 'reviews' },
  },
  {
    id: 'scenario-2',
    title: 'Am Kunden',
    description: 'Löse zwei Aufgaben aus dem Kundengespräch richtig.',
    target: 2,
    xp: 35,
    spec: { kind: 'scenarios' },
  },
  {
    id: 'summarize-1',
    title: 'In eigenen Worten',
    description: 'Schliesse eine Lesen-und-Zusammenfassen-Aufgabe erfolgreich ab.',
    target: 1,
    xp: 45,
    spec: { kind: 'summarize' },
  },
]

/** Stabiler Hash über den Tag – gleiche Aufgabe für alle, kein Neuauswürfeln. */
function hashDay(day: string): number {
  let h = 2166136261
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export function challengeForDay(day: string = today()): DailyChallenge {
  return POOL[hashDay(day) % POOL.length]
}

/** Zählt diese Antwort für die heutige Challenge? */
export function countsTowards(
  challenge: DailyChallenge,
  item: Item,
  ctx: { correct: boolean; wasDue: boolean },
): boolean {
  if (!ctx.correct) return false
  switch (challenge.spec.kind) {
    case 'moduleCorrect':
      return item.moduleId === challenge.spec.moduleId
    case 'reviews':
      return ctx.wasDue
    case 'scenarios':
      return item.type === 'scenario'
    case 'summarize':
      return item.type === 'readSummarize'
    case 'perfectLesson':
      return false // wird beim Lektionsabschluss gezählt, nicht je Antwort
  }
}

/** Zählerstand für heute – wechselt der Tag, beginnt die Zählung neu. */
export function challengeCount(progress: Progress, day: string = today()): number {
  return progress.challenge?.day === day ? progress.challenge.count : 0
}

export function challengeClaimed(progress: Progress, day: string = today()): boolean {
  return progress.challenge?.day === day && progress.challenge.claimed
}

export function challengeDone(progress: Progress, day: string = today()): boolean {
  return challengeCount(progress, day) >= challengeForDay(day).target
}

/**
 * Antwort einarbeiten und, falls das Ziel damit erreicht ist, die Belohnung
 * gutschreiben. Gibt die vergebenen Bonus-XP zurück, damit die Oberfläche
 * sie anzeigen kann.
 */
export function recordChallengeProgress(
  progress: Progress,
  item: Item,
  ctx: { correct: boolean; wasDue: boolean },
  now: Date = new Date(),
): { progress: Progress; awardedXp: number; justCompleted: boolean } {
  const day = today(now)
  const challenge = challengeForDay(day)
  const current = progress.challenge?.day === day ? progress.challenge : { day, count: 0, claimed: false }

  if (current.claimed || !countsTowards(challenge, item, ctx)) {
    return { progress: { ...progress, challenge: current }, awardedXp: 0, justCompleted: false }
  }

  const count = current.count + 1
  const reached = count >= challenge.target
  const awardedXp = reached ? challenge.xp : 0

  return {
    progress: {
      ...progress,
      challenge: { day, count, claimed: reached },
      xp: progress.xp + awardedXp,
      xpByDay: awardedXp
        ? { ...progress.xpByDay, [day]: (progress.xpByDay[day] ?? 0) + awardedXp }
        : progress.xpByDay,
    },
    awardedXp,
    justCompleted: reached,
  }
}
