/**
 * Mastery-Abzeichen je Kurs.
 *
 * Das einzige Element, das im Unternehmen als echtes Kompetenzsignal taugt.
 * Deshalb hängt es an **Beherrschung**, nicht an Punkten: XP misst
 * Aufwand, ein Abzeichen soll Können bedeuten. Wer viel klickt, bekommt
 * viele Punkte — aber kein Gold.
 *
 * Die Schwelle ist Leitner-Box 4: vier richtige Antworten in wachsenden
 * Abständen über mindestens 27 Tage. Das kann man nicht an einem
 * Nachmittag erarbeiten, und genau das ist der Punkt.
 */
import type { Progress } from './types'

export type BadgeLevel = 'none' | 'bronze' | 'silber' | 'gold'

/** Ab dieser Box zählt ein Item für ein Abzeichen – strenger als "sitzt". */
export const BADGE_BOX = 4

export const BADGE_THRESHOLDS: { level: Exclude<BadgeLevel, 'none'>; ratio: number }[] = [
  { level: 'bronze', ratio: 1 / 3 },
  { level: 'silber', ratio: 2 / 3 },
  { level: 'gold', ratio: 1 },
]

export const BADGE_LABEL: Record<BadgeLevel, string> = {
  none: 'noch kein Abzeichen',
  bronze: 'Bronze',
  silber: 'Silber',
  gold: 'Gold',
}

export const BADGE_ICON: Record<BadgeLevel, string> = {
  none: '○',
  bronze: '🥉',
  silber: '🥈',
  gold: '🥇',
}

export interface BadgeStatus {
  level: BadgeLevel
  /** Anteil der Items, die die Abzeichen-Schwelle erreicht haben. */
  ratio: number
  mastered: number
  total: number
  /** Nächste Stufe und wie viele Items dafür noch fehlen. */
  next: { level: Exclude<BadgeLevel, 'none'>; itemsMissing: number } | null
}

export function badgeFor(progress: Progress, itemIds: string[]): BadgeStatus {
  const total = itemIds.length
  const mastered = itemIds.filter((id) => (progress.items[id]?.box ?? 0) >= BADGE_BOX).length
  const ratio = total ? mastered / total : 0

  let level: BadgeLevel = 'none'
  for (const t of BADGE_THRESHOLDS) if (ratio >= t.ratio) level = t.level

  const nextThreshold = BADGE_THRESHOLDS.find((t) => ratio < t.ratio)
  const next = nextThreshold
    ? {
        level: nextThreshold.level,
        itemsMissing: Math.max(1, Math.ceil(nextThreshold.ratio * total) - mastered),
      }
    : null

  return { level, ratio, mastered, total, next }
}
