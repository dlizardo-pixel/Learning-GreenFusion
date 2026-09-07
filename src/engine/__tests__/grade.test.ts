import { describe, expect, it } from 'vitest'
import { grade, gradeSummary } from '../grade'
import { items, itemById } from '../../data'
import type { MatchItem, MultiSelectItem, ClozeItem, EstimateItem, OrderItem } from '../types'

const get = <T>(id: string) => itemById.get(id) as unknown as T

describe('Bewertung je Aufgabentyp', () => {
  it('Einfachauswahl', () => {
    const item = get<never>('t2-heizkurve-was')
    expect(grade(item, { value: 0 }).correct).toBe(true)
    expect(grade(item, { value: 2 }).correct).toBe(false)
  })

  it('Mehrfachauswahl braucht genau die richtige Menge', () => {
    const item = get<MultiSelectItem>('t2-konstante-heizkreise')
    expect(grade(item, { value: [0, 1, 2] }).correct).toBe(true)
    expect(grade(item, { value: [2, 0, 1] }).correct).toBe(true)
    expect(grade(item, { value: [0, 1] }).correct).toBe(false)
    expect(grade(item, { value: [0, 1, 2, 3] }).correct).toBe(false)
  })

  it('Mehrfachauswahl bestraft Fehlgriffe im Teilscore', () => {
    const item = get<MultiSelectItem>('t2-konstante-heizkreise')
    expect(grade(item, { value: [0, 1] }).score).toBeCloseTo(2 / 3)
    // zwei Treffer, ein Fehlgriff → (2-1)/3
    expect(grade(item, { value: [0, 1, 3] }).score).toBeCloseTo(1 / 3)
    // alles anklicken darf nicht belohnt werden
    expect(grade(item, { value: [0, 1, 2, 3, 4] }).score).toBeCloseTo(1 / 3)
  })

  it('Lückentext ignoriert Groß-, Kleinschreibung und Umlaut-Schreibweise', () => {
    const item = get<ClozeItem>('t1-vorlauf-ruecklauf')
    expect(grade(item, { value: ['Vorlauf', 'Rücklauf', 'Spreizung'] }).correct).toBe(true)
    expect(grade(item, { value: ['vorlauf', 'ruecklauf', 'SPREIZUNG'] }).correct).toBe(true)
    expect(grade(item, { value: ['Rücklauf', 'Vorlauf', 'Spreizung'] }).correct).toBe(false)
  })

  it('Zuordnung gibt Teilpunkte', () => {
    const item = get<MatchItem>('t3-einsparung-match')
    const all = Object.fromEntries(item.pairs.map((p) => [p.left, p.right]))
    expect(grade(item, { value: all }).correct).toBe(true)

    const half = { ...all, [item.pairs[0].left]: 'falsch' }
    const g = grade(item, { value: half })
    expect(g.correct).toBe(false)
    expect(g.score).toBeCloseTo(3 / 4)
  })

  it('Reihenfolge verlangt jede Position richtig', () => {
    const item = get<OrderItem>('p4-freigabe-order')
    expect(grade(item, { value: [...item.steps] }).correct).toBe(true)
    const swapped = [...item.steps]
    ;[swapped[0], swapped[1]] = [swapped[1], swapped[0]]
    const g = grade(item, { value: swapped })
    expect(g.correct).toBe(false)
    expect(g.score).toBeCloseTo(3 / 5)
  })

  // Bewusst aus dem Item abgeleitet statt hart notiert: der Test prüft die
  // Toleranzlogik, nicht den Listenpreis. Ändert sich das Preisblatt, soll
  // die Aufgabe angepasst werden – nicht dieser Test rot werden.
  it('Schätzen akzeptiert innerhalb der Toleranz', () => {
    const item = get<EstimateItem>('v2-komfort-preis')
    const { answer, tolerance } = item
    expect(tolerance).toBeGreaterThan(0)
    expect(grade(item, { value: answer }).correct).toBe(true)
    expect(grade(item, { value: answer - tolerance }).correct).toBe(true)
    expect(grade(item, { value: answer + tolerance }).correct).toBe(true)
    expect(grade(item, { value: answer - tolerance - 1 }).correct).toBe(false)
    expect(grade(item, { value: answer + tolerance + 1 }).correct).toBe(false)
  })
})

