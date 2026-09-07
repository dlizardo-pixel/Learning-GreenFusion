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
 * Schutztage für die Serie.
 *
 * Der häufigste Abbruchgrund in Apps dieser Art ist eine verlorene lange
 * Serie: wer 60 Tage aufgebaut und an einem Krankheitstag verloren hat,
 * kommt oft gar nicht mehr zurück. Ein Schutztag pro Woche überbrückt
 * genau das, ohne die Serie bedeutungslos zu machen.
 *
 * Bewusst geschenkt und nicht verkauft oder erarbeitet: das hier ist ein
 * Arbeitswerkzeug, kein Spiel mit Währung.
 */
export const MAX_FREEZES = 2

/** Montag der Woche – hier lokal gehalten, damit srs.ts unabhängig bleibt. */
function mondayOf(now: Date): string {
  const d = new Date(now)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return today(d)
}

/**
 * Wöchentlich einen Schutztag gutschreiben, gedeckelt bei MAX_FREEZES.
 *
 * Der Deckel verhindert, dass jemand nach drei Monaten Pause zwölf
 * Schutztage hat und eine Serie behält, die er nie gelebt hat.
 */
export function grantWeeklyFreeze(progress: Progress, now: Date = new Date()): Progress {
  const week = mondayOf(now)
  if (progress.freezeGrantedWeek === week) return progress
  return {
    ...progress,
    freezes: Math.min(progress.freezes + 1, MAX_FREEZES),
    freezeGrantedWeek: week,
  }
}

/** Zeitfenster, in dem eine verlorene Serie noch zu retten ist. */
export const REPAIR_WINDOW_DAYS = 2

/** Ist die verlorene Serie noch zu retten? */
export function canRepairStreak(progress: Progress, now: Date = new Date()): boolean {
  if (!progress.lostStreak) return false
  const age = daysBetween(progress.lostStreak.lostOn, today(now))
  return age >= 0 && age <= REPAIR_WINDOW_DAYS && progress.lostStreak.value >= 2
}

/**
 * Verlorene Serie wiederherstellen.
 *
 * Aufrufen, wenn die Bedingung erfüllt ist (eine zusätzliche Lektion am
 * selben Tag). Die Serie wird auf ihren alten Wert plus den heutigen Tag
 * gesetzt – sie war ja tatsächlich gelaufen.
 */
export function repairStreak(progress: Progress, now: Date = new Date()): Progress {
  if (!canRepairStreak(progress, now)) return progress
  const restored = progress.lostStreak!.value + 1
  return {
    ...progress,
    streak: restored,
    longestStreak: Math.max(progress.longestStreak, restored),
    lastActiveDay: today(now),
    lostStreak: null,
  }
}

/**
 * Serie fortschreiben. Regeln:
 * - gleicher Tag: Serie bleibt
 * - Vortag: Serie +1
 * - Lücke, die verfügbare Schutztage abdecken: Serie +1, Schutztage werden
 *   verbraucht und die überbrückten Tage vermerkt
 * - grössere Lücke: Serie startet bei 1, die alte Serie wird für ein
 *   Rettungsfenster festgehalten
 */
export function bumpStreak(progress: Progress, now: Date = new Date()): Progress {
  const day = today(now)
  if (progress.lastActiveDay === day) return progress

  const gap = progress.lastActiveDay ? daysBetween(progress.lastActiveDay, day) : Infinity

  if (gap === 1) {
    const streak = progress.streak + 1
    return {
      ...progress,
      streak,
      longestStreak: Math.max(progress.longestStreak, streak),
      lastActiveDay: day,
      lostStreak: null,
    }
  }

  // Verpasste Tage zwischen letztem Lerntag und heute.
  const missed = Number.isFinite(gap) ? gap - 1 : Infinity
  if (missed > 0 && missed <= progress.freezes) {
    const bridged: string[] = []
    for (let i = 1; i <= missed; i++) bridged.push(addDays(progress.lastActiveDay!, i))
    const streak = progress.streak + 1
    return {
      ...progress,
      streak,
      longestStreak: Math.max(progress.longestStreak, streak),
      lastActiveDay: day,
      freezes: progress.freezes - missed,
      frozenDays: [...progress.frozenDays, ...bridged],
      lostStreak: null,
    }
  }

  return {
    ...progress,
    streak: 1,
    longestStreak: Math.max(progress.longestStreak, 1),
    lastActiveDay: day,
    // Die alte Serie festhalten, solange sie noch zu retten ist.
    lostStreak: progress.streak >= 2 ? { value: progress.streak, lostOn: day } : null,
  }
}
