/**
 * Die Liga aus Supabase.
 *
 * Liest die Sicht `liga_week`, die pro Person und Woche die XP
 * aufsummiert. Bewusst eine Sicht und keine gespeicherte Rangliste: eine
 * berechnete Wertung kann nicht aus dem Takt geraten.
 *
 * Fällt bei jedem Fehler auf die Beispieldaten zurück und markiert sich
 * dann selbst als Demo, damit die Oberfläche den Hinweis anzeigt und
 * niemand erfundene Namen für echte hält.
 */
import type { LeaderboardSource } from '../engine/leaderboard'
import { demoSource } from '../engine/leaderboard'
import { weekStart, type LigaGroup, type LigaMember, type Tier, TIERS } from '../engine/liga'
import type { Progress } from '../engine/types'
import { supabase } from './supabase'

interface LigaRow {
  user_id: string
  display_name: string
  team: string | null
  tier: string
  group_no: number
  weekly_xp: number
  streak: number
}

const initials = (name: string) =>
  name
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const toMember = (r: LigaRow, meId: string): LigaMember => ({
  userId: r.user_id === meId ? 'me' : r.user_id,
  name: r.user_id === meId ? 'Du' : r.display_name,
  team: r.team ?? undefined,
  weeklyXp: r.weekly_xp,
  streak: r.streak,
  initials: r.user_id === meId ? 'DU' : initials(r.display_name),
})

const asTier = (t: string): Tier => (TIERS as string[]).includes(t) ? (t as Tier) : 'bronze'

export function supabaseLeaderboardSource(userId: string): LeaderboardSource {
  if (!supabase) throw new Error('Supabase ist nicht konfiguriert')
  const db = supabase

  /** Merkt sich, ob der letzte Abruf auf Beispieldaten zurückgefallen ist. */
  const state = { degraded: false }

  const fetchWeek = async (now: Date) => {
    const week = weekStart(now)
    const { data, error } = await db.from('liga_week').select('*').eq('week_start', week)
    if (error) throw error
    return (data ?? []) as LigaRow[]
  }

  return {
    name: 'supabase',
    get isDemo() {
      return state.degraded
    },
    async group(progress: Progress, now = new Date()): Promise<LigaGroup> {
      try {
        const rows = await fetchWeek(now)
        const mine = rows.find((r) => r.user_id === userId)
        // Ohne eigene Zuordnung noch keine Gruppe – dann in Bronze zeigen.
        const tier = asTier(mine?.tier ?? 'bronze')
        const groupNo = mine?.group_no ?? 0
        const members = rows
          .filter((r) => asTier(r.tier) === tier && r.group_no === groupNo)
          .map((r) => toMember(r, userId))

        if (!members.length) throw new Error('Keine Gruppendaten')
        state.degraded = false
        return { tier, weekStart: weekStart(now), members }
      } catch {
        state.degraded = true
        return demoSource.group(progress, now)
      }
    },
    async allMembers(progress: Progress, now = new Date()): Promise<LigaMember[]> {
      try {
        const rows = await fetchWeek(now)
        if (!rows.length) throw new Error('Keine Mitglieder')
        state.degraded = false
        return rows.map((r) => toMember(r, userId))
      } catch {
        state.degraded = true
        return demoSource.allMembers(progress, now)
      }
    },
  }
}
