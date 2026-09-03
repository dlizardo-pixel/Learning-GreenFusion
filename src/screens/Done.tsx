import type { LessonResult } from './Lesson'

interface Props {
  result: LessonResult
  onHome(): void
  onAgain(): void
}

function encouragement(ratio: number): string {
  if (ratio === 1) return 'Alles auf den ersten Versuch. Das sitzt.'
  if (ratio >= 0.75) return 'Solide. Die Wackelkandidaten kommen in ein paar Tagen wieder.'
  if (ratio >= 0.4) return 'Genau dafür ist die App da. Was hier wehtut, sitzt beim nächsten Mal.'
  return 'Neues Thema, klar. Die Wiederholung in den nächsten Tagen macht den Unterschied.'
}

export function Done({ result, onHome, onAgain }: Props) {
  const ratio = result.answered ? result.correctFirstTry / result.answered : 0

  return (
    <div className="app">
      <div className="done">
        <div className="done-emoji" aria-hidden="true">
          {ratio >= 0.75 ? '🎉' : '💪'}
        </div>
        <h1 data-testid="lesson-done">Lektion geschafft</h1>
        <p className="muted">{result.title}</p>

        <div className="done-stats">
          <div className="done-stat">
            <b>+{result.xpEarned}</b>
            <span>XP</span>
          </div>
          <div className="done-stat">
            <b>
              {result.correctFirstTry}/{result.answered}
            </b>
            <span>erste Versuche</span>
          </div>
          <div className="done-stat">
            <b>{result.streak}</b>
            <span>Tage Serie</span>
          </div>
        </div>

        <p style={{ maxWidth: 380, margin: '0 auto var(--gf-space-8)' }}>
          {encouragement(ratio)}
        </p>

        <button className="btn btn--primary btn--lg" data-testid="lesson-again" onClick={onAgain}>
          Noch eine Lektion
        </button>
        <div style={{ marginTop: 'var(--gf-space-3)' }}>
          <button className="btn btn--ghost" data-testid="lesson-home" onClick={onHome}>
            Zur Übersicht
          </button>
        </div>
      </div>
    </div>
  )
}
