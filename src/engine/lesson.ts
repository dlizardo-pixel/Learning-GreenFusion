import type { Item, Progress, ModuleId } from './types'
import { isDue } from './srs'

export type LessonMode = 'unit' | 'daily' | 'review'

export interface LessonRequest {
  items: Item[]
  progress: Progress
  mode: LessonMode
  unitId?: string
  moduleId?: ModuleId
  size?: number
  /** Für reproduzierbare Tests. */
  random?: () => number
}

/**
 * Eine Lektion ist kurz und gemischt.
 *
 * Zwei Entscheidungen, die den Lerneffekt tragen:
 * 1. **Interleaving** — Aufgabentypen wechseln sich ab, statt fünf
 *    Multiple-Choice in Folge. Gemischtes Üben schneidet in der
 *    Lernforschung durchweg besser ab als blockweises, auch wenn es sich
 *    beim Üben *schlechter* anfühlt.
 * 2. **Wiederholung zuerst** — fällige Items kommen vor neuen. Wer neues
 *    Material auf ein wackliges Fundament stapelt, verliert beides.
 */
export const DEFAULT_LESSON_SIZE = 8

export function buildLesson(req: LessonRequest): Item[] {
  const { items, progress, mode, unitId, moduleId } = req
  const size = req.size ?? DEFAULT_LESSON_SIZE
  const rnd = req.random ?? Math.random

  // Bei einer Lektions-Auswahl zählt die Lektion selbst; reicht ihr Material
  // nicht für eine volle Lektion, wird aus dem umgebenden Modul aufgefüllt.
  // Das ist besser, als Lektionen künstlich gross zu schneiden — der
  // Lehrplan gibt die Gliederung vor, nicht die Lektionsgrösse.
  const unitModule = unitId ? items.find((i) => i.unitId === unitId)?.moduleId : undefined
  const scope = items.filter((i) => {
    if (mode === 'unit') return i.unitId === unitId || i.moduleId === unitModule
    if (moduleId) return i.moduleId === moduleId
    return true
  })
  const inUnit = (i: Item) => i.unitId === unitId

  const seen = (i: Item) => progress.items[i.id]
  const due = scope.filter((i) => {
    const p = seen(i)
    return p && isDue(p)
  })
  const fresh = scope.filter((i) => !seen(i))

  if (mode === 'review') return shuffle(due, rnd).slice(0, size)

  // Höchstens die Hälfte einer Lektion ist Wiederholung — sonst kommt man
  // im Lernpfad nie voran und die App fühlt sich wie eine Prüfung an.
  const reviewSlots = Math.min(due.length, Math.floor(size / 2))
  // Neues Material zuerst aus der gewählten Lektion, dann aus dem Modul.
  const freshOrdered =
    mode === 'unit'
      ? [...byLevel(fresh.filter(inUnit)), ...byLevel(fresh.filter((i) => !inUnit(i)))]
      : byLevel(fresh)
  const picked = [
    ...shuffle(due.filter((i) => mode !== 'unit' || inUnit(i)), rnd).slice(0, reviewSlots),
    ...freshOrdered.slice(0, size - reviewSlots),
  ]

  // Falls der Kurs noch keine neuen Items mehr hat, mit bereits Gelerntem
  // auffüllen, damit eine Lektion immer vollständig ist.
  if (picked.length < size) {
    const rest = shuffle(
      scope.filter((i) => !picked.includes(i)),
      rnd,
    )
    picked.push(...rest.slice(0, size - picked.length))
  }

  return interleave(picked, rnd)
}

/** Neue Items in didaktischer Reihenfolge: Einstieg vor Vertiefung. */
function byLevel(items: Item[]): Item[] {
  return [...items].sort((a, b) => a.level - b.level)
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Gleiche Aufgabentypen auseinanderziehen. Lange Aufgaben (Lesetext,
 * Zuordnung) landen nie direkt hintereinander und nie an erster Stelle —
 * eine Lektion soll mit einem schnellen Erfolg beginnen.
 */
export function interleave(items: Item[], rnd: () => number = Math.random): Item[] {
  const heavy = new Set(['readSummarize', 'match', 'order'])
  const pool = shuffle(items, rnd)
  const out: Item[] = []

  while (pool.length) {
    const prev = out[out.length - 1]
    const idx = pool.findIndex(
      (i) =>
        (!prev || i.type !== prev.type) &&
        !(out.length === 0 && heavy.has(i.type)) &&
        !(prev && heavy.has(i.type) && heavy.has(prev.type)),
    )
    out.push(...pool.splice(idx === -1 ? 0 : idx, 1))
  }
  return out
}
