import { useMemo, useState } from 'react'
import type { BucketsItem } from '../../engine/types'
import type { ExerciseProps } from './common'

/**
 * Einsortieren in Körbe.
 *
 * Für Zuständigkeiten ("Wer macht das?") und für den Aufbau eines
 * Heizsystems. Anders als bei der Zuordnung dürfen mehrere Begriffe in
 * denselben Korb — genau das ist bei Zuständigkeiten der Normalfall, und
 * genau daran scheitert eine Paar-Zuordnung.
 *
 * Bedienung: Begriff antippen, dann Korb antippen. Kein Drag & Drop, weil
 * das auf dem Handy unzuverlässig ist und mit Tastatur gar nicht geht.
 */
export function Buckets({ item, value, onChange, revealed }: ExerciseProps<BucketsItem>) {
  const map = (value as Record<string, string>) ?? {}
  const [active, setActive] = useState<string | null>(null)

  const pool = useMemo(() => {
    const list = item.entries.map((e) => e.text)
    let seed = [...item.id].reduce((a, c) => a + c.charCodeAt(0), 0)
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      ;[list[i], list[j]] = [list[j], list[i]]
    }
    return list
  }, [item.id, item.entries])

  const correctBucket = (text: string) => item.entries.find((e) => e.text === text)?.bucketId

  const assign = (bucketId: string) => {
    if (revealed) return
    const text = active ?? pool.find((t) => !map[t])
    if (!text) return
    onChange({ ...map, [text]: bucketId })
    setActive(pool.find((t) => t !== text && !map[t]) ?? null)
  }

  const unassign = (text: string) => {
    if (revealed) return
    const next = { ...map }
    delete next[text]
    onChange(next)
    setActive(text)
  }

  const open = pool.filter((t) => !map[t])

  return (
    <>
      <div className="prompt">{item.prompt}</div>

      {!revealed && (
        <div className="tiles" style={{ marginTop: 0, marginBottom: 'var(--gf-space-4)' }}>
          {open.length === 0 ? (
            <span className="small muted">Alles einsortiert.</span>
          ) : (
            open.map((text) => (
              <button
                key={text}
                className={`tile ${active === text ? 'tile--active' : ''}`}
                onClick={() => setActive(text)}
                style={{ fontWeight: 400, fontSize: 14, textAlign: 'left' }}
              >
                {text}
              </button>
            ))
          )}
        </div>
      )}

      <div className="bucket-grid">
        {item.buckets.map((b) => {
          const inside = pool.filter((t) => map[t] === b.id)
          return (
            <div className="bucket" key={b.id}>
              <button
                className="bucket-head"
                onClick={() => assign(b.id)}
                disabled={revealed || open.length === 0}
              >
                <strong>{b.label}</strong>
                {b.hint && <span className="bucket-hint">{b.hint}</span>}
              </button>
              <div className="bucket-body">
                {inside.length === 0 && !revealed && (
                  <span className="tiny muted">Begriff wählen, dann hier antippen</span>
                )}
                {inside.map((text) => {
                  const ok = correctBucket(text) === b.id
                  return (
                    <button
                      key={text}
                      className={`bucket-chip ${
                        revealed ? (ok ? 'bucket-chip--ok' : 'bucket-chip--no') : ''
                      }`}
                      onClick={() => unassign(text)}
                      disabled={revealed}
                    >
                      {revealed && <span aria-hidden="true">{ok ? '✓ ' : '✕ '}</span>}
                      {text}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {revealed && (
        <div className="small muted" style={{ marginTop: 'var(--gf-space-4)' }}>
          {item.entries
            .filter((e) => map[e.text] !== e.bucketId)
            .map((e) => (
              <div key={e.text} style={{ marginTop: 4 }}>
                <strong>{e.text}</strong> →{' '}
                {item.buckets.find((b) => b.id === e.bucketId)?.label}
              </div>
            ))}
        </div>
      )}
    </>
  )
}
