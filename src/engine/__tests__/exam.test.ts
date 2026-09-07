import { describe, expect, it } from 'vitest'
import {
  buildExam,
  certificateStatus,
  EXAM_SIZE,
  examFor,
  examPassed,
  FINAL,
  FINAL_EXAM_SIZE,
  finalExamUnlocked,
  PASS_RATIO,
  recordExamAttempt,
} from '../exam'
import { emptyProgress } from '../progress'
import { items, modules } from '../../data'
import type { Progress } from '../types'

const seeded = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}

const moduleIds = modules.map((m) => m.id)
const D = (s: string) => new Date(`${s}T12:00:00`)

/** Lernstand mit bestandenen Prüfungen für die genannten Module. */
function withPassed(ids: string[]): Progress {
  let p = emptyProgress()
  for (const id of ids) p = recordExamAttempt(p, id, 1)
  return p
}

describe('Prüfung zusammenstellen', () => {
  it('zieht nur Fragen des gewählten Moduls', () => {
    for (const m of modules) {
      const exam = buildExam({ items, examId: m.id, random: seeded(1) })
      expect(exam.length, `Modul ${m.number}`).toBe(EXAM_SIZE)
      for (const i of exam) expect(i.moduleId).toBe(m.id)
    }
  })

  it('deckt jede Lektion des Moduls ab, statt zufällig zu greifen', () => {
    // Eine Prüfung, die eine halbe Lektion auslässt, prüft das Modul nicht.
    for (const m of modules) {
      const exam = buildExam({ items, examId: m.id, random: seeded(7) })
      const covered = new Set(exam.map((i) => i.unitId))
      const expected = Math.min(m.units.length, EXAM_SIZE)
      expect(covered.size, `Modul ${m.number} deckt zu wenige Lektionen ab`).toBeGreaterThanOrEqual(
        expected,
      )
    }
  })

  it('stellt keine Frage doppelt', () => {
    for (const m of modules) {
      const exam = buildExam({ items, examId: m.id, random: seeded(3) })
      expect(new Set(exam.map((i) => i.id)).size).toBe(exam.length)
    }
  })

  it('zieht in der Abschlussprüfung über alle Module', () => {
    const exam = buildExam({ items, examId: FINAL, random: seeded(4) })
    expect(exam.length).toBe(FINAL_EXAM_SIZE)
    expect(new Set(exam.map((i) => i.moduleId)).size).toBe(modules.length)
  })

  it('liefert eine leere Prüfung für ein unbekanntes Modul, statt zu werfen', () => {
    expect(buildExam({ items, examId: 'gibt-es-nicht' })).toEqual([])
  })
})

describe('Prüfungsergebnis verbuchen', () => {
  it('bestehen ab der Grenze', () => {
    const p = recordExamAttempt(emptyProgress(), 'm1-grundlagen', PASS_RATIO)
    expect(examPassed(p, 'm1-grundlagen')).toBe(true)
  })

  it('knapp darunter ist nicht bestanden', () => {
    const p = recordExamAttempt(emptyProgress(), 'm1-grundlagen', PASS_RATIO - 0.01)
    expect(examPassed(p, 'm1-grundlagen')).toBe(false)
    expect(examFor(p, 'm1-grundlagen').attempts).toBe(1)
  })

  it('ein Fehlversuch nach dem Bestehen nimmt das Bestehen nicht weg', () => {
    // Sonst wäre Üben nach der Prüfung riskant – und genau das wollen wir.
    let p = recordExamAttempt(emptyProgress(), 'm1-grundlagen', 0.9)
    p = recordExamAttempt(p, 'm1-grundlagen', 0.3)
    expect(examPassed(p, 'm1-grundlagen')).toBe(true)
    expect(examFor(p, 'm1-grundlagen').bestScore).toBeCloseTo(0.9)
    expect(examFor(p, 'm1-grundlagen').attempts).toBe(2)
  })

  it('hält den besten Wert und das Datum des Bestehens', () => {
    let p = recordExamAttempt(emptyProgress(), 'm1-grundlagen', 0.5, D('2026-09-01'))
    expect(examFor(p, 'm1-grundlagen').passedAt).toBeNull()
    p = recordExamAttempt(p, 'm1-grundlagen', 0.85, D('2026-09-04'))
    expect(examFor(p, 'm1-grundlagen').passedAt).toBe('2026-09-04')
    p = recordExamAttempt(p, 'm1-grundlagen', 1, D('2026-09-10'))
    // Das Datum bleibt beim ersten Bestehen stehen.
    expect(examFor(p, 'm1-grundlagen').passedAt).toBe('2026-09-04')
    expect(examFor(p, 'm1-grundlagen').bestScore).toBe(1)
  })

  it('zählt Versuche je Prüfung getrennt', () => {
    let p = recordExamAttempt(emptyProgress(), 'm1-grundlagen', 0.4)
    p = recordExamAttempt(p, 'm2-regelung', 0.9)
    expect(examFor(p, 'm1-grundlagen').attempts).toBe(1)
    expect(examFor(p, 'm2-regelung').attempts).toBe(1)
    expect(examFor(p, 'm3-produkt').attempts).toBe(0)
  })
})

describe('Abschlussprüfung und Zertifikat', () => {
  it('bleibt gesperrt, solange eine Modulprüfung offen ist', () => {
    const p = withPassed(moduleIds.slice(0, -1))
    expect(finalExamUnlocked(p, moduleIds)).toBe(false)
    expect(certificateStatus(p, moduleIds).modulesPassed).toBe(moduleIds.length - 1)
  })

  it('öffnet, wenn alle Modulprüfungen bestanden sind', () => {
    const p = withPassed(moduleIds)
    expect(finalExamUnlocked(p, moduleIds)).toBe(true)
    const s = certificateStatus(p, moduleIds)
    expect(s.finalUnlocked).toBe(true)
    expect(s.earned).toBe(false) // Abschlussprüfung noch offen
  })

  it('gibt das Zertifikat erst nach der Abschlussprüfung', () => {
    let p = withPassed(moduleIds)
    p = recordExamAttempt(p, FINAL, 0.9, D('2026-10-01'))
    const s = certificateStatus(p, moduleIds)
    expect(s.earned).toBe(true)
    expect(s.earnedAt).toBe('2026-10-01')
  })

  it('gibt das Zertifikat nicht, wenn nur die Abschlussprüfung bestanden ist', () => {
    // Kann nicht passieren, solange die Sperre wirkt – aber der Status
    // darf auch dann nicht lügen.
    const p = recordExamAttempt(emptyProgress(), FINAL, 1)
    expect(certificateStatus(p, moduleIds).earned).toBe(false)
  })

  it('zählt bei leerem Lernstand nichts als bestanden', () => {
    const s = certificateStatus(emptyProgress(), moduleIds)
    expect(s.modulesPassed).toBe(0)
    expect(s.earned).toBe(false)
    expect(s.earnedAt).toBeNull()
  })
})
