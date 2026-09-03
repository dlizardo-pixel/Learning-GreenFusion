import type { Progress, ItemProgress } from './types'
import { bumpStreak, review, today } from './srs'

export const emptyProgress = (): Progress => ({
  version: 1,
  xp: 0,
  streak: 0,
  longestStreak: 0,
  lastActiveDay: null,
  dailyGoal: 50,
  xpByDay: {},
  items: {},
  unitsCompleted: {},
})

/**
 * Speicher-Abstraktion.
 *
 * Heute: `localStorage` — jede Person lernt für sich, kein Backend nötig,
 * die App läuft als statische Seite. Später: derselbe Vertrag gegen eine
 * API, dann funktionieren Bestenliste und Geräte-Wechsel. Die Oberfläche
 * kennt nur dieses Interface, deshalb ist der Wechsel eine Datei.
 */
export interface StorageAdapter {
  load(): Promise<Progress>
  save(p: Progress): Promise<void>
}

const KEY = 'gf-lernapp-progress-v1'

export const localStorageAdapter: StorageAdapter = {
  async load() {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return emptyProgress()
      const parsed = JSON.parse(raw) as Progress
      if (parsed.version !== 1) return emptyProgress()
      return { ...emptyProgress(), ...parsed }
    } catch {
      // Privater Modus, gesperrte Site-Daten, beschädigter Eintrag: neu anfangen
      // ist besser als eine weisse Seite.
      return emptyProgress()
    }
  },
  async save(p) {
    try {
      localStorage.setItem(KEY, JSON.stringify(p))
    } catch {
      /* Speichern darf das Lernen nie blockieren. */
    }
  },
}

/** Ergebnis einer einzelnen Antwort einarbeiten. */
export function applyAnswer(
  progress: Progress,
  itemId: string,
  correct: boolean,
  xp: number,
  now: Date = new Date(),
): Progress {
  const day = today(now)
  const next: ItemProgress = review(progress.items[itemId], itemId, correct, now)
  return {
    ...progress,
    xp: progress.xp + xp,
    xpByDay: { ...progress.xpByDay, [day]: (progress.xpByDay[day] ?? 0) + xp },
    items: { ...progress.items, [itemId]: next },
  }
}

/** Lektion abschliessen: Bonus, Serie, Lektionszähler. */
export function completeLesson(
  progress: Progress,
  unitId: string | null,
  bonusXp: number,
  now: Date = new Date(),
): Progress {
  const day = today(now)
  const withXp: Progress = {
    ...progress,
    xp: progress.xp + bonusXp,
    xpByDay: { ...progress.xpByDay, [day]: (progress.xpByDay[day] ?? 0) + bonusXp },
    unitsCompleted: unitId
      ? { ...progress.unitsCompleted, [unitId]: (progress.unitsCompleted[unitId] ?? 0) + 1 }
      : progress.unitsCompleted,
  }
  return bumpStreak(withXp, now)
}

export const xpToday = (p: Progress, now: Date = new Date()) => p.xpByDay[today(now)] ?? 0

/** Level allein zur Anerkennung — 100 XP je Stufe, ohne Deckel. */
export const levelFromXp = (xp: number) => Math.floor(xp / 100) + 1
export const xpIntoLevel = (xp: number) => xp % 100
