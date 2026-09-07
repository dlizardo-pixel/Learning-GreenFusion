import type { LearningModule, Progress } from '../engine/types'
import { itemsInModule } from '../data'
import { canRepairStreak, dueCount, repairStreak, today } from '../engine/srs'
import { levelFromXp, masteredCount, masteryRatio, xpToday } from '../engine/progress'
import { daysLeftInWeek, xpThisWeek } from '../engine/liga'
import { badgeFor, BADGE_ICON, BADGE_LABEL } from '../engine/badges'
import { challengeCount, challengeDone, challengeForDay } from '../engine/challenge'
import { certificateStatus } from '../engine/exam'
import { Ring } from '../components/Ring'

interface Props {
  modules: LearningModule[]
  progress: Progress
  onProgress(p: Progress): void
  onStartDaily(): void
  onStartReview(): void
  onOpenModule(moduleId: LearningModule['id']): void
  onOpenLiga(): void
  onOpenCertificate(): void
  /** Nur gesetzt, wenn eine Anmeldung eingerichtet ist. */
  onSignOut?: () => void
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function currentWeekDays(): string[] {
  const out: string[] = []
  const now = new Date()
  const offset = (now.getDay() + 6) % 7
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() - offset + i)
    out.push(today(d))
  }
  return out
}

