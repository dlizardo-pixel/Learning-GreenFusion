import type { Course, Progress } from '../engine/types'
import { itemsInUnit } from '../data'
import { masteredCount, masteryRatio } from '../engine/progress'

interface Props {
  course: Course
  progress: Progress
  onStartUnit(unitId: string): void
  onBack(): void
}

/**
 * Lernpfad eines Kurses.
 *
 * Anders als bei Duolingo sind spätere Lektionen nicht gesperrt. Grund:
 * Ein Vertriebler, der morgen ein Angebotsgespräch hat, muss direkt zu
 * "Preise & Pakete" springen können, ohne sich vorher durch Heizkreise zu
 * arbeiten. Die empfohlene Reihenfolge bleibt sichtbar – aber sie ist eine
 * Empfehlung, kein Tor.
 */
export function CoursePath({ course, progress, onStartUnit, onBack }: Props) {
  return (
    <div className="app">
      <div className="topbar">
        <button className="btn btn--ghost" data-testid="back-home" onClick={onBack}>
          ‹ Übersicht
        </button>
        <span className="pill pill--xp">⚡ {progress.xp}</span>
      </div>

      <h1>
        <span aria-hidden="true">{course.icon}</span> {course.title}
      </h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {course.subtitle}
      </p>

      <div className="path" style={{ marginTop: 'var(--gf-space-6)' }}>
        {course.units.map((unit, idx) => {
          const ids = itemsInUnit(unit.id).map((i) => i.id)
          const mastered = masteredCount(progress, ids)
          const done = (progress.unitsCompleted[unit.id] ?? 0) > 0
          const pct = masteryRatio(progress, ids) * 100

          return (
            <button
              key={unit.id}
              className={`unit ${done ? 'unit--done' : ''}`}
              data-testid={`unit-${unit.id}`}
              onClick={() => onStartUnit(unit.id)}
            >
              <span className="unit-badge" aria-hidden="true">
                {done ? '✓' : unit.icon}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="course-meta">Lektion {idx + 1}</span>
                <span className="course-title" style={{ display: 'block' }}>
                  {unit.title}
                </span>
                <span className="course-meta" style={{ display: 'block', marginTop: 2 }}>
                  {unit.goal}
                </span>
                <span className="bar">
                  <i style={{ width: `${pct}%`, background: course.color }} />
                </span>
                <span className="course-meta">
                  {mastered}/{ids.length} sitzen
                  {done && ` · ${progress.unitsCompleted[unit.id]}× abgeschlossen`}
                </span>
              </span>
              <span aria-hidden="true" className="muted">
                ›
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
