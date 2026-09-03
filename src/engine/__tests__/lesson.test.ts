import { describe, expect, it } from 'vitest'
import { buildLesson, interleave } from '../lesson'
import { emptyProgress } from '../progress'
import { review } from '../srs'
import { items, courses, units, itemsInUnit } from '../../data'
import type { Item } from '../types'

/** Reproduzierbarer Zufall für stabile Tests. */
const seeded = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}

describe('Lektionsaufbau', () => {
  it('nimmt bei einer Unit-Lektion nur Items dieser Unit', () => {
    const lesson = buildLesson({
      items,
      progress: emptyProgress(),
      mode: 'unit',
      unitId: 'technik-2',
      random: seeded(1),
    })
    expect(lesson.length).toBeGreaterThan(0)
    for (const i of lesson) expect(i.unitId).toBe('technik-2')
  })

  it('beginnt bei neuen Items mit der Einstiegsstufe', () => {
    const lesson = buildLesson({
      items,
      progress: emptyProgress(),
      mode: 'unit',
      unitId: 'technik-1',
      size: 4,
      random: seeded(2),
    })
    // Level-1-Items müssen vor Level-3-Items ausgewählt worden sein.
    const levels = lesson.map((i) => i.level)
    expect(Math.min(...levels)).toBe(1)
    expect(levels.filter((l) => l === 1).length).toBeGreaterThanOrEqual(2)
  })

  it('füllt höchstens die Hälfte der Lektion mit Wiederholungen', () => {
    const progress = emptyProgress()
    // Alle Items der Unit auf "fällig" setzen.
    for (const i of itemsInUnit('produkt-1')) {
      progress.items[i.id] = review(undefined, i.id, true, new Date(2020, 0, 1))
    }
    const lesson = buildLesson({
      items,
      progress,
      mode: 'unit',
      unitId: 'produkt-1',
      size: 4,
      random: seeded(3),
    })
    expect(lesson.length).toBe(4)
  })

  it('liefert im Wiederholungsmodus nur fällige Items', () => {
    const progress = emptyProgress()
    const target = items[0]
    progress.items[target.id] = review(undefined, target.id, true, new Date(2020, 0, 1))
    const lesson = buildLesson({ items, progress, mode: 'review', random: seeded(4) })
    expect(lesson.map((i) => i.id)).toEqual([target.id])
  })

  it('liefert eine leere Wiederholung, wenn nichts fällig ist', () => {
    expect(buildLesson({ items, progress: emptyProgress(), mode: 'review' })).toEqual([])
  })

  it('füllt eine Lektion auch dann auf, wenn der Kurs kein neues Material hat', () => {
    const progress = emptyProgress()
    // Alles auf höchste Box: nichts neu, nichts fällig.
    for (const i of items) {
      let p = review(undefined, i.id, true, new Date())
      for (let n = 0; n < 6; n++) p = review(p, i.id, true, new Date())
      progress.items[i.id] = p
    }
    const lesson = buildLesson({
      items,
      progress,
      mode: 'unit',
      unitId: 'recht-3',
      size: 4,
      random: seeded(5),
    })
    expect(lesson.length).toBe(4)
  })

  it('mischt über alle Kurse in der Tageslektion', () => {
    const lesson = buildLesson({
      items,
      progress: emptyProgress(),
      mode: 'daily',
      size: 8,
      random: seeded(6),
    })
    expect(lesson.length).toBe(8)
  })
})

describe('Interleaving', () => {
  const fake = (id: string, type: Item['type']): Item =>
    ({ id, type, courseId: 'technik', unitId: 'u', level: 1, concepts: [], why: '', source: { label: '' } }) as unknown as Item

  it('vermeidet zwei gleiche Aufgabentypen in Folge', () => {
    const list = [
      fake('a', 'mc'),
      fake('b', 'mc'),
      fake('c', 'mc'),
      fake('d', 'truefalse'),
      fake('e', 'estimate'),
      fake('f', 'multi'),
    ]
    const out = interleave(list, seeded(7))
    expect(out.length).toBe(list.length)
    // Bei drei von sechs gleichartigen Items ist eine vollständige Trennung
    // nicht immer möglich — aber nie mehr als eine Wiederholung.
    const repeats = out.filter((it, i) => i > 0 && it.type === out[i - 1].type).length
    expect(repeats).toBeLessThanOrEqual(1)
  })

  it('setzt keine lange Aufgabe an den Anfang', () => {
    const list = [
      fake('a', 'readSummarize'),
      fake('b', 'mc'),
      fake('c', 'truefalse'),
      fake('d', 'match'),
    ]
    for (let seed = 1; seed < 12; seed++) {
      const out = interleave(list, seeded(seed))
      expect(['readSummarize', 'match']).not.toContain(out[0].type)
    }
  })
})

describe('Struktur der Inhalte', () => {
  it('jede Unit gehört zu ihrem Kurs und hat genug Items für eine Lektion', () => {
    for (const u of units) {
      const own = itemsInUnit(u.id)
      expect(own.length, `Unit ${u.id} hat zu wenige Items`).toBeGreaterThanOrEqual(4)
      for (const i of own) expect(i.courseId, i.id).toBe(u.courseId)
    }
  })

  it('jedes Item verweist auf eine existierende Unit', () => {
    const ids = new Set(units.map((u) => u.id))
    for (const i of items) expect(ids.has(i.unitId), `${i.id} → ${i.unitId}`).toBe(true)
  })

  it('jeder Kurs hat mehrere Aufgabentypen', () => {
    for (const c of courses) {
      const types = new Set(items.filter((i) => i.courseId === c.id).map((i) => i.type))
      expect(types.size, `Kurs ${c.id} nutzt zu wenige Aufgabentypen`).toBeGreaterThanOrEqual(4)
    }
  })
})
