import { useState } from 'react'
import type { Item, Progress } from '../engine/types'
import { grade as gradeAnswer, type Grade } from '../engine/grade'
import { getSummaryGrader } from '../engine/summary'
import { applyAnswer } from '../engine/progress'
import { EXAM_XP, FINAL, PASS_RATIO, recordExamAttempt } from '../engine/exam'
import { Exercise, hasInput, initialValue, TYPE_HINT } from '../components/exercises'

interface Props {
  queue: Item[]
  examId: string
  title: string
  progress: Progress
  onProgress(p: Progress): void
  onExit(): void
}

interface Answered {
  item: Item
  grade: Grade
}

/**
 * Prüfungsablauf.
 *
 * Bewusst anders als eine Lektion: keine Wiederholung von Fehlern, keine
 * Rückmeldung zwischendurch. Die Erklärungen kommen vollständig im
 * Debrief — eine Prüfung soll prüfen und danach lehren, nicht während des
 * Prüfens die Lösung zeigen.
 */
export function Exam({ queue, examId, title, progress, onProgress, onExit }: Props) {
  const [pos, setPos] = useState(0)
  const [value, setValue] = useState<unknown>(() => initialValue(queue[0]))
  const [answers, setAnswers] = useState<Answered[]>([])
  const [busy, setBusy] = useState(false)
  const [finished, setFinished] = useState<{ score: number; passed: boolean } | null>(null)

  const item = queue[pos]

  async function submit() {
    if (!hasInput(item, value) || busy) return
    setBusy(true)
    const g =
      item.type === 'readSummarize'
        ? await getSummaryGrader().grade(item, String(value ?? ''))
        : gradeAnswer(item, { value })
    setBusy(false)

    const all = [...answers, { item, grade: g }]
    setAnswers(all)

    // Der Lernstand wird auch in der Prüfung fortgeschrieben: eine Antwort
    // ist eine Antwort, und die Wiederholung soll davon wissen.
    let next = applyAnswer(progress, item.id, g.correct, 0)

    if (pos + 1 >= queue.length) {
      const score = all.filter((a) => a.grade.correct).length / all.length
      const passed = score >= PASS_RATIO
      next = recordExamAttempt(next, examId, score)
      if (passed && !progress.exams[examId]?.passed) {
        const xp = examId === FINAL ? EXAM_XP.final : EXAM_XP.module
        next = { ...next, xp: next.xp + xp }
      }
      onProgress(next)
      setFinished({ score, passed })
      return
    }

    onProgress(next)
    const nextPos = pos + 1
    setPos(nextPos)
    setValue(initialValue(queue[nextPos]))
  }

  if (finished) {
    const wrong = answers.filter((a) => !a.grade.correct)
    const needed = Math.ceil(PASS_RATIO * answers.length)
    return (
      <div className="app">
        <div className={`exam-result ${finished.passed ? 'exam-result--ok' : 'exam-result--no'}`}>
          <div className="done-emoji" aria-hidden="true">
            {finished.passed ? '🎓' : '📚'}
          </div>
          <h1>{finished.passed ? 'Bestanden' : 'Noch nicht bestanden'}</h1>
          <p className="muted" style={{ marginTop: 0 }}>
            {title}
          </p>
          <div className="exam-score">
            {answers.filter((a) => a.grade.correct).length} / {answers.length}
          </div>
          <div className="small muted">
            {Math.round(finished.score * 100)} % · bestanden ab {needed} richtigen Antworten
          </div>
          {finished.passed && (
            <div className="small" style={{ marginTop: 'var(--gf-space-3)' }}>
              +{examId === FINAL ? EXAM_XP.final : EXAM_XP.module} XP
            </div>
          )}
        </div>

        {wrong.length > 0 && (
          <>
            <div className="section-label">Das saß noch nicht</div>
            <div className="path">
              {wrong.map((a) => (
                <div className="card" key={a.item.id}>
                  <div className="small" style={{ fontWeight: 600 }}>
                    {a.item.concepts.join(' · ')}
                  </div>
                  <div className="small" style={{ marginTop: 6, lineHeight: 1.6 }}>
                    {a.item.why}
                  </div>
                  <div className="feedback-source" style={{ marginTop: 8 }}>
                    Quelle:{' '}
                    {a.item.source.url ? (
                      <a href={a.item.source.url} target="_blank" rel="noreferrer">
                        {a.item.source.label}
                      </a>
                    ) : (
                      a.item.source.label
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="sticky-actions">
          <button
            className="btn btn--primary btn--block btn--lg"
            data-testid="exam-done"
            onClick={onExit}
          >
            {finished.passed ? 'Weiter' : 'Zurück zum Modul'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="lesson-head">
        <button className="close-btn" onClick={onExit} aria-label="Prüfung abbrechen">
          ✕
        </button>
        <div className="lesson-progress">
          <i style={{ width: `${(pos / queue.length) * 100}%` }} />
        </div>
        <span className="small muted" style={{ minWidth: 52, textAlign: 'right' }}>
          {pos + 1}/{queue.length}
        </span>
      </div>

      <div className="exam-banner">
        <strong>Prüfung</strong> · keine Auflösung zwischendurch, Auswertung am Ende
      </div>

      {item.type !== 'cloze' && item.type !== 'readSummarize' && item.type !== 'dialogue' && (
        <div className="type-hint">{TYPE_HINT[item.type]}</div>
      )}

      <Exercise item={item} value={value} onChange={setValue} revealed={false} />

      <div className="sticky-actions">
        <button
          className="btn btn--primary btn--block btn--lg"
          onClick={submit}
          disabled={!hasInput(item, value) || busy}
        >
          {pos + 1 >= queue.length ? 'Abgeben und auswerten' : 'Antwort abgeben'}
        </button>
      </div>
    </div>
  )
}
