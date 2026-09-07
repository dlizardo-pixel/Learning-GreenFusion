import { useState } from 'react'
import type { DialogueItem } from '../../engine/types'
import { LETTERS, type ExerciseProps } from './common'

/**
 * Mehrstufige Gesprächssimulation.
 *
 * Entscheidend ist der Zeitpunkt der Rückmeldung: während des Gesprächs
 * sieht man nur, **wie die Person reagiert** — nicht, ob die Antwort gut
 * war. Die Auswertung kommt am Ende.
 *
 * Das ist Absicht. In einem echten Termin sagt niemand mitten im Satz, dass
 * man es vergeigt hat; man merkt es an der Reaktion und erfährt es im
 * Debrief. Wer stattdessen nach jedem Zug ein grünes Häkchen bekommt,
 * trainiert Multiple-Choice und nicht Gesprächsführung.
 */
export function Dialogue({ item, value, onChange, revealed, grade }: ExerciseProps<DialogueItem>) {
  const picks = (value as number[]) ?? []
  const [turn, setTurn] = useState(0)
  /** Reaktion nach der Wahl anzeigen, bevor es weitergeht. */
  const [showReaction, setShowReaction] = useState(false)

  if (revealed) {
    const hits = item.turns.filter((t, i) => picks[i] === t.answer).length
    return (
      <>
        <div className="type-hint">Auswertung</div>
        <h2>
          {hits} von {item.turns.length} Zügen gut gelöst
        </h2>
        <div className="dialogue-review">
          {item.turns.map((t, i) => {
            const ok = picks[i] === t.answer
            return (
              <div className={`review-turn ${ok ? 'review-turn--ok' : 'review-turn--no'}`} key={i}>
                <div className="tiny muted">Zug {i + 1}</div>
                <div className="review-says">„{t.says}"</div>
                <div className="small" style={{ marginTop: 6 }}>
                  <strong>Deine Wahl:</strong> {t.options[picks[i]] ?? '–'}
                </div>
                <div className="small" style={{ marginTop: 4 }}>
                  {t.optionFeedback[picks[i]]}
                </div>
                {!ok && (
                  <div
                    className="small"
                    style={{ marginTop: 6, color: 'var(--gf-jungle-dark)' }}
                  >
                    <strong>Besser:</strong> {t.options[t.answer]}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {grade && !grade.correct && (
          <div className="small muted" style={{ marginTop: 'var(--gf-space-4)' }}>
            Bestanden ab {Math.ceil(item.passRatio * item.turns.length)} von {item.turns.length}
            {' '}Zügen. Das Gespräch kommt am Ende der Lektion nochmal.
          </div>
        )}
      </>
    )
  }

  const current = item.turns[turn]
  const done = turn >= item.turns.length

  return (
    <>
      <div className="type-hint">
        Gespräch · Zug {Math.min(turn + 1, item.turns.length)} von {item.turns.length}
      </div>

      <div className="card dialogue-setup">
        <div className="tiny muted" style={{ marginBottom: 4 }}>
          {item.persona}
        </div>
        <div className="small">{item.situation}</div>
      </div>

      {done ? (
        <div className="card" style={{ marginTop: 'var(--gf-space-4)', textAlign: 'center' }}>
          <strong>Gespräch geführt.</strong>
          <div className="small muted" style={{ marginTop: 4 }}>
            Jetzt auswerten – du siehst Zug für Zug, was gut lief.
          </div>
        </div>
      ) : (
        <>
          <div className="dialogue-says">„{current.says}"</div>

          {showReaction ? (
            <>
              <div className="dialogue-reaction">
                <div className="tiny muted" style={{ marginBottom: 4 }}>
                  Reaktion
                </div>
                {current.reaction}
              </div>
              <button
                className="btn btn--secondary btn--block"
                style={{ marginTop: 'var(--gf-space-4)' }}
                onClick={() => {
                  setShowReaction(false)
                  setTurn(turn + 1)
                }}
              >
                {turn + 1 >= item.turns.length ? 'Gespräch beenden' : 'Weiter im Gespräch'}
              </button>
            </>
          ) : (
            <>
              <div className="prompt" style={{ fontSize: 18 }}>
                {current.prompt}
              </div>
              <div className="options">
                {current.options.map((opt, i) => (
                  <button
                    key={i}
                    className="option"
                    onClick={() => {
                      const next = [...picks]
                      next[turn] = i
                      onChange(next)
                      setShowReaction(true)
                    }}
                  >
                    <span className="option-key option-key--round">{LETTERS[i]}</span>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
