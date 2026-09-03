import { describe, expect, it } from 'vitest'
import { SCHEMATICS } from '../../components/Schematic'
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
