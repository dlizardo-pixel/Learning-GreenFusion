import type { Item } from '../engine/types'
import type { XpAward } from '../engine/scoring'

interface Props {
  item: Item
  correct: boolean
  /** Vergebene Punkte samt Grund, falls vorhanden. */
  award?: XpAward | null
  onNext(): void
  isLast: boolean
  /** Wird das Item später in dieser Lektion nochmal gezeigt? */
  willRepeat: boolean
}

/**
 * Rückmeldung nach jeder Antwort — der wichtigste Bildschirm der App.
 *
 * Die Erklärung erscheint auch bei richtiger Antwort. Wer richtig geraten
 * hat, lernt hier den Grund; wer es wusste, bekommt eine Bestätigung mit
 * Kontext. Und jede Erklärung nennt ihre Quelle, damit Wissen überprüfbar
 * bleibt und nicht in der App versauert.
 */
export function Feedback({ item, correct, award, onNext, isLast, willRepeat }: Props) {
  return (
    <div className={`feedback ${correct ? 'feedback--ok' : 'feedback--no'}`}>
      <div className="feedback-head">
        <span aria-hidden="true">{correct ? '✓' : '✕'}</span>
        <span>{correct ? 'Richtig' : 'Nicht ganz'}</span>
        {award && award.xp > 0 && (
          <span className="xp-chip">
            +{award.xp} XP · {award.reason}
          </span>
        )}
      </div>
      <div className="feedback-why">{item.why}</div>
      <div className="feedback-source">
        Quelle:{' '}
        {item.source.url ? (
          <a href={item.source.url} target="_blank" rel="noreferrer">
            {item.source.label}
          </a>
        ) : (
          item.source.label
        )}
      </div>
      {willRepeat && (
        <div className="tiny muted" style={{ marginTop: 8 }}>
          Diese Aufgabe kommt am Ende der Lektion nochmal.
        </div>
      )}
      <div className="feedback-actions">
        <button className="btn btn--primary btn--block btn--lg" onClick={onNext} autoFocus>
          {isLast ? 'Lektion abschliessen' : 'Weiter'}
        </button>
      </div>
    </div>
  )
}
