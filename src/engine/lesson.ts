import type { Item, Progress, ModuleId } from './types'
import { isDue, today } from './srs'

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
  /** Für reproduzierbare Tests. */
  now?: Date
}

/**
 * Eine Lektion ist kurz und gemischt.
 *
 * Drei Entscheidungen, die den Lerneffekt tragen:
 * 1. **Interleaving** — Aufgabentypen wechseln sich ab, statt fünf
 *    Multiple-Choice in Folge. Gemischtes Üben schneidet in der
 *    Lernforschung durchweg besser ab als blockweises, auch wenn es sich
 *    beim Üben *schlechter* anfühlt.
 * 2. **Wiederholung zuerst** — fällige Items kommen vor neuen. Wer neues
 *    Material auf ein wackliges Fundament stapelt, verliert beides.
 * 3. **Nichts zweimal am selben Tag** — was heute richtig beantwortet
 *    wurde, ist heute erledigt. Der Abstand ist der Wirkstoff der
 *    verteilten Wiederholung; eine sofortige Zweitabfrage bringt nichts
 *    und wirkt wie ein Fehler in der App. Aufgefüllt wird deshalb nur mit
 *    neuem Material, sonst bleibt die Lektion kurz.
 */
export const DEFAULT_LESSON_SIZE = 8

export function buildLesson(req: LessonRequest): Item[] {
  const { items, progress, mode, unitId, moduleId } = req
  const size = req.size ?? DEFAULT_LESSON_SIZE
  const rnd = req.random ?? Math.random

  const now = req.now ?? new Date()
  const day = today(now)

  // Bei einer Lektions-Auswahl zählt die Lektion selbst. Sie hat oft nur
  // drei bis sechs Aufgaben — der Lehrplan gibt die Gliederung vor, nicht
  // die Lektionsgrösse.
  const core = items.filter((i) => {
    if (mode === 'unit') return i.unitId === unitId
    if (moduleId) return i.moduleId === moduleId
    return true
  })

  const seen = (i: Item) => progress.items[i.id]

  // Heute schon gekonnt heisst heute nicht mehr. Ausnahme ist Box 0: eine
  // falsche Antwort soll am selben Tag korrigiert werden, genau dafür ist
  // die Box da.
  const settledToday = (i: Item) => {
    const p = seen(i)
    return !!p && p.lastSeenAt === day && p.box > 0
  }

  const due = core.filter((i) => {
    const p = seen(i)
    return p && isDue(p, now) && !settledToday(i)
  })
  const fresh = core.filter((i) => !seen(i))

  if (mode === 'review') return shuffle(due, rnd).slice(0, size)

  // Höchstens die Hälfte einer Lektion ist Wiederholung — sonst kommt man
  // im Lernpfad nie voran und die App fühlt sich wie eine Prüfung an.
  const reviewSlots = Math.min(due.length, Math.floor(size / 2))
  const picked = [
    ...shuffle(due, rnd).slice(0, reviewSlots),
    ...byLevel(fresh).slice(0, size - reviewSlots),
  ]

  // Freie Plätze zuerst mit weiteren fälligen Aufgaben der Lektion füllen.
  if (picked.length < size) {
    const rest = shuffle(
      due.filter((i) => !picked.includes(i)),
      rnd,
    )
    picked.push(...rest.slice(0, size - picked.length))
  }

  // Reicht das nicht, kommt *neues* Material aus dem umgebenden Modul dazu.
  // Nur nie gesehenes: hier stand vorher "irgendetwas aus dem Modul", und
  // dadurch kam eine Frage mehrfach am Tag, obwohl sie längst gekonnt war.
  if (picked.length < size && mode === 'unit') {
    const unitModule = items.find((i) => i.unitId === unitId)?.moduleId
    const nearby = byLevel(
      items.filter((i) => i.moduleId === unitModule && !seen(i) && !picked.includes(i)),
    )
    picked.push(...nearby.slice(0, size - picked.length))
  }

  // Ist alles gelernt und nichts fällig, ist freiwilliges Üben trotzdem
  // sinnvoll: wer eine Lektion antippt, will sie üben. Nur nichts, was
  // heute schon dran war.
  if (picked.length === 0) {
    const practice = shuffle(
      core.filter((i) => seen(i)?.lastSeenAt !== day),
      rnd,
    )
    picked.push(...practice.slice(0, size))
  }

  return interleave(picked, rnd)
}

/** Hat diese Auswahl heute überhaupt noch Aufgaben? */
export function hasLessonToday(req: LessonRequest): boolean {
  return buildLesson(req).length > 0
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
