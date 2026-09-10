import type { LearningModule, Progress } from '../engine/types'
import { itemsInModule, itemsInUnit, lessonPool } from '../data'
import { masteredCount, masteryRatio } from '../engine/progress'
import { badgeFor, BADGE_ICON, BADGE_LABEL } from '../engine/badges'
import { examFor, PASS_RATIO } from '../engine/exam'
import { hasLessonToday } from '../engine/lesson'

interface Props {
  module: LearningModule
  progress: Progress
  onStartUnit(unitId: string): void
  onStartExam(): void
  onBack(): void
}

/**
 * Der Lernpfad eines Moduls.
 *
 * Lektionen sind nicht gesperrt: wer morgen ein Angebotsgespräch hat, muss
 * direkt zu "Preismodell-Grundlagen" springen können. Die Lehrplan-Nummer
 * bleibt sichtbar, damit die App und das Curriculum aufeinander abbildbar
 * bleiben. Gesperrt ist nur die Abschlussprüfung — siehe Zertifikat.
 */
export function ModulePath({ module, progress, onStartUnit, onStartExam, onBack }: Props) {
  const moduleIds = itemsInModule(module.id).map((i) => i.id)
  const badge = badgeFor(progress, moduleIds)
  const exam = examFor(progress, module.id)

  // Die optionale Spur steht unter dem Lernpfad, nicht in ihm: sie ist kein
  // Schritt auf dem Weg zum Zertifikat, sondern ein Angebot daneben.
  const pflicht = module.units.filter((x) => !x.optional)
  const optional = module.units.filter((x) => x.optional)

  function renderUnit(unit: LearningModule['units'][number]) {
    const ids = itemsInUnit(unit.id).map((i) => i.id)
    const mastered = masteredCount(progress, ids)
    const done = (progress.unitsCompleted[unit.id] ?? 0) > 0
    const pct = masteryRatio(progress, ids) * 100
    // Was heute schon dran war, kommt heute nicht wieder. Dann hat die
    // Lektion nichts zu geben, und das gehört sichtbar an die Karte —
    // ein Tippen, das nichts tut, liest sich wie ein Fehler.
    const openToday = hasLessonToday({
      items: lessonPool(unit.id),
      progress,
      mode: 'unit',
      unitId: unit.id,
    })

    return (
      <button
        key={unit.id}
        className={`unit ${done ? 'unit--done' : ''} ${openToday ? '' : 'unit--resting'}`}
        data-testid={`unit-${unit.id}`}
        disabled={!openToday}
        onClick={() => onStartUnit(unit.id)}
      >
        <span className="unit-badge" aria-hidden="true">
          {done ? '✓' : unit.icon}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="course-meta">
            {unit.optional ? 'Optional' : `Lehrplan ${unit.code}`}
          </span>
          <span className="course-title" style={{ display: 'block' }}>
            {unit.title}
          </span>
          <span className="course-meta" style={{ display: 'block', marginTop: 2 }}>
            {unit.goal}
          </span>
          <span className="bar">
            <i style={{ width: `${pct}%`, background: module.color }} />
          </span>
          <span className="course-meta">
            {mastered}/{ids.length} sitzen
            {done && ` · ${progress.unitsCompleted[unit.id]}× abgeschlossen`}
            {!openToday && ' · heute erledigt'}
          </span>
        </span>
        <span aria-hidden="true" className="muted">
          ›
        </span>
      </button>
    )
  }

  return (
    <div className="app app--wide">
      <div className="topbar">
        <button className="btn btn--ghost" data-testid="back-home" onClick={onBack}>
          ‹ Übersicht
        </button>
        <span className="pill pill--xp">⚡ {progress.xp}</span>
      </div>

      <div className="module-kicker">Modul {module.number}</div>
      <h1 style={{ marginTop: 2 }}>
        <span aria-hidden="true">{module.icon}</span> {module.title}
      </h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {module.subtitle}
      </p>

      <div className="card badge-card">
        <span className="badge-big" aria-hidden="true">
          {BADGE_ICON[badge.level]}
        </span>
        <div>
          <strong>Mastery {BADGE_LABEL[badge.level]}</strong>
          <div className="small muted">
            {badge.mastered} von {badge.total} Aufgaben sicher beherrscht
            {badge.next
              ? ` · noch ${badge.next.itemsMissing} bis ${BADGE_LABEL[badge.next.level]}`
              : ' · vollständig'}
          </div>
          <div className="tiny muted" style={{ marginTop: 4 }}>
            Zählt erst ab vier richtigen Antworten in wachsenden Abständen — Abzeichen hängen an
            Können, nicht an Punkten.
          </div>
        </div>
      </div>

      <div className="section-label">Lektionen</div>
      <div className="path">{pflicht.map(renderUnit)}</div>

      {optional.length > 0 && (
        <>
          <div className="section-label">Optional</div>
          <p className="tiny muted" style={{ marginTop: 0 }}>
            Gesprächsführung und Vertriebsmethodik. Kommt nicht in der Tageslektion und zählt
            nicht für Abzeichen oder Prüfung — nur für die, die es brauchen.
          </p>
          <div className="path">{optional.map(renderUnit)}</div>
        </>
      )}

      <div className="section-label">Modulprüfung</div>
      <div className={`card exam-card ${exam.passed ? 'exam-card--passed' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gf-space-3)' }}>
          <span className="badge-big" aria-hidden="true">
            {exam.passed ? '🎖️' : '📝'}
          </span>
          <div style={{ flex: 1 }}>
            <strong>
              {exam.passed
                ? `Bestanden mit ${Math.round(exam.bestScore * 100)} %`
                : 'Noch nicht bestanden'}
            </strong>
            <div className="small muted">
              12 Fragen quer durch das Modul, bestanden ab {Math.round(PASS_RATIO * 100)} %.
              {exam.attempts > 0 &&
                !exam.passed &&
                ` Bisher ${exam.attempts} Versuch${exam.attempts === 1 ? '' : 'e'}, bester Wert ${Math.round(
                  exam.bestScore * 100,
                )} %.`}
            </div>
          </div>
        </div>
        <button
          className={`btn ${exam.passed ? 'btn--secondary' : 'btn--primary'} btn--block`}
          data-testid={`start-exam-${module.id}`}
          style={{ marginTop: 'var(--gf-space-4)' }}
          onClick={onStartExam}
        >
          {exam.passed ? 'Nochmal antreten' : 'Modulprüfung starten'}
        </button>
        {!exam.passed && (
          <div className="tiny muted" style={{ marginTop: 'var(--gf-space-2)' }}>
            In der Prüfung kommen Fehler nicht nochmal und die Auflösung erst am Ende. Ein
            Fehlversuch kostet nichts ausser Zeit.
          </div>
        )}
      </div>
    </div>
  )
}
