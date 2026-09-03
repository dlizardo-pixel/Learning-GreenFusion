import { useEffect, useMemo, useState } from 'react'
import type { Progress } from '../engine/types'
import {
  daysLeftInWeek,
  rankByStreak,
  rankMembers,
  rankTeams,
  TIER_COLOR,
  TIER_LABEL,
  type LigaGroup,
  type LigaMember,
  type RankedMember,
} from '../engine/liga'
import { getLeaderboardSource, ME } from '../engine/leaderboard'

interface Props {
  progress: Progress
  onBack(): void
}

type Tab = 'punkte' | 'serie' | 'teams'

const TABS: { id: Tab; label: string }[] = [
  { id: 'punkte', label: 'Punkte' },
  { id: 'serie', label: 'Serie' },
  { id: 'teams', label: 'Teams' },
]

/** Nur die Spitze plus die eigene Umgebung — keine öffentliche Verlierer-Liste. */
const VISIBLE_TOP = 10

export function Liga({ progress, onBack }: Props) {
  const [tab, setTab] = useState<Tab>('punkte')
  const [group, setGroup] = useState<LigaGroup | null>(null)
  const [all, setAll] = useState<LigaMember[]>([])
  const source = getLeaderboardSource()

  useEffect(() => {
    let cancelled = false
    Promise.all([source.group(progress), source.allMembers(progress)]).then(([g, m]) => {
      if (cancelled) return
      setGroup(g)
      setAll(m)
    })
    return () => {
      cancelled = true
    }
  }, [progress, source])

  const ranked = useMemo(() => (group ? rankMembers(group) : []), [group])
  const streakRanked = useMemo(() => rankByStreak(all), [all])
  const teams = useMemo(() => rankTeams(all), [all])

  if (!group) {
    return (
      <div className="app">
        <div className="empty">Liga wird geladen …</div>
      </div>
    )
  }

  const days = daysLeftInWeek()
  const rows = tab === 'serie' ? streakRanked : ranked
  const me = rows.find((r) => r.userId === ME)

  return (
    <div className="app">
      <div className="topbar">
        <button className="btn btn--ghost" data-testid="back-home" onClick={onBack}>
          ‹ Übersicht
        </button>
        <span className="pill pill--streak">🔥 {progress.streak}</span>
      </div>

      <div className="liga-head" style={{ borderColor: TIER_COLOR[group.tier] }}>
        <span className="liga-badge" style={{ background: TIER_COLOR[group.tier] }} aria-hidden="true">
          🏆
        </span>
        <div>
          <h1 style={{ marginBottom: 2 }}>{TIER_LABEL[group.tier]}</h1>
          <div className="small muted">
            {days === 1 ? 'Letzter Tag dieser Woche' : `Noch ${days} Tage in dieser Woche`} · Montag
            beginnt alles neu
          </div>
        </div>
      </div>

      {source.isDemo && (
        <div className="notice" role="note">
          <strong>Beispieldaten.</strong> Ohne Backend gibt es noch keine echte Rangliste — die
          Namen sind Platzhalter. Nur deine eigene Zeile ist echt.
        </div>
      )}

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? 'tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'teams' ? (
        <>
          <p className="small muted">
            Gewertet wird der <strong>Durchschnitt der Aktiven</strong>, nicht die Summe — sonst
            gewinnt immer das grösste Team.
          </p>
          <div className="board">
            {teams.map((t) => (
              <div className="board-row" key={t.team}>
                <span className="board-pos">{t.position}</span>
                <span className="board-name">
                  {t.team}
                  <span className="board-sub">
                    {t.activeMembers} von {t.totalMembers} diese Woche aktiv
                  </span>
                </span>
                <span className="board-xp">{t.averageXp} XP</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="small muted">
            {tab === 'punkte'
              ? 'Die vier Besten steigen auf, die letzten vier ab. Wer diese Woche keine Punkte hat, steigt nicht ab.'
              : 'Beständigkeit statt Aufwand: diese Rangliste gewinnt man mit fünf Minuten am Tag.'}
          </p>
          <div className="board">
            {rows.slice(0, VISIBLE_TOP).map((m) => (
              <Row key={m.userId} m={m} tab={tab} tier={group.tier} />
            ))}
          </div>

          {me && me.position > VISIBLE_TOP && (
            <>
              <div className="board-gap" aria-hidden="true">
                ⋯
              </div>
              <div className="board">
                <Row m={me} tab={tab} tier={group.tier} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function Row({ m, tab }: { m: RankedMember; tab: Tab; tier: string }) {
  const isMe = m.userId === ME
  const zoneClass =
    tab === 'punkte' && m.zone === 'promote'
      ? 'board-row--promote'
      : tab === 'punkte' && m.zone === 'relegate'
        ? 'board-row--relegate'
        : ''

  return (
    <div className={`board-row ${isMe ? 'board-row--me' : ''} ${zoneClass}`}>
      <span className="board-pos">{m.position}</span>
      <span className="board-avatar" aria-hidden="true">
        {m.initials ?? '··'}
      </span>
      <span className="board-name">
        {m.name}
        {m.team && <span className="board-sub">{m.team}</span>}
      </span>
      {tab === 'punkte' ? (
        <span className="board-xp">{m.weeklyXp} XP</span>
      ) : (
        <span className="board-xp">
          🔥 {m.streak} {m.streak === 1 ? 'Tag' : 'Tage'}
        </span>
      )}
    </div>
  )
}
