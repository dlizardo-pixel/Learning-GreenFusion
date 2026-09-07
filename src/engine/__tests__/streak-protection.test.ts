import { describe, expect, it } from 'vitest'
import {
  bumpStreak,
  canRepairStreak,
  grantWeeklyFreeze,
  MAX_FREEZES,
  repairStreak,
} from '../srs'
import { emptyProgress } from '../progress'
import type { Progress } from '../types'

const D = (s: string) => new Date(`${s}T12:00:00`)
const base = (o: Partial<Progress> = {}): Progress => ({ ...emptyProgress(), ...o })

describe('Schutztage', () => {
  it('schreibt pro Woche einen Schutztag gut, aber nur einmal', () => {
    let p = base({ freezes: 0 })
    p = grantWeeklyFreeze(p, D('2026-08-31')) // Montag
    expect(p.freezes).toBe(1)
    p = grantWeeklyFreeze(p, D('2026-09-03')) // gleiche Woche
    expect(p.freezes).toBe(1)
    p = grantWeeklyFreeze(p, D('2026-09-07')) // nächste Woche
    expect(p.freezes).toBe(2)
  })

  it('deckelt den Vorrat', () => {
    // Sonst hätte jemand nach drei Monaten Pause zwölf Schutztage und
    // behielte eine Serie, die er nie gelebt hat.
    let p = base({ freezes: 0 })
    for (let w = 0; w < 10; w++) {
      p = { ...p, freezeGrantedWeek: null }
      p = grantWeeklyFreeze(p, D('2026-08-31'))
    }
    expect(p.freezes).toBe(MAX_FREEZES)
  })

  it('überbrückt einen verpassten Tag und verbraucht dabei einen Schutztag', () => {
    const p = base({ streak: 12, lastActiveDay: '2026-09-01', freezes: 1 })
    const next = bumpStreak(p, D('2026-09-03')) // 02.09. fehlt
    expect(next.streak).toBe(13)
    expect(next.freezes).toBe(0)
    expect(next.frozenDays).toEqual(['2026-09-02'])
    expect(next.lostStreak).toBeNull()
  })

  it('überbrückt zwei verpasste Tage, wenn zwei Schutztage da sind', () => {
    const p = base({ streak: 30, lastActiveDay: '2026-09-01', freezes: 2 })
    const next = bumpStreak(p, D('2026-09-04'))
    expect(next.streak).toBe(31)
    expect(next.freezes).toBe(0)
    expect(next.frozenDays).toEqual(['2026-09-02', '2026-09-03'])
  })

  it('lässt die Serie fallen, wenn die Lücke grösser ist als der Vorrat', () => {
    const p = base({ streak: 30, lastActiveDay: '2026-09-01', freezes: 1 })
    const next = bumpStreak(p, D('2026-09-05')) // drei Tage fehlen
    expect(next.streak).toBe(1)
    // Der Vorrat bleibt unangetastet – halb überbrücken hilft niemandem.
    expect(next.freezes).toBe(1)
    expect(next.lostStreak).toEqual({ value: 30, lostOn: '2026-09-05' })
  })

  it('verbraucht keinen Schutztag am Folgetag', () => {
    const p = base({ streak: 5, lastActiveDay: '2026-09-02', freezes: 2 })
    const next = bumpStreak(p, D('2026-09-03'))
    expect(next.streak).toBe(6)
    expect(next.freezes).toBe(2)
  })

  it('verbraucht keinen Schutztag am selben Tag', () => {
    const p = base({ streak: 5, lastActiveDay: '2026-09-03', freezes: 2 })
    expect(bumpStreak(p, D('2026-09-03'))).toEqual(p)
  })
})

describe('Serie retten', () => {
  it('bietet die Rettung innerhalb des Zeitfensters an', () => {
    const p = base({ streak: 1, lostStreak: { value: 22, lostOn: '2026-09-03' } })
    expect(canRepairStreak(p, D('2026-09-03'))).toBe(true)
    expect(canRepairStreak(p, D('2026-09-05'))).toBe(true)
    expect(canRepairStreak(p, D('2026-09-06'))).toBe(false)
  })

  it('bietet keine Rettung für eine Serie von einem Tag an', () => {
    const p = base({ lostStreak: { value: 1, lostOn: '2026-09-03' } })
    expect(canRepairStreak(p, D('2026-09-03'))).toBe(false)
  })

  it('stellt die Serie samt heutigem Tag wieder her', () => {
    const p = base({ streak: 1, longestStreak: 22, lostStreak: { value: 22, lostOn: '2026-09-03' } })
    const r = repairStreak(p, D('2026-09-04'))
    expect(r.streak).toBe(23)
    expect(r.longestStreak).toBe(23)
    expect(r.lastActiveDay).toBe('2026-09-04')
    expect(r.lostStreak).toBeNull()
  })

  it('tut nichts, wenn das Zeitfenster zu ist', () => {
    const p = base({ streak: 1, lostStreak: { value: 22, lostOn: '2026-09-01' } })
    expect(repairStreak(p, D('2026-09-08'))).toEqual(p)
  })
})
