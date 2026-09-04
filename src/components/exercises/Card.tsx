import type { CardItem } from '../../engine/types'
import { LETTERS, type ExerciseProps } from './common'

/**
 * Datenkarte mit Entscheidung.
 *
 * Für "Fernoptimierbar oder nicht?": die Karte zeigt Merkmale einer
 * konkreten Anlage, und es ist zu entscheiden, was daraus folgt. Das
 * trainiert die Urteilsbildung, die im Termin gebraucht wird — nicht
 * Reglermodelle auswendig zu kennen, sondern aus ihren Merkmalen die Folge
 * abzuleiten.
 */
export function Card({ item, value, onChange, revealed }: ExerciseProps<CardItem>) {
  const selected = value as number | null

  return (
    <>
      <div className="data-card">
        <div className="data-card-title">{item.cardTitle}</div>
        <dl className="data-card-facts">
          {item.cardFacts.map((f) => (
            <div className="data-card-row" key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="prompt">{item.prompt}</div>
      <div className="options" role="radiogroup">
        {item.options.map((opt, i) => {
          const cls = !revealed
            ? selected === i
              ? 'option option--selected'
              : 'option'
            : i === item.answer
              ? 'option option--correct'
              : selected === i
                ? 'option option--wrong'
                : 'option option--muted'
          return (
            <button
              key={i}
              className={cls}
              onClick={() => onChange(i)}
              disabled={revealed}
              role="radio"
              aria-checked={selected === i}
            >
              <span className="option-key option-key--round">{LETTERS[i]}</span>
              <span>
                {opt}
                {revealed && (
                  <span className="tiny muted" style={{ display: 'block', marginTop: 4 }}>
                    {item.optionFeedback[i]}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}
