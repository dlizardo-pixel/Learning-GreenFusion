/**
 * Die Green Fusion Liga.
 *
 * Vier Entscheidungen, die darüber bestimmen, ob eine Rangliste im
 * Unternehmen motiviert oder Schaden anrichtet:
 *
 * 1. **Wöchentlicher Reset.** Gewertet werden die XP *dieser Woche*, nicht
 *    die Gesamtpunkte. Eine Gesamtpunkte-Rangliste gewinnt für immer, wer
 *    zuerst angefangen hat — alle anderen schauen nach zwei Wochen nicht
 *    mehr hin. Montags stehen alle wieder bei null.
 *
 * 2. **Ligen statt einer Liste.** Bei 100 Personen in einer Liste sind
 *    90 nie in Reichweite. In Gruppen von rund 20 mit Auf- und Abstieg
 *    konkurriert man mit Leuten auf dem eigenen Aktivitätsniveau — die
 *    Rangliste ist immer gewinnbar.
 *
 * 3. **Zwei Leitern.** Punkte belohnen Aufwand, die Serie belohnt
 *    Beständigkeit. Die Serien-Rangliste kann die vielbeschäftigtste
 *    Person im Haus mit fünf Minuten am Tag gewinnen. Wer nur eine Leiter
 *    baut, schliesst die halbe Belegschaft aus.
 *
 * 4. **Teams nach Durchschnitt, nicht Summe.** Sonst gewinnt immer das
 *    grösste Team, und in kleinen Teams lohnt das Mitmachen nicht.
 */
import { today } from './srs'
import type { Progress } from './types'

export type Tier = 'bronze' | 'silber' | 'gold' | 'diamant'

export const TIERS: Tier[] = ['bronze', 'silber', 'gold', 'diamant']

export const TIER_LABEL: Record<Tier, string> = {
  bronze: 'Bronze-Liga',
  silber: 'Silber-Liga',
  gold: 'Gold-Liga',
  diamant: 'Diamant-Liga',
}

export const TIER_COLOR: Record<Tier, string> = {
  bronze: '#B87333',
  silber: '#8A9BA8',
  gold: '#E0A32E',
  diamant: '#4F8DDF',
}

/** Zielgrösse einer Gruppe. Klein genug, dass der erste Platz erreichbar wirkt. */
export const GROUP_SIZE = 20
export const PROMOTE_COUNT = 4
export const RELEGATE_COUNT = 4

export interface LigaMember {
  userId: string
  name: string
  /** Abteilung, für die Team-Wertung. */
  team?: string
  weeklyXp: number
  streak: number
  /** Optionales Kürzel für die Darstellung. */
  initials?: string
}

export interface RankedMember extends LigaMember {
  position: number
  zone: Zone
}

/** Auf-, Halte- oder Abstiegszone. */
export type Zone = 'promote' | 'hold' | 'relegate'

export interface LigaGroup {
  tier: Tier
  /** ISO-Datum des Montags dieser Woche. */
  weekStart: string
  members: LigaMember[]
}

/** Montag der Woche, in der das Datum liegt. */
export function weekStart(now: Date = new Date()): string {
  const d = new Date(now)
  const offsetToMonday = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - offsetToMonday)
  return today(d)
}

/** XP der laufenden Woche aus dem lokalen Lernstand. */
export function xpThisWeek(progress: Progress, now: Date = new Date()): number {
  const monday = weekStart(now)
  const [y, m, dd] = monday.split('-').map(Number)
  let sum = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(y, m - 1, dd + i)
    sum += progress.xpByDay[today(d)] ?? 0
  }
  return sum
}

export function zoneFor(position: number, groupSize: number, tier: Tier): Zone {
  const isTop = tier === TIERS[TIERS.length - 1]
  const isBottom = tier === TIERS[0]
  if (!isTop && position <= PROMOTE_COUNT) return 'promote'
  if (!isBottom && position > groupSize - RELEGATE_COUNT) return 'relegate'
  return 'hold'
}

