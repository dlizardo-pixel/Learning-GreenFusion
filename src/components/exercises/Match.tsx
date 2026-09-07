import { useMemo, useState } from 'react'
import type { MatchItem } from '../../engine/types'
import type { ExerciseProps } from './common'

/** Zuordnung: links die Begriffe, rechts die Antworten aus einem Vorrat. */
export function Match({ item, value, onChange, revealed }: ExerciseProps<MatchItem>) {
  const map = (value as Record<string, string>) ?? {}
  // Die erste offene Zeile ist von Anfang an aktiv: so kann man einfach
  // die Antworten der Reihe nach antippen, ohne vorher jede Zeile zu wählen.
  const [activeLeft, setActiveLeft] = useState<string | null>(item.pairs[0]?.left ?? null)

  const pool = useMemo(() => {
    const rights = item.pairs.map((p) => p.right)
    let seed = [...item.id].reduce((a, c) => a + c.charCodeAt(0), 0) + 7
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
    for (let i = rights.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      ;[rights[i], rights[j]] = [rights[j], rights[i]]
    }
    return rights
  }, [item.id, item.pairs])

  const assign = (right: string) => {
    if (revealed) return
    const left = activeLeft ?? item.pairs.find((p) => !map[p.left])?.left
    if (!left) return
    const next = { ...map }
    // Eine Antwort kann nur einmal vergeben sein.
    for (const k of Object.keys(next)) if (next[k] === right) delete next[k]
    next[left] = right
    onChange(next)
    setActiveLeft(item.pairs.find((p) => !next[p.left])?.left ?? null)
  }

  const slotClass = (left: string) => {
    const v = map[left]
    if (revealed) {
      const correct = item.pairs.find((p) => p.left === left)?.right === v
      return `match-slot match-slot--filled ${correct ? 'match-slot--correct' : 'match-slot--wrong'}`
    }
    return `match-slot ${v ? 'match-slot--filled' : ''} ${
      activeLeft === left ? 'match-slot--active' : ''
    }`
  }

  return (
    <>
      <div className="prompt">{item.prompt}</div>
      <div className="match-grid">
        {item.pairs.map((p) => (
          <div className="match-row" key={p.left}>
            <div className="match-left">{p.left}</div>
            <button
              className={slotClass(p.left)}
              disabled={revealed}
              onClick={() => {
                if (map[p.left]) {
                  const next = { ...map }
                  delete next[p.left]
                  onChange(next)
                }
                setActiveLeft(p.left)
              }}
            >
              {map[p.left] ?? (activeLeft === p.left ? 'Antwort unten wählen' : '—')}
            </button>
          </div>
        ))}
      </div>

      {revealed ? (
        <div className="small muted" style={{ marginTop: 'var(--gf-space-4)' }}>
          {item.pairs
            .filter((p) => map[p.left] !== p.right)
            .map((p) => (
              <div key={p.left} style={{ marginTop: 4 }}>
                <strong>{p.left}</strong> → {p.right}
              </div>
            ))}
        </div>
      ) : (
        <div className="tiles">
          {pool.map((right) => {
            const used = Object.values(map).includes(right)
            return (
              <button
                key={right}
                className={`tile ${used ? 'tile--used' : ''}`}
                onClick={() => assign(right)}
                disabled={used}
                style={{ textAlign: 'left', maxWidth: '100%', fontWeight: 400, fontSize: 14 }}
              >
                {right}
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}
