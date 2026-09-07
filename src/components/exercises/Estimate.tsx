import type { EstimateItem } from '../../engine/types'
import type { ExerciseProps } from './common'

/**
 * Schätzaufgabe mit Schieberegler und Toleranz.
 *
 * Für Zahlen, bei denen die Größenordnung zählt, nicht die Ziffer:
 * Preise, Schwellwerte, Fristen. Der Regler zwingt zu einer Festlegung,
 * die Toleranz verzeiht die Rundung.
 */
export function Estimate({ item, value, onChange, revealed }: ExerciseProps<EstimateItem>) {
  const v = (value as number) ?? item.min
  const fmt = (n: number) => n.toLocaleString('de-DE')
  const off = Math.abs(v - item.answer)

  return (
    <>
      <div className="prompt">{item.prompt}</div>
      <div className="estimate-value">
        {fmt(v)}
        <span className="estimate-unit">{item.unit}</span>
      </div>
      <input
        type="range"
        min={item.min}
        max={item.max}
        step={item.step}
        value={v}
        disabled={revealed}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={item.prompt}
      />
      <div className="estimate-scale">
        <span>
          {fmt(item.min)} {item.unit}
        </span>
        <span>
          {fmt(item.max)} {item.unit}
        </span>
      </div>
      {revealed && (
        <div
          className="card"
          style={{
            marginTop: 'var(--gf-space-4)',
            background: off <= item.tolerance ? 'var(--gf-success-bg)' : 'var(--gf-error-bg)',
            borderColor: off <= item.tolerance ? 'var(--gf-success)' : 'var(--gf-error)',
            padding: 'var(--gf-space-4)',
          }}
        >
          <strong>
            Richtig: {fmt(item.answer)} {item.unit}
          </strong>
          <div className="small muted">
            Deine Schätzung lag {off === 0 ? 'genau richtig' : `${fmt(off)} ${item.unit} daneben`} ·
            akzeptiert wird ± {fmt(item.tolerance)} {item.unit}
          </div>
        </div>
      )}
    </>
  )
}
