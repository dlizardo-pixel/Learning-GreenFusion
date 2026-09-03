import { describe, expect, it } from 'vitest'
import {
  closeWeek,
  daysLeftInWeek,
  GROUP_SIZE,
  nextTier,
  previousTier,
  rankByStreak,
  rankMembers,
  rankTeams,
  weekStart,
  xpThisWeek,
  type LigaGroup,
  type LigaMember,
} from '../liga'
import { emptyProgress } from '../progress'

const member = (name: string, weeklyXp: number, streak = 0, team?: string): LigaMember => ({
  userId: name,
  name,
  weeklyXp,
  streak,
  team,
})

/** Volle Gruppe, absteigende XP – Position n hat (GROUP_SIZE - n) * 10 XP. */
const fullGroup = (): LigaGroup => ({
  tier: 'silber',
  weekStart: '2026-08-31',
  members: Array.from({ length: GROUP_SIZE }, (_, i) =>
    member(`P${String(i).padStart(2, '0')}`, (GROUP_SIZE - i) * 10, i),
  ),
})

describe('Wochengrenze', () => {
  it('beginnt am Montag', () => {
    // 2026-09-03 ist ein Donnerstag.
    expect(weekStart(new Date(2026, 8, 3))).toBe('2026-08-31')
    // Der Montag selbst bleibt sein eigener Wochenstart.
    expect(weekStart(new Date(2026, 7, 31))).toBe('2026-08-31')
    // Sonntag gehört noch zur Woche davor.
    expect(weekStart(new Date(2026, 8, 6))).toBe('2026-08-31')
    expect(weekStart(new Date(2026, 8, 7))).toBe('2026-09-07')
  })

  it('zählt die Resttage der Woche', () => {
    expect(daysLeftInWeek(new Date(2026, 7, 31))).toBe(7) // Montag
    expect(daysLeftInWeek(new Date(2026, 8, 6))).toBe(1) // Sonntag
  })

  it('summiert nur die XP der laufenden Woche', () => {
    const p = emptyProgress()
    p.xpByDay['2026-08-30'] = 500 // Sonntag der Vorwoche
    p.xpByDay['2026-08-31'] = 40 // Montag
    p.xpByDay['2026-09-03'] = 60 // Donnerstag
    p.xpByDay['2026-09-07'] = 999 // nächster Montag
    expect(xpThisWeek(p, new Date(2026, 8, 3))).toBe(100)
  })
})

