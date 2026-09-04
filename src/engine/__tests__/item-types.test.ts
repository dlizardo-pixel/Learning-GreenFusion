import { describe, expect, it } from 'vitest'
import { grade } from '../grade'
import { items } from '../../data'
import type { BucketsItem, CardItem, DialogueItem } from '../types'

const allOf = <T>(type: string) => items.filter((i) => i.type === type) as unknown as T[]

describe('Einsortier-Aufgaben', () => {
  const all = allOf<BucketsItem>('buckets')

  it('es gibt welche', () => {
    expect(all.length).toBeGreaterThan(2)
  })

  it('jeder Begriff zeigt auf einen existierenden Korb', () => {
    for (const i of all) {
      const ids = new Set(i.buckets.map((b) => b.id))
      for (const e of i.entries) {
        expect(ids.has(e.bucketId), `${i.id}: Korb "${e.bucketId}" gibt es nicht`).toBe(true)
      }
    }
  })

  it('jeder Korb wird mindestens einmal gebraucht', () => {
    // Ein leerer Korb ist ein Ablenker, der nie stimmt – das frustriert,
    // ohne etwas zu prüfen.
    for (const i of all) {
      for (const b of i.buckets) {
        expect(
          i.entries.some((e) => e.bucketId === b.id),
          `${i.id}: Korb "${b.label}" bleibt immer leer`,
        ).toBe(true)
      }
    }
  })

  it('Begriffe sind eindeutig und es gibt mehr als einen Korb', () => {
    for (const i of all) {
      const texts = i.entries.map((e) => e.text)
      expect(new Set(texts).size, `${i.id}: doppelter Begriff`).toBe(texts.length)
      expect(i.buckets.length, `${i.id}: braucht mindestens zwei Körbe`).toBeGreaterThan(1)
    }
  })

  it('wird korrekt bewertet, inklusive Teilpunkten', () => {
    const i = all[0]
    const richtig = Object.fromEntries(i.entries.map((e) => [e.text, e.bucketId]))
    expect(grade(i, { value: richtig }).correct).toBe(true)

    const falsch = { ...richtig }
    const anderer = i.buckets.find((b) => b.id !== i.entries[0].bucketId)!
    falsch[i.entries[0].text] = anderer.id
    const g = grade(i, { value: falsch })
    expect(g.correct).toBe(false)
    expect(g.score).toBeCloseTo((i.entries.length - 1) / i.entries.length)
  })
})

describe('Karten-Aufgaben', () => {
  const all = allOf<CardItem>('card')

  it('es gibt welche', () => {
    expect(all.length).toBeGreaterThan(2)
  })

  it('jede Karte hat Fakten, gültige Antwort und Feedback je Option', () => {
    for (const i of all) {
      expect(i.cardFacts.length, `${i.id}: braucht Fakten auf der Karte`).toBeGreaterThan(1)
      expect(i.cardTitle.length).toBeGreaterThan(3)
      expect(i.answer).toBeGreaterThanOrEqual(0)
      expect(i.answer).toBeLessThan(i.options.length)
      expect(i.optionFeedback.length, `${i.id}: Feedback fehlt`).toBe(i.options.length)
      for (const f of i.optionFeedback) expect(f.length, `${i.id}: leeres Feedback`).toBeGreaterThan(10)
    }
  })

  it('wird wie eine Einfachauswahl bewertet', () => {
    const i = all[0]
    expect(grade(i, { value: i.answer }).correct).toBe(true)
    expect(grade(i, { value: (i.answer + 1) % i.options.length }).correct).toBe(false)
  })
})

describe('Gesprächssimulationen', () => {
  const all = allOf<DialogueItem>('dialogue')

  it('es gibt welche', () => {
    expect(all.length).toBeGreaterThan(2)
  })

  it('jeder Zug ist vollständig', () => {
    for (const i of all) {
      expect(i.turns.length, `${i.id}: ein Gespräch braucht mehrere Züge`).toBeGreaterThan(1)
      expect(i.situation.length, `${i.id}: Vorspann fehlt`).toBeGreaterThan(40)
      for (const [n, t] of i.turns.entries()) {
        expect(t.options.length, `${i.id} Zug ${n}: zu wenige Optionen`).toBeGreaterThan(2)
        expect(t.answer).toBeGreaterThanOrEqual(0)
        expect(t.answer).toBeLessThan(t.options.length)
        expect(t.optionFeedback.length, `${i.id} Zug ${n}: Feedback je Option fehlt`).toBe(
          t.options.length,
        )
        expect(t.reaction.length, `${i.id} Zug ${n}: Reaktion fehlt`).toBeGreaterThan(10)
        expect(t.says.length).toBeGreaterThan(10)
      }
      expect(i.passRatio).toBeGreaterThan(0)
      expect(i.passRatio).toBeLessThanOrEqual(1)
    }
  })

  it('bewertet nach Anteil guter Züge und respektiert die Bestehensgrenze', () => {
    for (const i of all) {
      const alleRichtig = i.turns.map((t) => t.answer)
      expect(grade(i, { value: alleRichtig }).score).toBe(1)
      expect(grade(i, { value: alleRichtig }).correct).toBe(true)

      const alleFalsch = i.turns.map((t) => (t.answer + 1) % t.options.length)
      const g = grade(i, { value: alleFalsch })
      expect(g.score).toBe(0)
      expect(g.correct).toBe(false)
      // Die Rückmeldung nennt, was an den schlechten Zügen falsch war.
      expect(g.detail?.length).toBe(i.turns.length)
    }
  })

  it('ist nicht mit einem Zug bestehbar, wenn mehrere Züge nötig sind', () => {
    for (const i of all) {
      const einerRichtig = i.turns.map((t, n) => (n === 0 ? t.answer : (t.answer + 1) % t.options.length))
      expect(grade(i, { value: einerRichtig }).correct, i.id).toBe(false)
    }
  })
})
