import { describe, expect, it } from 'vitest'
import { SCHEMATICS, SCHEMATIC_DIAGRAMS } from '../../components/Schematic'
import type { Part } from '../../components/Schematic'
import { items } from '../../data'

describe('Anlagenschemata', () => {
  it('jede Klick-Aufgabe verweist auf ein Bauteil, das im Schema existiert', () => {
    for (const i of items) {
      if (i.type !== 'hotspot') continue
      const parts = SCHEMATICS[i.schematic]
      expect(parts, `Schema ${i.schematic} fehlt (${i.id})`).toBeDefined()
      const ids = parts.map((p) => p.id)
      expect(ids, `${i.id} sucht "${i.answer}" in ${i.schematic}`).toContain(i.answer)
      // Ein Schema mit nur einem Bauteil wäre keine Aufgabe.
      expect(parts.length, `Schema ${i.schematic} hat zu wenige Bauteile`).toBeGreaterThan(3)
    }
  })

  it('jedes Schema wird von mindestens einer Aufgabe genutzt', () => {
    const used = new Set(items.filter((i) => i.type === 'hotspot').map((i) => i.schematic))
    for (const key of Object.keys(SCHEMATICS)) {
      expect(used.has(key as never), `Schema "${key}" wird von keiner Aufgabe genutzt`).toBe(true)
    }
  })

  it('Bauteil-IDs sind je Schema eindeutig und Flächen liegen im Bild', () => {
    for (const [name, parts] of Object.entries(SCHEMATICS)) {
      const ids = parts.map((p) => p.id)
      expect(new Set(ids).size, `doppelte IDs in ${name}`).toBe(ids.length)
      for (const p of parts) {
        expect(p.x + p.w, `${name}/${p.id} ragt rechts heraus`).toBeLessThanOrEqual(440)
        expect(p.y + p.h, `${name}/${p.id} ragt unten heraus`).toBeLessThanOrEqual(250)
        expect(p.x, `${name}/${p.id} ragt links heraus`).toBeGreaterThanOrEqual(0)
        expect(p.y, `${name}/${p.id} ragt oben heraus`).toBeGreaterThanOrEqual(12)
      }
    }
  })
})

/**
 * Verbindungsleitungen.
 *
 * Hintergrund: im Gaskessel-Schema setzte der Heizkreis-Vorlauf 22 px über
 * dem Verteiler an und hing damit sichtbar im Leeren. Der Fehler war im
 * Code nicht zu sehen — nur im gerenderten Bild. Diese Prüfungen machen
 * ihn im Test sichtbar: jedes Leitungsende muss entweder ein Bauteil
 * berühren oder ein Knick sein, an dem eine weitere Leitung ansetzt.
 */
describe('Verbindungsleitungen', () => {
  /** Liegt der Punkt auf dem Rand des Kastens? */
  const onEdge = (px: number, py: number, p: Part) => {
    const onVertical = (px === p.x || px === p.x + p.w) && py >= p.y && py <= p.y + p.h
    const onHorizontal = (py === p.y || py === p.y + p.h) && px >= p.x && px <= p.x + p.w
    return onVertical || onHorizontal
  }

  it('jedes Leitungsende berührt ein Bauteil oder ist ein Knick', () => {
    for (const [name, { parts, connectors }] of Object.entries(SCHEMATIC_DIAGRAMS)) {
      const endpoints = connectors.flatMap(([x1, y1, x2, y2]) => [
        [x1, y1],
        [x2, y2],
      ])
      // Ein Punkt, an dem sich zwei Leitungen treffen, ist ein Knick.
      const count = new Map<string, number>()
      for (const [x, y] of endpoints) {
        const k = `${x},${y}`
        count.set(k, (count.get(k) ?? 0) + 1)
      }

      for (const [x, y] of endpoints) {
        const touches = parts.some((p) => onEdge(x, y, p))
        const isElbow = (count.get(`${x},${y}`) ?? 0) > 1
        expect(
          touches || isElbow,
          `${name}: Leitungsende (${x}, ${y}) hängt im Leeren – berührt kein Bauteil und ist kein Knick`,
        ).toBe(true)
      }
    }
  })

  it('jede Leitung ist waagerecht oder senkrecht und hat Länge', () => {
    for (const [name, { connectors }] of Object.entries(SCHEMATIC_DIAGRAMS)) {
      for (const [x1, y1, x2, y2] of connectors) {
        const axisAligned = x1 === x2 || y1 === y2
        expect(axisAligned, `${name}: Leitung (${x1},${y1})→(${x2},${y2}) läuft schräg`).toBe(true)
        expect(
          x1 !== x2 || y1 !== y2,
          `${name}: Leitung (${x1},${y1}) hat keine Länge`,
        ).toBe(true)
      }
    }
  })

  it('jedes Bauteil hängt am Schema – keine freistehenden Kästen', () => {
    for (const [name, { parts, connectors }] of Object.entries(SCHEMATIC_DIAGRAMS)) {
      for (const p of parts) {
        const connected = connectors.some(
          ([x1, y1, x2, y2]) => onEdge(x1, y1, p) || onEdge(x2, y2, p),
        )
        expect(connected, `${name}: Bauteil "${p.id}" ist an nichts angebunden`).toBe(true)
      }
    }
  })

  it('Bauteile überlappen sich nicht', () => {
    for (const [name, { parts }] of Object.entries(SCHEMATIC_DIAGRAMS)) {
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i]
          const b = parts[j]
          const overlap =
            a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
          expect(overlap, `${name}: "${a.id}" und "${b.id}" überlappen sich`).toBe(false)
        }
      }
    }
  })
})
