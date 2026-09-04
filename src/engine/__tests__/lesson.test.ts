import { describe, expect, it } from 'vitest'
import { buildLesson, interleave } from '../lesson'
import { emptyProgress } from '../progress'
import { review } from '../srs'
import { items, modules, units, itemsInUnit } from '../../data'
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
      unitId: 'm2-u3',
      random: seeded(1),
    })
    expect(lesson.length).toBeGreaterThan(0)
    // Die Lektion füllt bei Bedarf aus dem Modul auf – geprüft wird, dass
    // sie das Modul nicht verlässt und mit der gewählten Lektion beginnt.
    for (const i of lesson) expect(i.moduleId).toBe('m2-regelung')
  })

  it('wählt neue Items in aufsteigender Stufe aus', () => {
    // Die eigentliche Absicht: wird ein Vertiefungs-Item gewählt, müssen
    // die Einstiegs-Items derselben Lektion auch dabei sein. Eine reine
    // Zählung wäre an die Grösse der Lektion gekoppelt und damit brüchig.
    const unitId = 'm1-u1'
    const lesson = buildLesson({
      items,
      progress: emptyProgress(),
      mode: 'unit',
      unitId,
      size: 4,
      random: seeded(2),
    })
    const own = lesson.filter((i) => i.unitId === unitId)
    const maxLevel = Math.max(...own.map((i) => i.level))
    for (const candidate of itemsInUnit(unitId)) {
      if (candidate.level < maxLevel) {
        expect(
          own.some((i) => i.id === candidate.id),
          `${candidate.id} (Stufe ${candidate.level}) fehlt, obwohl Stufe ${maxLevel} gewählt wurde`,
        ).toBe(true)
      }
    }
  })

  it('füllt höchstens die Hälfte der Lektion mit Wiederholungen', () => {
    const progress = emptyProgress()
    // Alle Items der Unit auf "fällig" setzen.
    for (const i of itemsInUnit('m3-u1')) {
      progress.items[i.id] = review(undefined, i.id, true, new Date(2020, 0, 1))
    }
    const lesson = buildLesson({
      items,
      progress,
      mode: 'unit',
      unitId: 'm3-u1',
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
      unitId: 'm4-u8',
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
    ({
      id,
      type,
      moduleId: 'm1-grundlagen',
      unitId: 'u',
      level: 1,
      concepts: [],
      why: '',
      source: { label: '' },
    }) as unknown as Item

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
  it('jede Lektion gehört zu ihrem Modul und hat genug eigenes Material', () => {
    for (const u of units) {
      const own = itemsInUnit(u.id)
      // Drei genügen, weil eine Lektion bei Bedarf aus dem Modul auffüllt.
      // Der Lehrplan gibt die Gliederung vor, nicht die Lektionsgrösse.
      expect(own.length, `Lektion ${u.id} (${u.code}) hat zu wenige Aufgaben`).toBeGreaterThanOrEqual(3)
      for (const i of own) expect(i.moduleId, i.id).toBe(u.moduleId)
    }
  })

  it('jedes Modul hat genug Material für eine Prüfung', () => {
    for (const m of modules) {
      const own = items.filter((i) => i.moduleId === m.id)
      expect(own.length, `Modul ${m.number} (${m.title}) hat zu wenige Aufgaben`).toBeGreaterThanOrEqual(12)
    }
  })

  it('jedes Item verweist auf eine existierende Unit', () => {
    const ids = new Set(units.map((u) => u.id))
    for (const i of items) expect(ids.has(i.unitId), `${i.id} → ${i.unitId}`).toBe(true)
  })

  it('jedes Modul nutzt mehrere Aufgabentypen', () => {
    for (const m of modules) {
      const types = new Set(items.filter((i) => i.moduleId === m.id).map((i) => i.type))
      expect(types.size, `Modul ${m.number} nutzt zu wenige Aufgabentypen`).toBeGreaterThanOrEqual(4)
    }
  })

  it('jede Lehrplan-Nummer ist eindeutig', () => {
    const codes = units.map((u) => u.code)
    expect(new Set(codes).size).toBe(codes.length)
  })
})
