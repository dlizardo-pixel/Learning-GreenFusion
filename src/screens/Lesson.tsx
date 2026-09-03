import { useMemo, useState } from 'react'
import type { Item, Progress } from '../engine/types'
import { grade as gradeAnswer, type Grade } from '../engine/grade'
import { getSummaryGrader } from '../engine/summary'
import { applyAnswer, completeLesson, xpToday } from '../engine/progress'
import { applyMultiplier, lessonBonus, xpForAnswer, type XpAward } from '../engine/scoring'
import { challengeForDay, recordChallengeProgress } from '../engine/challenge'
import { isDue } from '../engine/srs'
import { Exercise, hasInput, initialValue, TYPE_HINT } from '../components/exercises'
import { Feedback } from '../components/Feedback'

interface Props {
  queue: Item[]
  unitId: string | null
  title: string
  progress: Progress
  onProgress(p: Progress): void
  onExit(): void
  onDone(result: LessonResult): void
}

export interface LessonResult {
  title: string
  answered: number
  correctFirstTry: number
  xpEarned: number
  streak: number
  /** Aufschlüsselung der Boni – macht sichtbar, wofür es Punkte gab. */
  bonuses: XpAward[]
}

/**
 * Der Lektions-Ablauf.
 *
 * Zwei bewusste Entscheidungen gegenüber dem Duolingo-Original:
 *
 * 1. **Keine Herzen.** Erwachsene im Arbeitskontext mit Leben zu bestrafen
 *    und aus der Lektion zu werfen erzeugt Vermeidung, nicht Wissen. Wer
 *    ein Thema nicht kennt, soll es lernen und nicht rausgeworfen werden.
 * 2. **Fehler kommen wieder.** Falsch beantwortete Aufgaben werden hinten
 *    angehängt und in derselben Lektion erneut gestellt. Das ist der
 *    tatsächlich wirksame Teil des Duolingo-Modells: die zweite Begegnung
 *    innerhalb weniger Minuten, während die Erklärung noch frisch ist.
 */
export function Lesson({
  queue: initialQueue,
  unitId,
  title,
  progress,
  onProgress,
  onExit,
  onDone,
}: Props) {
  const [queue, setQueue] = useState<Item[]>(initialQueue)
  const [pos, setPos] = useState(0)
  const [value, setValue] = useState<unknown>(() => initialValue(initialQueue[0]))
  const [result, setResult] = useState<Grade | null>(null)
  const [checking, setChecking] = useState(false)
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({ answered: 0, correctFirstTry: 0, xp: 0 })
  const [award, setAward] = useState<XpAward | null>(null)
  // Beim Start festhalten, ob das Tagesziel schon erreicht war – sonst
  // gäbe es den Zielbonus in jeder weiteren Lektion des Tages erneut.
  const [goalAlreadyReached] = useState(() => xpToday(progress) >= progress.dailyGoal)
  // XP aus der Tages-Challenge, damit sie in der Abschlussübersicht auftaucht.
  const [challengeXp, setChallengeXp] = useState(0)

  const item = queue[pos]
  const total = queue.length
  const isLast = pos === total - 1
  const revealed = result !== null

  const canCheck = useMemo(() => hasInput(item, value), [item, value])

  async function check() {
    if (!canCheck || revealed) return
    setChecking(true)

    const g =
      item.type === 'readSummarize'
        ? await getSummaryGrader().grade(item, String(value ?? ''))
        : gradeAnswer(item, { value })

    setChecking(false)
    setResult(g)

    const firstEncounter = !seenIds.has(item.id)
    const before = progress.items[item.id]

    // Der Lernstand *vor* dieser Antwort entscheidet über die Punkte:
    // eine fällige Wiederholung zählt mehr als eine neue Aufgabe.
    const earned = xpForAnswer({
      correct: g.correct,
      isNew: !before,
      wasDue: !!before && isDue(before),
      previouslyWrong: !!before && before.box === 0 && before.timesWrong > 0,
      repeatInLesson: !firstEncounter,
    })
    const xp = applyMultiplier(earned.xp, progress.streak)

    // Antwort einarbeiten, dann prüfen, ob sie für die Tages-Challenge zählt.
    const afterAnswer = applyAnswer(progress, item.id, g.correct, xp)
    const challenge = recordChallengeProgress(afterAnswer, item, {
      correct: g.correct,
      wasDue: !!before && isDue(before),
    })

    setAward(
      challenge.justCompleted
        ? { xp: xp + challenge.awardedXp, reason: `${earned.reason} + Aufgabe des Tages` }
        : { ...earned, xp },
    )
    if (challenge.awardedXp) setChallengeXp((c) => c + challenge.awardedXp)
    onProgress(challenge.progress)
    setStats((s) => ({
      answered: s.answered + (firstEncounter ? 1 : 0),
      correctFirstTry: s.correctFirstTry + (firstEncounter && g.correct ? 1 : 0),
      xp: s.xp + xp,
    }))
    setSeenIds((s) => new Set(s).add(item.id))

    // Falsch beantwortet und noch nicht wiederholt: hinten anhängen.
    if (!g.correct && firstEncounter) {
      setQueue((q) => [...q, item])
    }
  }

  function next() {
    if (pos + 1 >= queue.length) {
      const bonuses = lessonBonus({
        answered: stats.answered,
        correctFirstTry: stats.correctFirstTry,
        goalReachedNow: !goalAlreadyReached && xpToday(progress) >= progress.dailyGoal,
      })
      if (challengeXp > 0) {
        bonuses.push({ xp: challengeXp, reason: challengeForDay().title })
      }
      const bonusXp = bonuses.reduce((sum, b) => sum + b.xp, 0)
      const finished = completeLesson(progress, unitId, bonusXp - challengeXp)
      onProgress(finished)
      onDone({
        title,
        answered: stats.answered,
        correctFirstTry: stats.correctFirstTry,
        // challengeXp steckt schon im Lernstand; hier nur für die Anzeige.
        xpEarned: stats.xp + bonusXp,
        streak: finished.streak,
        bonuses,
      })
      return
    }
    const nextPos = pos + 1
    setPos(nextPos)
    setValue(initialValue(queue[nextPos]))
    setResult(null)
    setAward(null)
  }

  const willRepeat = revealed && !result?.correct && queue.filter((q) => q.id === item.id).length > 1

  return (
    <div className="app">
      <div className="lesson-head">
        <button className="close-btn" onClick={onExit} aria-label="Lektion verlassen">
          ✕
        </button>
        <div className="lesson-progress" role="progressbar" aria-valuenow={pos} aria-valuemax={total}>
          <i style={{ width: `${(pos / total) * 100}%` }} />
        </div>
        <span className="small muted" style={{ minWidth: 44, textAlign: 'right' }}>
          {pos + 1}/{total}
        </span>
      </div>

      {item.type !== 'cloze' && item.type !== 'readSummarize' && (
        <div className="type-hint">{TYPE_HINT[item.type]}</div>
      )}

      <Exercise
        item={item}
        value={value}
        onChange={setValue}
        revealed={revealed}
        grade={result ?? undefined}
      />

      {revealed ? (
        <Feedback
          item={item}
          correct={!!result?.correct}
          award={award}
          onNext={next}
          isLast={isLast && !willRepeat}
          willRepeat={willRepeat}
        />
      ) : (
        <div className="sticky-actions">
          <button
            className="btn btn--primary btn--block btn--lg"
            onClick={check}
            disabled={!canCheck || checking}
          >
            {checking ? 'Wird geprüft …' : 'Prüfen'}
          </button>
        </div>
      )}
    </div>
  )
}
