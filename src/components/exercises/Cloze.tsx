import { useMemo, useState } from 'react'
import type { ClozeItem } from '../../engine/types'
import type { ExerciseProps } from './common'

/**
 * Lückentext mit Wortkacheln. Kein Freitext-Tippen: die Kacheln machen aus
 * einer Wissensfrage eine Entscheidungsfrage und vermeiden, dass ein
 * Tippfehler als Wissenslücke gewertet wird.
 */
export function Cloze({ item, value, onChange, revealed }: ExerciseProps<ClozeItem>) {
  const filled = (value as string[]) ?? []
  const [active, setActive] = useState(0)

  const tiles = useMemo(() => {
    const all = [...item.blanks, ...item.distractors]
    // Stabil gemischt über die Item-ID, damit die Reihenfolge beim
    // Neu-Rendern nicht springt.
    let seed = [...item.id].reduce((a, c) => a + c.charCodeAt(0), 0)
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      ;[all[i], all[j]] = [all[j], all[i]]
    }
    return all
  }, [item.id, item.blanks, item.distractors])

  const place = (word: string) => {
    if (revealed) return
    const next = [...filled]
    const slot = next[active] ? next.findIndex((v) => !v) : active
    next[slot === -1 ? active : slot] = word
    onChange(next)
    const nextEmpty = next.findIndex((v) => !v)
    setActive(nextEmpty === -1 ? active : nextEmpty)
  }

  const clear = (idx: number) => {
    if (revealed) return
    const next = [...filled]
    next[idx] = ''
    onChange(next)
    setActive(idx)
  }

  const usedCount = (word: string) => filled.filter((f) => f === word).length

  const blankClass = (idx: number) => {
    const v = filled[idx]
    if (revealed) return `blank ${v === item.blanks[idx] ? 'blank--correct' : 'blank--wrong'}`
    if (!v) return `blank blank--empty ${active === idx ? 'blank--active' : ''}`
    return `blank ${active === idx ? 'blank--active' : ''}`
  }

  // Template in Text- und Lücken-Segmente zerlegen.
  const segments = item.template.split(/(\{\{\d+\}\})/g)

  return (
    <>
      <div className="type-hint">Setze die passenden Wörter ein</div>
      <div className="cloze-text">
        {segments.map((seg, i) => {
          const m = seg.match(/^\{\{(\d+)\}\}$/)
          if (!m) return <span key={i}>{seg}</span>
          const idx = Number(m[1])
          return (
            <span
              key={i}
              className={blankClass(idx)}
              onClick={() => (filled[idx] ? clear(idx) : setActive(idx))}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  filled[idx] ? clear(idx) : setActive(idx)
                }
              }}
            >
              {filled[idx] || '?'}
            </span>
          )
        })}
      </div>

      {revealed ? (
        <div className="small muted" style={{ marginTop: 'var(--gf-space-6)' }}>
          Richtig wäre: <strong>{item.blanks.join(' · ')}</strong>
        </div>
      ) : (
        <div className="tiles">
          {tiles.map((word) => {
            const used = usedCount(word) > 0
            return (
              <button
                key={word}
                className={`tile ${used ? 'tile--used' : ''}`}
                onClick={() => place(word)}
                disabled={used}
              >
                {word}
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}
