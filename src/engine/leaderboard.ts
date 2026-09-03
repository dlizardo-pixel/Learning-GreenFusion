/**
 * Datenquelle für die Liga.
 *
 * Ohne Backend gibt es keine echte Rangliste — die Lernstände liegen je
 * Browser. Diese Abstraktion trennt die Oberfläche von der Herkunft der
 * Daten: heute Beispieldaten plus die eigene, echte Wochenleistung,
 * später dieselbe Schnittstelle gegen eine API.
 *
 * Wichtig für die Darstellung: Beispieldaten müssen in der Oberfläche als
 * solche gekennzeichnet sein. Eine Rangliste, die erfundene Kolleg:innen
 * wie echte aussehen lässt, ist eine Falschaussage über Menschen.
 */
import type { Progress } from './types'
import { GROUP_SIZE, type LigaGroup, type LigaMember, type Tier, weekStart, xpThisWeek } from './liga'

export interface LeaderboardSource {
  name: string
  /** Sind die Daten echt oder Beispiel? Steuert den Hinweis in der Oberfläche. */
  isDemo: boolean
  group(progress: Progress, now?: Date): Promise<LigaGroup>
  /** Alle Mitglieder für die Team-Wertung (kann über Gruppen hinausgehen). */
  allMembers(progress: Progress, now?: Date): Promise<LigaMember[]>
}

export const ME = 'me'

/** Klar erfundene Namen — es sind Platzhalter, keine Kolleg:innen. */
const DEMO_PEOPLE: { name: string; team: string; xp: number; streak: number }[] = [
  { name: 'A. Beispiel', team: 'Sales', xp: 420, streak: 23 },
  { name: 'B. Muster', team: 'Customer Success', xp: 385, streak: 11 },
  { name: 'C. Platzhalter', team: 'Sales', xp: 350, streak: 8 },
  { name: 'D. Vorlage', team: 'Product', xp: 305, streak: 31 },
  { name: 'E. Beispiel', team: 'Customer Success', xp: 260, streak: 5 },
  { name: 'F. Muster', team: 'Marketing', xp: 240, streak: 14 },
  { name: 'G. Platzhalter', team: 'Hardware', xp: 210, streak: 3 },
  { name: 'H. Vorlage', team: 'Sales', xp: 185, streak: 9 },
  { name: 'I. Beispiel', team: 'Product', xp: 160, streak: 2 },
  { name: 'J. Muster', team: 'Ops', xp: 140, streak: 17 },
  { name: 'K. Platzhalter', team: 'Customer Success', xp: 120, streak: 4 },
  { name: 'L. Vorlage', team: 'Marketing', xp: 95, streak: 1 },
  { name: 'M. Beispiel', team: 'Hardware', xp: 80, streak: 6 },
  { name: 'N. Muster', team: 'Ops', xp: 60, streak: 2 },
  { name: 'O. Platzhalter', team: 'Product', xp: 45, streak: 1 },
  { name: 'P. Vorlage', team: 'Sales', xp: 30, streak: 1 },
  { name: 'Q. Beispiel', team: 'Customer Success', xp: 20, streak: 1 },
  { name: 'R. Muster', team: 'Marketing', xp: 0, streak: 0 },
  { name: 'S. Platzhalter', team: 'Hardware', xp: 0, streak: 0 },
]

const initials = (name: string) =>
  name
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const demoMembers = (): LigaMember[] =>
  DEMO_PEOPLE.map((p, i) => ({
    userId: `demo-${i}`,
    name: p.name,
    team: p.team,
    weeklyXp: p.xp,
    streak: p.streak,
    initials: initials(p.name),
  }))

/** Die eigene Zeile kommt aus dem echten lokalen Lernstand. */
function meAsMember(progress: Progress, now: Date): LigaMember {
  return {
    userId: ME,
    name: 'Du',
    team: undefined,
    weeklyXp: xpThisWeek(progress, now),
    streak: progress.streak,
    initials: 'DU',
  }
}

export const demoSource: LeaderboardSource = {
  name: 'demo',
  isDemo: true,
  async group(progress, now = new Date()) {
    const members = [...demoMembers().slice(0, GROUP_SIZE - 1), meAsMember(progress, now)]
    return { tier: 'bronze' as Tier, weekStart: weekStart(now), members }
  },
  async allMembers(progress, now = new Date()) {
    return [...demoMembers(), meAsMember(progress, now)]
  },
}

/**
 * Platzhalter für die echte Quelle. Erwartet einen Endpunkt, der Gruppe und
 * Mitglieder liefert; fällt bei jedem Fehler auf die Beispieldaten zurück,
 * damit die Seite nie leer bleibt — aber dann sichtbar als Beispiel.
 */
export function apiSource(baseUrl: string, token: () => string | null): LeaderboardSource {
  const get = async <T>(path: string): Promise<T> => {
    const t = token()
    const res = await fetch(`${baseUrl}${path}`, {
      headers: t ? { Authorization: `Bearer ${t}` } : {},
    })
    if (!res.ok) throw new Error(`Liga nicht erreichbar: ${res.status}`)
    return (await res.json()) as T
  }

  return {
    name: 'api',
    isDemo: false,
    async group(progress, now = new Date()) {
      try {
        return await get<LigaGroup>('/liga/group')
      } catch {
        return demoSource.group(progress, now)
      }
    },
    async allMembers(progress, now = new Date()) {
      try {
        return await get<LigaMember[]>('/liga/members')
      } catch {
        return demoSource.allMembers(progress, now)
      }
    },
  }
}

let active: LeaderboardSource = demoSource
export const setLeaderboardSource = (s: LeaderboardSource) => {
  active = s
}
export const getLeaderboardSource = () => active
