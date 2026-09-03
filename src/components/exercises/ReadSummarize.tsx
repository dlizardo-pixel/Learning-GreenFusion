import { useState } from 'react'
import type { ReadSummarizeItem } from '../../engine/types'
import type { ExerciseProps } from './common'

/**
 * Vertiefungsaufgabe: erst lesen, dann in eigenen Worten zusammenfassen.
 *
 * Das ist der einzige Aufgabentyp, bei dem man nichts erraten kann — und
 * damit der einzige, der wirklich zeigt, ob ein Thema verstanden wurde.
 * Nach der Abgabe erscheint, welche Punkte abgedeckt waren, welche fehlten,
 * und eine Musterlösung zum Vergleich.
 */
export function ReadSummarize({
  item,
  value,
  onChange,
  revealed,
  grade,
}: ExerciseProps<ReadSummarizeItem>) {
  const [reading, setReading] = useState(true)
  const text = (value as string) ?? ''
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const missing = new Set(grade?.detail ?? [])

  if (reading && !revealed) {
    return (
      <>
        <div className="type-hint">Lesen · etwa 2 Minuten</div>
        <h2>{item.title}</h2>
        <div className="passage">
          {item.passage.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <div className="sticky-actions">
          <button className="btn btn--primary btn--block btn--lg" onClick={() => setReading(false)}>
            Gelesen – jetzt zusammenfassen
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="type-hint">Zusammenfassen</div>
      <div className="prompt">{item.prompt}</div>

      {!revealed && (
        <details style={{ marginBottom: 'var(--gf-space-4)' }}>
          <summary className="small" style={{ cursor: 'pointer', color: 'var(--gf-fusion-blue)' }}>
            Text nochmal ansehen
          </summary>
          <div className="passage" style={{ marginTop: 'var(--gf-space-3)' }}>
            {item.passage.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </details>
      )}

      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        disabled={revealed}
        placeholder="Schreib zwei bis vier Sätze in eigenen Worten …"
        aria-label="Deine Zusammenfassung"
      />
      <div className="char-count">
        {words} {words === 1 ? 'Wort' : 'Wörter'}
      </div>

      {revealed && (
        <>
          <div className="card" style={{ marginTop: 'var(--gf-space-4)' }}>
            <h3 style={{ marginBottom: 'var(--gf-space-2)' }}>
              {Math.round((grade?.score ?? 0) * item.rubric.length)} von {item.rubric.length}{' '}
              Punkten abgedeckt
            </h3>
            <ul className="rubric-list">
              {item.rubric.map((r) => {
                const missed = missing.has(r.hint)
                return (
                  <li key={r.concept}>
                    <span aria-hidden="true">{missed ? '○' : '●'}</span>
                    <span style={{ color: missed ? 'var(--gf-steel-smoke)' : 'inherit' }}>
                      <strong>{r.concept}</strong>
                      {missed && <> — {r.hint}</>}
                    </span>
                  </li>
                )
              })}
            </ul>
            {grade?.detail?.some((d) => d.startsWith('Schreib mindestens')) && (
              <div className="small" style={{ color: 'var(--gf-warning-dark)', marginTop: 8 }}>
                {grade.detail[0]}
              </div>
            )}
          </div>

          <div
            className="card"
            style={{ marginTop: 'var(--gf-space-3)', background: 'var(--gf-light-frosted-mint)' }}
          >
            <div className="tiny muted" style={{ marginBottom: 4, fontWeight: 600 }}>
              MUSTERLÖSUNG ZUM VERGLEICH
            </div>
            <div className="small" style={{ lineHeight: 1.6 }}>
              {item.modelAnswer}
            </div>
          </div>
        </>
      )}
    </>
  )
}