describe('Bewertung freier Zusammenfassungen', () => {
  const rubric = [
    { concept: 'A', keywords: ['heizkurve'], hint: 'Heizkurve erwähnen' },
    { concept: 'B', keywords: ['trägheit', 'traegheit'], hint: 'Trägheit erwähnen' },
    { concept: 'C', keywords: ['sektorkopplung'], hint: 'Sektorkopplung erwähnen' },
  ]

  it('erkennt abgedeckte Konzepte trotz Umlaut-Varianten', () => {
    const text =
      'Bei klassischen Anlagen wirkt die Heizkurve, weil das Gebäude eine hohe Traegheit hat und langsam reagiert. Bei Sektorkopplung ist Echtzeit nötig, weil Strom sofort genutzt werden muss.'
    const g = gradeSummary(rubric, text, 0.6)
    expect(g.score).toBe(1)
    expect(g.correct).toBe(true)
    expect(g.detail).toEqual([])
  })

  it('nennt die fehlenden Punkte', () => {
    const text =
      'Die Heizkurve ist der wichtigste Hebel und wird iterativ nachgezogen, damit die Anlage nicht zu heiss fährt. Das machen wir laufend.'
    const g = gradeSummary(rubric, text, 0.6)
    expect(g.correct).toBe(false)
    expect(g.detail).toContain('Trägheit erwähnen')
    expect(g.detail).toContain('Sektorkopplung erwähnen')
  })

  it('lehnt Stichwort-Spam ab, auch wenn alle Wörter vorkommen', () => {
    const g = gradeSummary(rubric, 'Heizkurve Trägheit Sektorkopplung', 0.6)
    expect(g.score).toBe(1)
    expect(g.correct).toBe(false)
    expect(g.detail?.[0]).toMatch(/ganze Sätze/)
  })
})

describe('Inhaltliche Mindestanforderungen an alle Items', () => {
  it('jedes Item hat Erklärung, Quelle und Konzepte', () => {
    for (const i of items) {
      expect(i.why.length, `why fehlt bei ${i.id}`).toBeGreaterThan(40)
      expect(i.source.label.length, `Quelle fehlt bei ${i.id}`).toBeGreaterThan(5)
      expect(i.concepts.length, `Konzepte fehlen bei ${i.id}`).toBeGreaterThan(0)
    }
  })

  it('IDs sind eindeutig', () => {
    const ids = items.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('Lückentexte haben für jeden Platzhalter eine Lösung', () => {
    for (const i of items) {
      if (i.type !== 'cloze') continue
      const placeholders = [...i.template.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]))
      expect(placeholders, `Platzhalter in ${i.id}`).toEqual(i.blanks.map((_, n) => n))
      expect(i.distractors.length, `Ablenker fehlen in ${i.id}`).toBeGreaterThan(0)
    }
  })

  it('Antwortindizes liegen im gültigen Bereich', () => {
    for (const i of items) {
      if (i.type === 'mc' || i.type === 'scenario') {
        expect(i.answer, i.id).toBeGreaterThanOrEqual(0)
        expect(i.answer, i.id).toBeLessThan(i.options.length)
      }
      if (i.type === 'scenario') {
        expect(i.optionFeedback.length, `Feedback je Option in ${i.id}`).toBe(i.options.length)
      }
      if (i.type === 'multi') {
        expect(i.answer.length, i.id).toBeGreaterThan(0)
        for (const a of i.answer) expect(a, i.id).toBeLessThan(i.options.length)
        // Eine Mehrfachauswahl ohne Ablenker ist keine Aufgabe.
        expect(i.answer.length, `${i.id} hat keine falschen Optionen`).toBeLessThan(i.options.length)
      }
      if (i.type === 'estimate') {
        expect(i.answer, i.id).toBeGreaterThanOrEqual(i.min)
        expect(i.answer, i.id).toBeLessThanOrEqual(i.max)
        expect(i.tolerance, i.id).toBeGreaterThan(0)
      }
    }
  })

  it('Zuordnungen haben eindeutige linke und rechte Seiten', () => {
    for (const i of items) {
      if (i.type !== 'match') continue
      const lefts = i.pairs.map((p) => p.left)
      const rights = i.pairs.map((p) => p.right)
      expect(new Set(lefts).size, `doppelte linke Seite in ${i.id}`).toBe(lefts.length)
      expect(new Set(rights).size, `doppelte rechte Seite in ${i.id}`).toBe(rights.length)
      expect(i.pairs.length, `${i.id} braucht mindestens 2 Paare`).toBeGreaterThan(1)
    }
  })

  it('Zusammenfassungs-Aufgaben haben Rubrik und Musterlösung', () => {
    for (const i of items) {
      if (i.type !== 'readSummarize') continue
      expect(i.rubric.length, i.id).toBeGreaterThan(2)
      expect(i.modelAnswer.length, i.id).toBeGreaterThan(80)
      expect(i.passRatio, i.id).toBeGreaterThan(0)
      expect(i.passRatio, i.id).toBeLessThanOrEqual(1)
      // Die Musterlösung muss die eigene Rubrik erfüllen — sonst ist die
      // Rubrik falsch, nicht die Antwort der Lernenden.
      const g = gradeSummary(i.rubric, i.modelAnswer, i.passRatio)
      expect(g.correct, `Musterlösung von ${i.id} erfüllt ihre eigene Rubrik nicht: ${g.detail?.join(' | ')}`).toBe(true)
    }
  })
})
