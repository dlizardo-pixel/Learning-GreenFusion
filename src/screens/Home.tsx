import type { Course, Progress } from '../engine/types'
import { itemsInCourse } from '../data'
import { dueCount, today } from '../engine/srs'
import { levelFromXp, xpToday } from '../engine/progress'
import { Ring } from '../components/Ring'

interface Props {
  courses: Course[]
  progress: Progress
  onStartDaily(): void
  onStartReview(): void
  onOpenCourse(courseId: Course['id']): void
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function lastSevenDays(): string[] {
  const out: string[] = []
  const now = new Date()
  // Montag der aktuellen Woche als Startpunkt.
  const offset = (now.getDay() + 6) % 7
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() - offset + i)
    out.push(today(d))
  }
  return out
}

export function Home({ courses, progress, onStartDaily, onStartReview, onOpenCourse }: Props) {
  const due = dueCount(progress)
  const todayXp = xpToday(progress)
  const goalReached = todayXp >= progress.dailyGoal
  const week = lastSevenDays()
  const currentDay = today()

  const courseStats = courses.map((c) => {
    const all = itemsInCourse(c.id)
    // "Sitzt" = mindestens Box 3 erreicht, also dreimal richtig in
    // wachsenden Abständen.
    const mastered = all.filter((i) => (progress.items[i.id]?.box ?? 0) >= 3).length
    const touched = all.filter((i) => progress.items[i.id]).length
    return { course: c, total: all.length, mastered, touched }
  })

  return (
    <div className="app">
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
          <span className="pill pill--streak" title="Serie in Tagen">
            🔥 {progress.streak}
          </span>
          <span className="pill pill--xp" title={`Level ${levelFromXp(progress.xp)}`}>
            ⚡ {progress.xp}
          </span>
        </div>
      </div>

      <div className="goal-card">
        <Ring
          value={todayXp}
          max={progress.dailyGoal}
          label={goalReached ? '✓' : `${todayXp}`}
        />
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
        {week.map((day, i) => (
          <div className="week-day" key={day}>
            <div
              className={`week-dot ${(progress.xpByDay[day] ?? 0) > 0 ? 'week-dot--hit' : ''}`}
              title={`${day}: ${progress.xpByDay[day] ?? 0} XP`}
            >
              {(progress.xpByDay[day] ?? 0) > 0 ? '✓' : ''}
            </div>
            <div className="week-label" style={{ fontWeight: day === currentDay ? 700 : 400 }}>
              {WEEKDAYS[i]}
            </div>
          </div>
        ))}
      </div>

      {due > 0 && (
        <>
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
                Kurz auffrischen, bevor es verblasst – das hält Wissen am längsten.
              </span>
            </span>
            <span aria-hidden="true" className="muted">
              ›
            </span>
          </button>
        </>
      )}

      <div className="section-label">Kurse</div>
      <div className="course-grid">
        {courseStats.map(({ course, total, mastered, touched }) => (
          <button
            key={course.id}
            className="course-card"
            data-testid={`course-${course.id}`}
            style={{ borderLeftColor: course.color }}
            onClick={() => onOpenCourse(course.id)}
          >
            <span className="course-icon" aria-hidden="true">
              {course.icon}
            </span>
            <span className="course-body">
              <span className="course-title">{course.title}</span>
              <span className="course-meta">{course.subtitle}</span>
              <span className="bar">
                <i style={{ width: `${total ? (mastered / total) * 100 : 0}%`, background: course.color }} />
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
        <strong>{progress.streak} Tage in Folge</strong>
        {progress.longestStreak > progress.streak && (
          <span className="muted"> · Bestwert {progress.longestStreak}</span>
        )}
        <div className="muted" style={{ marginTop: 4 }}>
          Fünf Minuten am Tag bringen mehr als eine Stunde im Monat. Der Grund ist nicht
          Motivation, sondern Vergessen: Wissen hält, wenn es kurz vor dem Verblassen
          nochmal auftaucht.
        </div>
      </div>
    </div>
  )
}
