/**
 * Lernstand in Supabase.
 *
 * Erfüllt denselben Vertrag wie der lokale Speicher (`StorageAdapter`),
 * deshalb muss die Oberfläche für den Wechsel nicht angepasst werden.
 *
 * Zwei Eigenschaften, die im Alltag zählen:
 *
 * 1. **Schreiben blockiert das Lernen nicht.** Speichern läuft im
 *    Hintergrund; schlägt es fehl, lernt man weiter und der Stand geht beim
 *    nächsten Speichern mit. Eine Lektion darf nie an einem Netzwackler
 *    scheitern.
 * 2. **Lokaler Spiegel.** Jeder Stand wird zusätzlich lokal gehalten. Ohne
 *    Netz startet die App mit dem letzten bekannten Stand statt leer.
 */
import type { StorageAdapter } from '../engine/progress'
import { emptyProgress, localStorageAdapter } from '../engine/progress'
import type { ItemProgress, Progress } from '../engine/types'
import { supabase } from './supabase'

interface ItemRow {
  item_id: string
  box: number
  due_at: string
  last_seen_at: string
  times_correct: number
  times_wrong: number
}

interface ProfileRow {
  daily_goal: number
  freezes: number
  freeze_granted_week: string | null
  frozen_days: string[] | null
  lost_streak_value: number | null
  lost_streak_on: string | null
  challenge_day: string | null
  challenge_count: number | null
  challenge_claimed: boolean | null
}

/** Serie aus den Aktivitätstagen ableiten, statt einen Zähler zu speichern. */
export function streakFromDays(days: string[], frozenDays: string[], todayStr: string): number {
  const active = new Set([...days, ...frozenDays])
  if (!active.has(todayStr)) {
    // Gestern zählt auch – der heutige Tag kann noch kommen.
    const y = new Date(todayStr)
    y.setDate(y.getDate() - 1)
    const yStr = y.toISOString().slice(0, 10)
    if (!active.has(yStr)) return 0
  }
  let streak = 0
  const cursor = new Date(todayStr)
  if (!active.has(todayStr)) cursor.setDate(cursor.getDate() - 1)
  for (;;) {
    const key = cursor.toISOString().slice(0, 10)
    if (!active.has(key)) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function supabaseStorageAdapter(userId: string): StorageAdapter {
  if (!supabase) throw new Error('Supabase ist nicht konfiguriert')
  const db = supabase

  return {
    async load(): Promise<Progress> {
      const mirrored = await localStorageAdapter.load()
      try {
        const [profile, itemRows, activity, lessons] = await Promise.all([
          db.from('app_user').select('*').eq('id', userId).maybeSingle(),
          db.from('item_progress').select('*').eq('user_id', userId),
          db.from('daily_activity').select('day, xp').eq('user_id', userId),
          db.from('lesson_completion').select('unit_id, count').eq('user_id', userId),
        ])

        const p = profile.data as ProfileRow | null
        const items: Record<string, ItemProgress> = {}
        for (const r of (itemRows.data ?? []) as ItemRow[]) {
          items[r.item_id] = {
            itemId: r.item_id,
            box: r.box,
            dueAt: r.due_at,
            lastSeenAt: r.last_seen_at,
            timesCorrect: r.times_correct,
            timesWrong: r.times_wrong,
          }
        }

        const xpByDay: Record<string, number> = {}
        for (const r of (activity.data ?? []) as { day: string; xp: number }[]) {
          xpByDay[r.day] = r.xp
        }

        const unitsCompleted: Record<string, number> = {}
        for (const r of (lessons.data ?? []) as { unit_id: string; count: number }[]) {
          unitsCompleted[r.unit_id] = r.count
        }

        const days = Object.keys(xpByDay).filter((d) => (xpByDay[d] ?? 0) > 0)
        const frozenDays = p?.frozen_days ?? []
        const todayStr = new Date().toISOString().slice(0, 10)
        const streak = streakFromDays(days, frozenDays, todayStr)

        return {
          ...emptyProgress(),
          xp: Object.values(xpByDay).reduce((a, b) => a + b, 0),
          streak,
          longestStreak: Math.max(streak, mirrored.longestStreak),
          lastActiveDay: days.sort().at(-1) ?? null,
          dailyGoal: p?.daily_goal ?? 50,
          xpByDay,
          items,
          unitsCompleted,
          freezes: p?.freezes ?? 1,
          freezeGrantedWeek: p?.freeze_granted_week ?? null,
          frozenDays,
          lostStreak:
            p?.lost_streak_value && p.lost_streak_on
              ? { value: p.lost_streak_value, lostOn: p.lost_streak_on }
              : null,
          challenge: p?.challenge_day
            ? {
                day: p.challenge_day,
                count: p.challenge_count ?? 0,
                claimed: p.challenge_claimed ?? false,
              }
            : null,
        }
      } catch {
        // Kein Netz oder Backend gestört: mit dem lokalen Spiegel starten.
        return mirrored
      }
    },

    async save(progress: Progress) {
      // Immer zuerst lokal – das darf nicht fehlschlagen.
      await localStorageAdapter.save(progress)

      try {
        const itemRows = Object.values(progress.items).map((i) => ({
          user_id: userId,
          item_id: i.itemId,
          box: i.box,
          due_at: i.dueAt,
          last_seen_at: i.lastSeenAt,
          times_correct: i.timesCorrect,
          times_wrong: i.timesWrong,
        }))
        const activityRows = Object.entries(progress.xpByDay).map(([day, xp]) => ({
          user_id: userId,
          day,
          xp,
        }))
        const lessonRows = Object.entries(progress.unitsCompleted).map(([unit_id, count]) => ({
          user_id: userId,
          unit_id,
          count,
        }))

        await Promise.all([
          db
            .from('app_user')
            .update({
              daily_goal: progress.dailyGoal,
              freezes: progress.freezes,
              freeze_granted_week: progress.freezeGrantedWeek,
              frozen_days: progress.frozenDays,
              lost_streak_value: progress.lostStreak?.value ?? null,
              lost_streak_on: progress.lostStreak?.lostOn ?? null,
              challenge_day: progress.challenge?.day ?? null,
              challenge_count: progress.challenge?.count ?? null,
              challenge_claimed: progress.challenge?.claimed ?? null,
            })
            .eq('id', userId),
          itemRows.length
            ? db.from('item_progress').upsert(itemRows, { onConflict: 'user_id,item_id' })
            : Promise.resolve(),
          activityRows.length
            ? db.from('daily_activity').upsert(activityRows, { onConflict: 'user_id,day' })
            : Promise.resolve(),
          lessonRows.length
            ? db.from('lesson_completion').upsert(lessonRows, { onConflict: 'user_id,unit_id' })
            : Promise.resolve(),
        ])
      } catch {
        /* Lokal ist gespeichert; der Server holt beim nächsten Mal auf. */
      }
    },
  }
}
