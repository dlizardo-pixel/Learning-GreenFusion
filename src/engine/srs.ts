import type { ItemProgress, Progress } from './types'

/**
 * Verteilte Wiederholung nach dem Leitner-Prinzip.
 *
 * Bewusst Leitner statt SM-2: SM-2 braucht eine Selbsteinschätzung ("wie leicht
 * war das?"), die bei Multiple-Choice unzuverlässig ist. Leitner braucht nur
 * richtig/falsch — genau das, was wir sicher messen können.
 *
 * Abstände in Tagen je Box. Box 0 ist "heute nochmal".
 */
export const BOX_INTERVALS_DAYS = [0, 1, 3, 7, 16, 35] as const
export const MAX_BOX = BOX_INTERVALS_DAYS.length - 1

export function today(now: Date = new Date()): string {
  // Lokaler Tag, nicht UTC — sonst springt die Serie für Nutzende abends um.
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(day: string, days: number): string {
  const [y, m, d] = day.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return today(date)
}

export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  const a = Date.UTC(fy, fm - 1, fd)
  const b = Date.UTC(ty, tm - 1, td)
  return Math.round((b - a) / 86_400_000)
}

/** Neuer Lernstand nach einer Antwort. */
export function review(
  prev: ItemProgress | undefined,
  itemId: string,
  correct: boolean,
  now: Date = new Date(),
): ItemProgress {
  const day = today(now)
  const base: ItemProgress = prev ?? {
    itemId,
    box: 0,
    dueAt: day,
    lastSeenAt: day,
    timesCorrect: 0,
    timesWrong: 0,
  }

  // Bei Fehler zurück auf Box 0 — nicht nur eine Box zurück. Wer ein Konzept
  // verwechselt, hat es meist gar nicht verstanden, nicht "fast".
  const box = correct ? Math.min(base.box + 1, MAX_BOX) : 0

  return {
    itemId,
    box,
    dueAt: addDays(day, BOX_INTERVALS_DAYS[box]),
    lastSeenAt: day,
    timesCorrect: base.timesCorrect + (correct ? 1 : 0),
    timesWrong: base.timesWrong + (correct ? 0 : 1),
  }
}

export function isDue(p: ItemProgress, now: Date = new Date()): boolean {
  return daysBetween(p.dueAt, today(now)) >= 0
}

/** Wie viele Items sind heute zur Wiederholung fällig? */
export function dueCount(progress: Progress, now: Date = new Date()): number {
  return Object.values(progress.items).filter((p) => isDue(p, now)).length
}

/**
 * Serie fortschreiben. Regeln:
 * - gleicher Tag: Serie bleibt
 * - Vortag: Serie +1
 * - älter: Serie startet bei 1
 */
export function bumpStreak(progress: Progress, now: Date = new Date()): Progress {
  const day = today(now)
  if (progress.lastActiveDay === day) return progress

  const gap = progress.lastActiveDay ? daysBetween(progress.lastActiveDay, day) : Infinity
  const streak = gap === 1 ? progress.streak + 1 : 1

  return {
    ...progress,
    streak,
    longestStreak: Math.max(progress.longestStreak, streak),
    lastActiveDay: day,
  }
}
