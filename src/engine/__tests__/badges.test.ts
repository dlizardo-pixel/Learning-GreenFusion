import { describe, expect, it } from 'vitest'
import { badgeFor, BADGE_BOX } from '../badges'
import { emptyProgress } from '../progress'
import type { ItemProgress, Progress } from '../types'

const at = (box: number): ItemProgress => ({
  itemId: 'x',
  box,
  dueAt: '2026-09-03',
  lastSeenAt: '2026-09-03',
  timesCorrect: box,
  timesWrong: 0,
})

/** Lernstand, in dem die ersten n von total Items die Schwelle erreichen. */
function withMastered(n: number, total: number): { p: Progress; ids: string[] } {
  const p = emptyProgress()
  const ids = Array.from({ length: total }, (_, i) => `i${i}`)
  ids.forEach((id, i) => {
    p.items[id] = { ...at(i < n ? BADGE_BOX : BADGE_BOX - 1), itemId: id }
  })
  return { p, ids }
}

describe('Mastery-Abzeichen', () => {
  it('vergibt ohne Beherrschung kein Abzeichen', () => {
    const { p, ids } = withMastered(0, 12)
    const b = badgeFor(p, ids)
    expect(b.level).toBe('none')
    expect(b.mastered).toBe(0)
  })

  it('zählt Punkte nicht mit – nur Beherrschung', () => {
    // Wer viel klickt, bekommt viele XP, aber kein Gold.
    const { p, ids } = withMastered(0, 12)
    p.xp = 99_999
    expect(badgeFor(p, ids).level).toBe('none')
  })

  it('vergibt die Stufen an den Schwellen', () => {
    const total = 12
    expect(badgeFor(...arg(withMastered(3, total))).level).toBe('none') // 25 % – unter der Schwelle
    expect(badgeFor(...arg(withMastered(4, total))).level).toBe('bronze') // 33 %
    expect(badgeFor(...arg(withMastered(8, total))).level).toBe('silber') // 66 %
    expect(badgeFor(...arg(withMastered(11, total))).level).toBe('silber')
    expect(badgeFor(...arg(withMastered(12, total))).level).toBe('gold') // 100 %
  })

  it('erkennt Box 3 nicht als Beherrschung an – die Schwelle ist strenger als "sitzt"', () => {
    const p = emptyProgress()
    const ids = ['a', 'b', 'c']
    ids.forEach((id) => (p.items[id] = { ...at(3), itemId: id }))
    expect(badgeFor(p, ids).mastered).toBe(0)
    expect(badgeFor(p, ids).level).toBe('none')
  })

  it('sagt, wie viele Items zur nächsten Stufe fehlen', () => {
    const { p, ids } = withMastered(0, 12)
    const b = badgeFor(p, ids)
    expect(b.next).toEqual({ level: 'bronze', itemsMissing: 4 })

    const done = withMastered(12, 12)
    expect(badgeFor(done.p, done.ids).next).toBeNull()
  })

  it('kommt mit einer leeren Item-Liste zurecht', () => {
    const b = badgeFor(emptyProgress(), [])
    expect(b.level).toBe('none')
    expect(b.ratio).toBe(0)
  })
})

function arg({ p, ids }: { p: Progress; ids: string[] }): [Progress, string[]] {
  return [p, ids]
}