export function Home({
  modules,
  progress,
  onProgress,
  onStartDaily,
  onStartReview,
  onOpenModule,
  onOpenLiga,
  onOpenCertificate,
  onSignOut,
}: Props) {
  const due = dueCount(progress)
  const todayXp = xpToday(progress)
  const goalReached = todayXp >= progress.dailyGoal
  const week = currentWeekDays()
  const currentDay = today()
  const weekXp = xpThisWeek(progress)
  const frozen = new Set(progress.frozenDays)

  // Serien-Rettung: eine doppelte Tagesleistung holt die verlorene Serie
  // zurück. Der Aufwand muss echt sein, sonst ist die Serie bedeutungslos.
  const repairable = canRepairStreak(progress)
  const repairGoal = progress.dailyGoal * 2
  const repairReady = repairable && todayXp >= repairGoal

  const challenge = challengeForDay(currentDay)
  const challengeAt = challengeCount(progress, currentDay)
  const challengeFinished = challengeDone(progress, currentDay)

  const cert = certificateStatus(
    progress,
    modules.map((m) => m.id),
  )

  const moduleStats = modules.map((m) => {
    const ids = itemsInModule(m.id).map((i) => i.id)
    return {
      module: m,
      total: ids.length,
      mastered: masteredCount(progress, ids),
      touched: ids.filter((id) => progress.items[id]).length,
      ratio: masteryRatio(progress, ids),
      badge: badgeFor(progress, ids),
    }
  })

  return (
    <div className="app app--wide">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            🔥
          </span>
          <span>
            <span className="brand-name">Heizungsheld</span>
            <br />
            <span className="brand-sub">Green Fusion Lernapp</span>
          </span>
        </div>
        <div className="stat-pills">
          <span className="pill pill--streak" title={`Serie · ${progress.freezes} Schutztag(e)`}>
            🔥 {progress.streak}
            {progress.freezes > 0 && <span className="pill-sub">❄{progress.freezes}</span>}
          </span>
          <span className="pill pill--xp" title={`Level ${levelFromXp(progress.xp)}`}>
            ⚡ {progress.xp}
          </span>
        </div>
      </div>

      {repairable && (
        <div className="rescue" role="status">
          <div className="rescue-head">
            <span aria-hidden="true">🛟</span>
            <strong>Serie von {progress.lostStreak!.value} Tagen retten</strong>
          </div>
          <p className="small" style={{ margin: '4px 0 var(--gf-space-3)' }}>
            {repairReady
              ? 'Geschafft – du hast heute das Doppelte gelernt. Hol dir deine Serie zurück.'
              : `Lerne heute ${repairGoal} XP (das Doppelte), dann bekommst du sie zurück. ${todayXp} von ${repairGoal} XP.`}
          </p>
          {repairReady ? (
            <button
              className="btn btn--primary"
              data-testid="repair-streak"
              onClick={() => onProgress(repairStreak(progress))}
            >
              Serie zurückholen
            </button>
          ) : (
            <span className="bar">
              <i style={{ width: `${Math.min(100, (todayXp / repairGoal) * 100)}%` }} />
            </span>
          )}
        </div>
      )}

      <div className="home-hero">
      <div className="goal-card">
        <Ring value={todayXp} max={progress.dailyGoal} label={goalReached ? '✓' : `${todayXp}`} />
        <div style={{ flex: 1 }}>
          <h2>{goalReached ? 'Tagesziel geschafft' : 'Deine Lektion für heute'}</h2>
          <div className="small muted">
            {goalReached
              ? `${todayXp} von ${progress.dailyGoal} XP – alles Weitere ist Zugabe.`
              : `${todayXp} von ${progress.dailyGoal} XP · rund 4 Minuten`}
          </div>
          <button
            className="btn btn--primary"
            data-testid="start-daily"
            style={{ marginTop: 'var(--gf-space-4)' }}
            onClick={onStartDaily}
          >
            {todayXp > 0 ? 'Weiterlernen' : 'Lektion starten'}
          </button>
        </div>
      </div>

      <div className="week">
        {week.map((day, i) => {
          const learned = (progress.xpByDay[day] ?? 0) > 0
          const isFrozen = !learned && frozen.has(day)
          return (
            <div className="week-day" key={day}>
              <div
                className={`week-dot ${learned ? 'week-dot--hit' : ''} ${isFrozen ? 'week-dot--frozen' : ''}`}
                title={
                  isFrozen
                    ? `${day}: durch Schutztag überbrückt`
                    : `${day}: ${progress.xpByDay[day] ?? 0} XP`
                }
              >
                {learned ? '✓' : isFrozen ? '❄' : ''}
              </div>
              <div className="week-label" style={{ fontWeight: day === currentDay ? 700 : 400 }}>
                {WEEKDAYS[i]}
              </div>
            </div>
          )
        })}
      </div>
      </div>

      <div className="home-cards">
      <section className="home-card">
      <div className="section-label">Aufgabe des Tages</div>
      <div className={`card challenge ${challengeFinished ? 'challenge--done' : ''}`}>
        <div className="challenge-head">
          <span className="challenge-icon" aria-hidden="true">
            {challengeFinished ? '✓' : '🎯'}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{challenge.title}</strong>
            <div className="small muted">{challenge.description}</div>
          </div>
          <span className="challenge-xp">+{challenge.xp}</span>
        </div>
        <span className="bar" style={{ marginTop: 'var(--gf-space-3)' }}>
          <i style={{ width: `${Math.min(100, (challengeAt / challenge.target) * 100)}%` }} />
        </span>
        <div className="tiny muted" style={{ marginTop: 4 }}>
          {challengeFinished
            ? 'Erledigt – die Punkte sind schon drauf.'
            : `${challengeAt} von ${challenge.target}`}
        </div>
      </div>
      </section>

      <section className="home-card">
      <div className="section-label">Green Fusion Liga</div>
      <button
        className="course-card"
        data-testid="open-liga"
        onClick={onOpenLiga}
        style={{ borderLeftColor: '#E0A32E' }}
      >
        <span className="course-icon" style={{ background: '#FDF3DC' }} aria-hidden="true">
          🏆
        </span>
        <span className="course-body">
          <span className="course-title">{weekXp} XP diese Woche</span>
          <span className="course-meta">
            {daysLeftInWeek() === 1
              ? 'Letzter Tag – am Montag beginnt alles neu'
              : `Noch ${daysLeftInWeek()} Tage, dann startet die Woche neu`}
          </span>
        </span>
        <span aria-hidden="true" className="muted">
          ›
        </span>
      </button>
      </section>

      {due > 0 && (
        <section className="home-card">
          <div className="section-label">Wiederholung</div>
          <button
            className="course-card"
            data-testid="start-review"
            onClick={onStartReview}
            style={{ borderLeftColor: 'var(--gf-warning)' }}
          >
            <span className="course-icon" style={{ background: 'var(--gf-warning-bg)' }}>
              🔁
            </span>
            <span className="course-body">
              <span className="course-title">
                {due} {due === 1 ? 'Aufgabe' : 'Aufgaben'} fällig
              </span>
              <span className="course-meta">
                Wiederholungen bringen mehr XP als neue Aufgaben – und halten Wissen am längsten.
              </span>
            </span>
            <span aria-hidden="true" className="muted">
              ›
            </span>
          </button>
        </section>
      )}

      <section className="home-card">
      <div className="section-label">GF Heiz-Kompass</div>
      <button
        className="course-card"
        data-testid="open-certificate"
        onClick={onOpenCertificate}
        style={{ borderLeftColor: cert.earned ? 'var(--gf-primary)' : 'var(--gf-brand-grade-4)' }}
      >
        <span
          className="course-icon"
          style={{ background: cert.earned ? 'var(--gf-frosted-mint)' : 'var(--gf-polar-mist)' }}
          aria-hidden="true"
        >
          🎓
        </span>
        <span className="course-body">
          <span className="course-title">
            {cert.earned ? 'Zertifikat erreicht · Level 1' : 'Zertifikat Level 1'}
          </span>
          <span className="course-meta">
            {cert.modulesPassed} von {cert.modulesTotal} Modulprüfungen bestanden
            {cert.finalUnlocked && !cert.finalPassed && ' · Abschlussprüfung offen'}
          </span>
          <span className="bar">
            <i
              style={{
                width: `${(cert.modulesPassed / cert.modulesTotal) * 100}%`,
                background: 'var(--gf-primary)',
              }}
            />
          </span>
        </span>
        <span aria-hidden="true" className="muted">
          ›
        </span>
      </button>
      </section>
      </div>

      <div className="section-label">Module</div>
      <div className="course-grid">
        {moduleStats.map(({ module: m, total, mastered, touched, ratio, badge }) => (
          <button
            key={m.id}
            className="course-card"
            data-testid={`module-${m.id}`}
            style={{ borderLeftColor: m.color }}
            onClick={() => onOpenModule(m.id)}
          >
            <span className="course-icon" aria-hidden="true">
              {m.icon}
            </span>
            <span className="course-body">
              <span className="course-meta">Modul {m.number}</span>
              <span className="course-title">
                {m.title}
                {badge.level !== 'none' && (
                  <span className="badge-chip" title={`Mastery ${BADGE_LABEL[badge.level]}`}>
                    {BADGE_ICON[badge.level]} {BADGE_LABEL[badge.level]}
                  </span>
                )}
              </span>
              <span className="course-meta">{m.subtitle}</span>
              <span className="bar">
                <i style={{ width: `${ratio * 100}%`, background: m.color }} />
              </span>
              <span className="course-meta">
                {mastered} von {total} sitzen
                {touched > mastered && ` · ${touched - mastered} in Arbeit`}
              </span>
            </span>
            <span aria-hidden="true" className="muted">
              ›
            </span>
          </button>
        ))}
      </div>

      <div className="section-label">Serie</div>
      <div className="card small">
        <strong>
          {progress.streak} {progress.streak === 1 ? 'Tag' : 'Tage'} in Folge
        </strong>
        {progress.longestStreak > progress.streak && (
          <span className="muted"> · Bestwert {progress.longestStreak}</span>
        )}
        <div className="muted" style={{ marginTop: 4 }}>
          Fünf Minuten am Tag bringen mehr als eine Stunde im Monat. Der Grund ist nicht
          Motivation, sondern Vergessen: Wissen hält, wenn es kurz vor dem Verblassen nochmal
          auftaucht.
        </div>
        <div style={{ marginTop: 'var(--gf-space-3)' }}>
          <strong>
            ❄ {progress.freezes} {progress.freezes === 1 ? 'Schutztag' : 'Schutztage'}
          </strong>
          <div className="muted">
            Jede Woche kommt einer dazu, höchstens zwei auf Vorrat. Ein verpasster Tag wird
            automatisch überbrückt – Urlaub und Krankheit sollen keine Serie kosten.
          </div>
        </div>
      </div>

      {onSignOut && (
        <div style={{ marginTop: 'var(--gf-space-8)', textAlign: 'center' }}>
          <button className="btn btn--ghost" data-testid="sign-out" onClick={onSignOut}>
            Abmelden
          </button>
        </div>
      )}
    </div>
  )
}
