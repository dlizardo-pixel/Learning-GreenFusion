import type { OrderItem } from '../../engine/types'
import type { ExerciseProps } from './common'

/**
 * Reihenfolge mit Pfeiltasten statt Drag & Drop — funktioniert auf dem
 * Handy zuverlässig und ist mit Tastatur bedienbar.
 */
export function Order({ item, value, onChange, revealed }: ExerciseProps<OrderItem>) {
  const list = (value as string[]) ?? []

  const move = (from: number, to: number) => {
    if (revealed || to < 0 || to >= list.length) return
    const next = [...list]
    ;[next[from], next[to]] = [next[to], next[from]]
    onChange(next)
  }

  return (
    <>
      <div className="prompt">{item.prompt}</div>
      <div className="order-list">
        {list.map((step, i) => {
          const correctHere = item.steps[i] === step
          const cls = revealed
            ? `order-row ${correctHere ? 'order-row--correct' : 'order-row--wrong'}`
            : 'order-row'
          return (
            <div className={cls} key={step}>
              <span className="order-num">{i + 1}</span>
              <span className="order-text">{step}</span>
              {!revealed && (
                <span className="order-moves">
                  <button
                    className="order-move"
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
                    aria-label="nach oben"
                  >
                    ▲
                  </button>
                  <button
                    className="order-move"
                    onClick={() => move(i, i + 1)}
                    disabled={i === list.length - 1}
                    aria-label="nach unten"
                  >
                    ▼
                  </button>
                </span>
              )}
            </div>
          )
        })}
      </div>
      {revealed && (
        <div className="small muted" style={{ marginTop: 'var(--gf-space-4)' }}>
          <strong>Richtige Reihenfolge:</strong>
          <ol style={{ margin: '6px 0 0', paddingLeft: 20 }}>
            {item.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
      )}
    </>
  )
}