describe('Rangliste', () => {
  it('sortiert nach Wochen-XP', () => {
    const ranked = rankMembers({
      tier: 'silber',
      weekStart: '2026-08-31',
      members: [member('B', 100), member('A', 300), member('C', 200)],
    })
    expect(ranked.map((m) => m.name)).toEqual(['A', 'C', 'B'])
    expect(ranked[0].position).toBe(1)
  })

  it('löst Gleichstand nach Serie und dann alphabetisch auf – nicht zufällig', () => {
    const g: LigaGroup = {
      tier: 'silber',
      weekStart: '2026-08-31',
      members: [member('Zoe', 100, 3), member('Anna', 100, 3), member('Bea', 100, 9)],
    }
    const first = rankMembers(g).map((m) => m.name)
    expect(first).toEqual(['Bea', 'Anna', 'Zoe'])
    // Zweimal aufgerufen muss dasselbe herauskommen, sonst springt die
    // Rangliste bei jedem Aufruf.
    expect(rankMembers(g).map((m) => m.name)).toEqual(first)
  })

  it('markiert Auf- und Abstiegszonen', () => {
    const ranked = rankMembers(fullGroup())
    expect(ranked.slice(0, 4).every((m) => m.zone === 'promote')).toBe(true)
    expect(ranked.slice(4, 16).every((m) => m.zone === 'hold')).toBe(true)
    expect(ranked.slice(16).every((m) => m.zone === 'relegate')).toBe(true)
  })

  it('lässt niemanden absteigen, der diese Woche nicht gespielt hat', () => {
    // Urlaub, Krankheit, Elternzeit: wer 0 XP hat, wird nicht bestraft.
    const g = fullGroup()
    g.members = g.members.map((m, i) => (i >= 16 ? { ...m, weeklyXp: 0 } : m))
    const ranked = rankMembers(g)
    expect(ranked.filter((m) => m.zone === 'relegate')).toEqual([])
  })

  it('kennt in der untersten Liga keinen Abstieg und in der obersten keinen Aufstieg', () => {
    const bronze = rankMembers({ ...fullGroup(), tier: 'bronze' })
    expect(bronze.some((m) => m.zone === 'relegate')).toBe(false)
    expect(bronze.some((m) => m.zone === 'promote')).toBe(true)

    const diamant = rankMembers({ ...fullGroup(), tier: 'diamant' })
    expect(diamant.some((m) => m.zone === 'promote')).toBe(false)
    expect(diamant.some((m) => m.zone === 'relegate')).toBe(true)
  })

  it('wertet eine unterbesetzte Gruppe gegen die Zielgrösse', () => {
    // Sonst wären in einer Gruppe von fünf Leuten vier Absteiger.
    const ranked = rankMembers({
      tier: 'silber',
      weekStart: '2026-08-31',
      members: [member('A', 50), member('B', 40), member('C', 30), member('D', 20), member('E', 10)],
    })
    expect(ranked.filter((m) => m.zone === 'relegate')).toEqual([])
  })

  it('teilt beim Wochenabschluss in Auf-, Halte- und Absteiger', () => {
    const r = closeWeek(fullGroup())
    expect(r.promoted.length).toBe(4)
    expect(r.relegated.length).toBe(4)
    expect(r.promoted.length + r.relegated.length + r.stays.length).toBe(GROUP_SIZE)
  })

  it('bewegt sich in den Ligastufen und bleibt an den Rändern stehen', () => {
    expect(nextTier('bronze')).toBe('silber')
    expect(nextTier('diamant')).toBe('diamant')
    expect(previousTier('bronze')).toBe('bronze')
    expect(previousTier('gold')).toBe('silber')
  })
})

describe('Serien-Rangliste', () => {
  it('sortiert nach Serie, nicht nach Punkten', () => {
    // Die zweite Leiter: gewinnbar mit fünf Minuten am Tag.
    const ranked = rankByStreak([
      member('Vielspieler', 900, 2),
      member('Beständig', 60, 40),
      member('Mittel', 300, 12),
    ])
    expect(ranked.map((m) => m.name)).toEqual(['Beständig', 'Mittel', 'Vielspieler'])
  })
})

describe('Team-Wertung', () => {
  it('wertet den Durchschnitt der Aktiven, nicht die Summe', () => {
    const members = [
      // Grosses Team, mittlere Leistung
      ...Array.from({ length: 10 }, (_, i) => member(`S${i}`, 100, 1, 'Sales')),
      // Kleines Team, hohe Leistung
      member('C1', 300, 1, 'Customer Success'),
      member('C2', 300, 1, 'Customer Success'),
    ]
    const teams = rankTeams(members)
    expect(teams[0].team).toBe('Customer Success')
    expect(teams[0].averageXp).toBe(300)
    expect(teams[1].averageXp).toBe(100)
  })

  it('zieht Inaktive nicht in den Schnitt – sonst entsteht Druck auf Einzelne', () => {
    const teams = rankTeams([
      member('A', 200, 1, 'Product'),
      member('B', 0, 0, 'Product'),
      member('C', 0, 0, 'Product'),
    ])
    expect(teams[0].averageXp).toBe(200)
    expect(teams[0].activeMembers).toBe(1)
    expect(teams[0].totalMembers).toBe(3)
  })

  it('ignoriert Mitglieder ohne Team', () => {
    const teams = rankTeams([member('Ohne', 500, 1), member('Mit', 100, 1, 'Ops')])
    expect(teams.length).toBe(1)
    expect(teams[0].team).toBe('Ops')
  })

  it('gibt ein Team ohne Aktive mit 0 aus, statt durch null zu teilen', () => {
    const teams = rankTeams([member('A', 0, 0, 'Marketing')])
    expect(teams[0].averageXp).toBe(0)
  })
})
