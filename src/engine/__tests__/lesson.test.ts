import { describe, expect, it } from 'vitest'
import { buildLesson, hasLessonToday, interleave } from '../lesson'
import { emptyProgress } from '../progress'
import { review } from '../srs'
import { items, modules, units, itemsInModule, itemsInUnit } from '../../data'
import type { Item } from '../types'

/** Reproduzierbarer Zufall für stabile Tests. */
const seeded = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}

describe('Lektionsaufbau', () => {
  it('nimmt bei einer Unit-Lektion die Unit vollständig und bleibt im Modul', () => {
    const lesson = buildLesson({
      items,
      progress: emptyProgress(),
      mode: 'unit',
      unitId: 'm2-u3',
      random: seeded(1),
    })
    expect(lesson.length).toBeGreaterThan(0)
    for (const i of lesson) expect(i.moduleId).toBe('m2-regelung')
    // Die gewählte Lektion ist vollständig drin, das Auffüllen kommt danach.
    for (const own of itemsInUnit('m2-u3')) {
      expect(
        lesson.some((i) => i.id === own.id),
        `${own.id} fehlt in seiner eigenen Lektion`,
      ).toBe(true)
    }
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
    // Zehn Aufgaben fällig, der ganze Rest des Kurses neu.
    for (const i of items.slice(0, 10)) {
      progress.items[i.id] = review(undefined, i.id, true, new Date(2020, 0, 1))
    }
    const lesson = buildLesson({ items, progress, mode: 'daily', size: 4, random: seeded(3) })
    expect(lesson.length).toBe(4)
    const wiederholungen = lesson.filter((i) => progress.items[i.id]).length
    expect(wiederholungen).toBeLessThanOrEqual(2)
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

  it('lässt eine durchgelernte Lektion freiwillig üben', () => {
    const progress = emptyProgress()
    // Alles auf höchste Box, zuletzt vor Jahren: nichts neu, nichts fällig.
    for (const i of items) {
      let p = review(undefined, i.id, true, new Date(2020, 0, 1))
      for (let n = 0; n < 6; n++) p = review(p, i.id, true, new Date(2020, 0, 1))
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

  it('stellt eine heute richtig beantwortete Frage nicht nochmal', () => {
    // Der gemeldete Fehler: eine Frage kam viermal an einem Tag, obwohl sie
    // von Anfang an richtig war. Ursache war das Auffüllen aus dem Modul,
    // das weder Fälligkeit noch den heutigen Tag beachtet hat. Sichtbar
    // wurde es, sobald ein Modul fast durchgelernt war – dann reichte das
    // neue Material nicht mehr für acht Aufgaben.
    const now = new Date(2026, 8, 8, 18, 0)
    const progress = emptyProgress()
    for (const i of itemsInModule('m9-wohnungswirtschaft')) {
      if (i.unitId === 'm9-u6') continue
      progress.items[i.id] = review(undefined, i.id, true, now)
    }

    // Keine Lektion des Moduls darf sie nachliefern – auch nicht die eigene.
    for (const unit of new Set(itemsInModule('m9-wohnungswirtschaft').map((i) => i.unitId))) {
      const lesson = buildLesson({
        items,
        progress,
        mode: 'unit',
        unitId: unit,
        now,
        random: seeded(11),
      })
      for (const i of lesson) {
        expect(progress.items[i.id], `${i.id} war heute schon dran`).toBeUndefined()
      }
    }
  })

  it('ist mit einem heute abgearbeiteten Modul für heute fertig', () => {
    const now = new Date(2026, 8, 8, 18, 0)
    const progress = emptyProgress()
    for (const i of itemsInModule('m9-wohnungswirtschaft')) {
      progress.items[i.id] = review(undefined, i.id, true, now)
    }
    const req = { items, progress, mode: 'unit' as const, unitId: 'm9-u1', now }
    expect(buildLesson({ ...req, random: seeded(12) })).toEqual([])
    expect(hasLessonToday(req)).toBe(false)
  })

  it('bringt eine falsch beantwortete Frage am selben Tag zurück', () => {
    // Box 0 heisst "heute nochmal" – das ist die einzige Ausnahme.
    const now = new Date(2026, 8, 8, 18, 0)
    const progress = emptyProgress()
    for (const i of itemsInModule('m9-wohnungswirtschaft')) {
      progress.items[i.id] = review(undefined, i.id, true, now)
    }
    const target = itemsInUnit('m9-u1')[0]
    progress.items[target.id] = review(undefined, target.id, false, now)

    const lesson = buildLesson({
      items,
      progress,
      mode: 'unit',
      unitId: 'm9-u1',
      now,
      random: seeded(13),
    })
    expect(lesson.map((i) => i.id)).toEqual([target.id])
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
