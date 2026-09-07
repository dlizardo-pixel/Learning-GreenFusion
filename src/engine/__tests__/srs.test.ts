import { describe, expect, it } from 'vitest'
import { addDays, bumpStreak, daysBetween, dueCount, isDue, review, today } from '../srs'
import { emptyProgress } from '../progress'
import type { Progress } from '../types'

const D = (s: string) => new Date(`${s}T12:00:00`)

describe('Datumshilfen', () => {
  it('rechnet Tage lokal, nicht in UTC', () => {
    expect(today(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })

  it('addiert über Monatsgrenzen', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02')
  })

  it('rechnet Differenzen über Zeitumstellung hinweg', () => {
    // Ende März wechselt Deutschland auf Sommerzeit — ohne UTC-Normalisierung
    // wären das 30,96 Tage und würden falsch gerundet.
    expect(daysBetween('2026-03-01', '2026-04-01')).toBe(31)
  })
})

describe('Leitner-Wiederholung', () => {
  it('schiebt bei richtiger Antwort eine Box weiter', () => {
    const p = review(undefined, 'x', true, D('2026-01-01'))
    expect(p.box).toBe(1)
    expect(p.dueAt).toBe('2026-01-02')
    expect(p.timesCorrect).toBe(1)
  })

  it('fällt bei einem Fehler auf Box 0 zurück, nicht nur eine Box', () => {
    let p = review(undefined, 'x', true, D('2026-01-01'))
    p = review(p, 'x', true, D('2026-01-02'))
    p = review(p, 'x', true, D('2026-01-05'))
    expect(p.box).toBe(3)

    p = review(p, 'x', false, D('2026-01-12'))
    expect(p.box).toBe(0)
    expect(p.dueAt).toBe('2026-01-12')
    expect(p.timesWrong).toBe(1)
  })

  it('bleibt in der höchsten Box stehen', () => {
    let p = review(undefined, 'x', true, D('2026-01-01'))
    for (let i = 0; i < 12; i++) p = review(p, 'x', true, D('2026-01-01'))
    expect(p.box).toBe(5)
    expect(p.dueAt).toBe('2026-02-05')
  })

  it('ist fällig, wenn das Datum erreicht oder überschritten ist', () => {
    const p = review(undefined, 'x', true, D('2026-01-01'))
    expect(isDue(p, D('2026-01-01'))).toBe(false)
    expect(isDue(p, D('2026-01-02'))).toBe(true)
    expect(isDue(p, D('2026-03-01'))).toBe(true)
  })

  it('zählt fällige Items', () => {
    const p = emptyProgress()
    p.items.a = review(undefined, 'a', true, D('2026-01-01')) // fällig 01-02
    p.items.b = review(undefined, 'b', true, D('2026-01-01'))
    p.items.b = review(p.items.b, 'b', true, D('2026-01-02')) // fällig 01-05
    expect(dueCount(p, D('2026-01-03'))).toBe(1)
    expect(dueCount(p, D('2026-01-06'))).toBe(2)
  })
})

describe('Serie', () => {
  it('zählt am Folgetag hoch', () => {
    let p: Progress = { ...emptyProgress(), streak: 3, lastActiveDay: '2026-01-01' }
    p = bumpStreak(p, D('2026-01-02'))
    expect(p.streak).toBe(4)
    expect(p.longestStreak).toBe(4)
  })

  it('bleibt am selben Tag unverändert', () => {
    const p = { ...emptyProgress(), streak: 3, lastActiveDay: '2026-01-02' }
    expect(bumpStreak(p, D('2026-01-02')).streak).toBe(3)
  })

  it('startet nach einer Lücke neu, behält aber den Bestwert', () => {
    let p: Progress = { ...emptyProgress(), streak: 9, longestStreak: 9, lastActiveDay: '2026-01-01' }
    p = bumpStreak(p, D('2026-01-05'))
    expect(p.streak).toBe(1)
    expect(p.longestStreak).toBe(9)
  })
})
