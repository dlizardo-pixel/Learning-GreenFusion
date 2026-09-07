import { describe, expect, it } from 'vitest'
import {
  challengeCount,
  challengeDone,
  challengeForDay,
  countsTowards,
  recordChallengeProgress,
} from '../challenge'
import { emptyProgress } from '../progress'
import { items, itemById } from '../../data'
import type { Item } from '../types'

const get = (id: string) => itemById.get(id) as Item

describe('Aufgabe des Tages', () => {
  it('ist für denselben Tag immer dieselbe – kein Neuauswürfeln beim Neuladen', () => {
    const a = challengeForDay('2026-09-03')
    for (let i = 0; i < 20; i++) expect(challengeForDay('2026-09-03').id).toBe(a.id)
  })

  it('wechselt über die Tage', () => {
    const ids = new Set(
      Array.from({ length: 30 }, (_, i) => challengeForDay(`2026-09-${String(i + 1).padStart(2, '0')}`).id),
    )
    expect(ids.size).toBeGreaterThan(3)
  })

  it('hat immer ein erreichbares Ziel und eine Belohnung', () => {
    for (let i = 1; i <= 28; i++) {
      const c = challengeForDay(`2026-09-${String(i).padStart(2, '0')}`)
      expect(c.target).toBeGreaterThan(0)
      expect(c.target).toBeLessThanOrEqual(5)
      expect(c.xp).toBeGreaterThan(0)
      expect(c.description.length).toBeGreaterThan(20)
    }
  })
})

describe('Zählen', () => {
  const kursAufgabe = {
    ...challengeForDay('x'),
    spec: { kind: 'moduleCorrect', moduleId: 'm1-grundlagen' } as const,
  }

  /** Ein Item aus Modul 1 und eines aus einem anderen Modul. */
  const ausM1 = get('t1-erzeuger-verbraucher')
  const ausM6 = get('v2-komfort-preis')

  it('zählt falsche Antworten nicht', () => {
    expect(countsTowards(kursAufgabe, ausM1, { correct: false, wasDue: false })).toBe(false)
  })

  it('zählt nur Aufgaben aus dem verlangten Modul', () => {
    expect(ausM1.moduleId).toBe('m1-grundlagen')
    expect(countsTowards(kursAufgabe, ausM1, { correct: true, wasDue: false })).toBe(true)
    expect(countsTowards(kursAufgabe, ausM6, { correct: true, wasDue: false })).toBe(false)
  })

  it('zählt bei der Wiederholungs-Aufgabe nur fällige Items', () => {
    const c = { ...kursAufgabe, spec: { kind: 'reviews' } as const }
    expect(countsTowards(c, ausM1, { correct: true, wasDue: true })).toBe(true)
    expect(countsTowards(c, ausM1, { correct: true, wasDue: false })).toBe(false)
  })

  it('erkennt Kundengespräch und Zusammenfassung am Aufgabentyp', () => {
    const szenario = { ...kursAufgabe, spec: { kind: 'scenarios' } as const }
    const zusammen = { ...kursAufgabe, spec: { kind: 'summarize' } as const }
    const s = items.find((i) => i.type === 'scenario')!
    const z = items.find((i) => i.type === 'readSummarize')!
    expect(countsTowards(szenario, s, { correct: true, wasDue: false })).toBe(true)
    expect(countsTowards(szenario, z, { correct: true, wasDue: false })).toBe(false)
    expect(countsTowards(zusammen, z, { correct: true, wasDue: false })).toBe(true)
  })
})

describe('Fortschritt und Belohnung', () => {
  const day = '2026-09-03'
  const now = new Date(`${day}T12:00:00`)
  const challenge = challengeForDay(day)
  /** Ein Item, das für die heutige Aufgabe zählt. */
  const matching = items.find((i) => countsTowards(challenge, i, { correct: true, wasDue: true }))!

  it('zahlt erst beim Erreichen des Ziels aus, dann genau einmal', () => {
    let p = emptyProgress()
    let total = 0
    // Deutlich mehr Antworten als das Ziel verlangt.
    for (let i = 0; i < challenge.target + 4; i++) {
      const r = recordChallengeProgress(p, matching, { correct: true, wasDue: true }, now)
      p = r.progress
      total += r.awardedXp
    }
    expect(total).toBe(challenge.xp)
    expect(challengeDone(p, day)).toBe(true)
  })

  it('meldet den Abschluss genau im richtigen Schritt', () => {
    let p = emptyProgress()
    const completions: number[] = []
    for (let i = 0; i < challenge.target + 2; i++) {
      const r = recordChallengeProgress(p, matching, { correct: true, wasDue: true }, now)
      p = r.progress
      if (r.justCompleted) completions.push(i + 1)
    }
    expect(completions).toEqual([challenge.target])
  })

  it('beginnt an einem neuen Tag bei null', () => {
    let p = emptyProgress()
    p = recordChallengeProgress(p, matching, { correct: true, wasDue: true }, now).progress
    expect(challengeCount(p, day)).toBe(1)
    expect(challengeCount(p, '2026-09-04')).toBe(0)
  })

  it('schreibt die Belohnung auch dem Tageskonto zu', () => {
    let p = emptyProgress()
    for (let i = 0; i < challenge.target; i++) {
      p = recordChallengeProgress(p, matching, { correct: true, wasDue: true }, now).progress
    }
    expect(p.xpByDay[day]).toBe(challenge.xp)
    expect(p.xp).toBe(challenge.xp)
  })
})
