import type { Item } from '../../engine/types'
import type { Grade } from '../../engine/grade'

export interface ExerciseProps<I extends Item = Item> {
  item: I
  /** Aktuelle Eingabe. Form je Aufgabentyp — siehe engine/grade.ts */
  value: unknown
  onChange(v: unknown): void
  /** true = Antwort wurde geprüft, Lösung wird gezeigt, Eingaben gesperrt. */
  revealed: boolean
  grade?: Grade
}

/** Beschriftung des Aufgabentyps – gibt Orientierung, was erwartet wird. */
export const TYPE_HINT: Record<Item['type'], string> = {
  mc: 'Eine Antwort',
  multi: 'Mehrere Antworten',
  truefalse: 'Stimmt das?',
  cloze: 'Lücken füllen',
  match: 'Zuordnen',
  order: 'In die richtige Reihenfolge',
  hotspot: 'Im Schema anklicken',
  estimate: 'Schätzen',
  scenario: 'Aus dem Kundengespräch',
  readSummarize: 'Lesen & zusammenfassen',
}

/** Ist genug eingegeben, um "Prüfen" freizugeben? */
export function hasInput(item: Item, value: unknown): boolean {
  switch (item.type) {
    case 'mc':
    case 'scenario':
    case 'hotspot':
      return value !== null && value !== undefined
    case 'truefalse':
      return typeof value === 'boolean'
    case 'multi':
      return Array.isArray(value) && value.length > 0
    case 'cloze':
      return Array.isArray(value) && (value as string[]).filter(Boolean).length === item.blanks.length
    case 'match':
      return Object.keys((value as Record<string, string>) ?? {}).length === item.pairs.length
    case 'order':
      return Array.isArray(value) && (value as string[]).length === item.steps.length
    case 'estimate':
      return typeof value === 'number'
    case 'readSummarize':
      return typeof value === 'string' && value.trim().length > 0
  }
}

/** Startwert je Aufgabentyp. */
export function initialValue(item: Item): unknown {
  switch (item.type) {
    case 'multi':
      return []
    case 'cloze':
      return Array(item.blanks.length).fill('')
    case 'match':
      return {}
    case 'order':
      // Gemischt starten, aber nie in der Lösungsreihenfolge.
      return shuffleNotIdentity(item.steps)
    case 'estimate':
      return Math.round((item.min + item.max) / 2 / item.step) * item.step
    case 'readSummarize':
      return ''
    default:
      return null
  }
}

function shuffleNotIdentity(steps: string[]): string[] {
  if (steps.length < 2) return [...steps]
  for (let attempt = 0; attempt < 20; attempt++) {
    const a = [...steps]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    if (a.some((s, i) => s !== steps[i])) return a
  }
  return [...steps].reverse()
}

export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