/**
 * Rangliste bilden.
 *
 * Gleichstand wird nach der Serie aufgelöst, danach alphabetisch — nicht
 * zufällig, damit dieselbe Woche nicht bei jedem Aufruf anders aussieht.
 * Wer 0 XP hat, landet ohne Zone am Ende: niemand steigt ab, weil er in
 * einer Woche Urlaub hatte.
 */
export function rankMembers(group: LigaGroup): RankedMember[] {
  const sorted = [...group.members].sort(
    (a, b) =>
      b.weeklyXp - a.weeklyXp ||
      b.streak - a.streak ||
      a.name.localeCompare(b.name, 'de'),
  )
  const size = Math.max(sorted.length, GROUP_SIZE)
  return sorted.map((m, i) => ({
    ...m,
    position: i + 1,
    zone: m.weeklyXp === 0 ? 'hold' : zoneFor(i + 1, size, group.tier),
  }))
}

/** Serien-Rangliste — die zweite Leiter. */
export function rankByStreak(members: LigaMember[]): RankedMember[] {
  return [...members]
    .sort(
      (a, b) => b.streak - a.streak || b.weeklyXp - a.weeklyXp || a.name.localeCompare(b.name, 'de'),
    )
    .map((m, i) => ({ ...m, position: i + 1, zone: 'hold' as Zone }))
}

export interface TeamStanding {
  team: string
  /** Durchschnittliche XP je aktivem Mitglied — nicht die Summe. */
  averageXp: number
  activeMembers: number
  totalMembers: number
  position: number
}

/**
 * Team-Wertung nach Durchschnitt der Aktiven.
 *
 * "Aktiv" heisst: in dieser Woche mindestens eine Lektion. Damit zieht ein
 * Team, in dem die Hälfte nicht mitmacht, nicht seinen eigenen Schnitt
 * herunter — sonst entsteht Druck auf Einzelne, und genau das soll die
 * Team-Wertung verhindern.
 */
export function rankTeams(members: LigaMember[]): TeamStanding[] {
  const byTeam = new Map<string, LigaMember[]>()
  for (const m of members) {
    if (!m.team) continue
    const list = byTeam.get(m.team) ?? []
    list.push(m)
    byTeam.set(m.team, list)
  }

  return [...byTeam.entries()]
    .map(([team, list]) => {
      const active = list.filter((m) => m.weeklyXp > 0)
      const averageXp = active.length
        ? Math.round(active.reduce((s, m) => s + m.weeklyXp, 0) / active.length)
        : 0
      return { team, averageXp, activeMembers: active.length, totalMembers: list.length }
    })
    .sort((a, b) => b.averageXp - a.averageXp || a.team.localeCompare(b.team, 'de'))
    .map((t, i) => ({ ...t, position: i + 1 }))
}

export interface WeekResult {
  promoted: LigaMember[]
  relegated: LigaMember[]
  stays: LigaMember[]
}

/** Wochenabschluss: wer steigt auf, wer ab. */
export function closeWeek(group: LigaGroup): WeekResult {
  const ranked = rankMembers(group)
  return {
    promoted: ranked.filter((m) => m.zone === 'promote'),
    relegated: ranked.filter((m) => m.zone === 'relegate'),
    stays: ranked.filter((m) => m.zone === 'hold'),
  }
}

export const nextTier = (t: Tier): Tier => TIERS[Math.min(TIERS.indexOf(t) + 1, TIERS.length - 1)]
export const previousTier = (t: Tier): Tier => TIERS[Math.max(TIERS.indexOf(t) - 1, 0)]

/** Tage bis zum Wochenabschluss – erzeugt den Endspurt am Sonntag. */
export function daysLeftInWeek(now: Date = new Date()): number {
  const offsetToMonday = (now.getDay() + 6) % 7
  return 7 - offsetToMonday
}
