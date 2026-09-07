import type {
  MultipleChoiceItem,
  MultiSelectItem,
  ScenarioItem,
  TrueFalseItem,
} from '../../engine/types'
import { LETTERS, type ExerciseProps } from './common'

function optionClass(args: {
  revealed: boolean
  isSelected: boolean
  isCorrect: boolean
}): string {
  const { revealed, isSelected, isCorrect } = args
  if (!revealed) return isSelected ? 'option option--selected' : 'option'
  if (isCorrect) return 'option option--correct'
  if (isSelected) return 'option option--wrong'
  return 'option option--muted'
}

export function SingleChoice({
  item,
  value,
  onChange,
  revealed,
}: ExerciseProps<MultipleChoiceItem | ScenarioItem>) {
  const selected = value as number | null
  return (
    <>
      {item.type === 'scenario' && (
        <div className="card" style={{ marginBottom: 'var(--gf-space-6)' }}>
          <div className="tiny muted" style={{ marginBottom: 4 }}>
            {item.persona}
          </div>
          <div style={{ fontSize: 17, fontStyle: 'italic', lineHeight: 1.5 }}>
            „{item.quote}“
          </div>
        </div>
      )}
      <div className="prompt">{item.prompt}</div>
      <div className="options" role="radiogroup">
        {item.options.map((opt, i) => (
          <button
            key={i}
            className={optionClass({
              revealed,
              isSelected: selected === i,
              isCorrect: i === item.answer,
            })}
            onClick={() => onChange(i)}
            disabled={revealed}
            role="radio"
            aria-checked={selected === i}
          >
            <span className="option-key option-key--round">{LETTERS[i]}</span>
            <span>
              {opt}
              {revealed && item.type === 'scenario' && (
                <span className="tiny muted" style={{ display: 'block', marginTop: 4 }}>
                  {item.optionFeedback[i]}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

export function MultiChoice({ item, value, onChange, revealed }: ExerciseProps<MultiSelectItem>) {
  const picked = (value as number[]) ?? []
  const toggle = (i: number) =>
    onChange(picked.includes(i) ? picked.filter((p) => p !== i) : [...picked, i])

  return (
    <>
      <div className="prompt">{item.prompt}</div>
      <div className="options">
        {item.options.map((opt, i) => (
          <button
            key={i}
            className={optionClass({
              revealed,
              isSelected: picked.includes(i),
              isCorrect: item.answer.includes(i),
            })}
            onClick={() => toggle(i)}
            disabled={revealed}
            role="checkbox"
            aria-checked={picked.includes(i)}
          >
            <span className="option-key">{picked.includes(i) ? '✓' : ''}</span>
            <span>{opt}</span>
          </button>
        ))}
      </div>
    </>
  )
}

export function TrueFalse({ item, value, onChange, revealed }: ExerciseProps<TrueFalseItem>) {
  const selected = value as boolean | null
  const opts: { label: string; val: boolean; icon: string }[] = [
    { label: 'Stimmt', val: true, icon: '👍' },
    { label: 'Stimmt nicht', val: false, icon: '👎' },
  ]
  return (
    <>
      <div className="prompt">{item.statement}</div>
      <div className="options">
        {opts.map((o) => (
          <button
            key={o.label}
            className={optionClass({
              revealed,
              isSelected: selected === o.val,
              isCorrect: o.val === item.answer,
            })}
            onClick={() => onChange(o.val)}
            disabled={revealed}
          >
            <span className="option-key option-key--round">{o.icon}</span>
            <span>{o.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}
