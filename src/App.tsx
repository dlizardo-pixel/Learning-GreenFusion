import { useEffect, useState } from 'react'
import type { CourseId, Item, Progress } from './engine/types'
import { courses, courseById, unitById, items } from './data'
import { buildLesson, DEFAULT_LESSON_SIZE } from './engine/lesson'
import { emptyProgress, localStorageAdapter } from './engine/progress'
import { Home } from './screens/Home'
import { Liga } from './screens/Liga'
import { CoursePath } from './screens/CoursePath'
import { Lesson, type LessonResult } from './screens/Lesson'
import { Done } from './screens/Done'

type View =
  | { name: 'home' }
  | { name: 'liga' }
  | { name: 'course'; courseId: CourseId }
  | { name: 'lesson'; queue: Item[]; unitId: string | null; title: string; from: View }
  | { name: 'done'; result: LessonResult; from: View }

const storage = localStorageAdapter

export default function App() {
  const [progress, setProgress] = useState<Progress>(emptyProgress)
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState<View>({ name: 'home' })

  useEffect(() => {
    storage.load().then((p) => {
      setProgress(p)
      setLoaded(true)
    })
  }, [])

  function update(p: Progress) {
    setProgress(p)
    void storage.save(p)
  }

  function startLesson(
    opts: { mode: 'daily' | 'review' } | { mode: 'unit'; unitId: string },
    from: View,
  ) {
    const unitId = opts.mode === 'unit' ? opts.unitId : null
    const queue = buildLesson({
      items,
      progress,
      mode: opts.mode,
      unitId: unitId ?? undefined,
      size: DEFAULT_LESSON_SIZE,
    })

    if (queue.length === 0) return

    const title =
      opts.mode === 'unit'
        ? (unitById.get(opts.unitId)?.title ?? 'Lektion')
        : opts.mode === 'review'
          ? 'Wiederholung'
          : 'Tageslektion'

    setView({ name: 'lesson', queue, unitId, title, from })
  }

  if (!loaded) {
    return (
      <div className="app">
        <div className="empty">Lade deinen Lernstand …</div>
      </div>
    )
  }

  switch (view.name) {
    case 'home':
      return (
        <Home
          courses={courses}
          progress={progress}
          onStartDaily={() => startLesson({ mode: 'daily' }, { name: 'home' })}
          onStartReview={() => startLesson({ mode: 'review' }, { name: 'home' })}
          onOpenCourse={(courseId) => setView({ name: 'course', courseId })}
          onOpenLiga={() => setView({ name: 'liga' })}
        />
      )

    case 'liga':
      return <Liga progress={progress} onBack={() => setView({ name: 'home' })} />

    case 'course': {
      const course = courseById.get(view.courseId)
      if (!course) return <div className="app">Kurs nicht gefunden.</div>
      return (
        <CoursePath
          course={course}
          progress={progress}
          onBack={() => setView({ name: 'home' })}
          onStartUnit={(unitId) => startLesson({ mode: 'unit', unitId }, view)}
        />
      )
    }

    case 'lesson':
      return (
        <Lesson
          key={view.queue.map((q) => q.id).join('|')}
          queue={view.queue}
          unitId={view.unitId}
          title={view.title}
          progress={progress}
          onProgress={update}
          onExit={() => setView(view.from)}
          onDone={(result) => setView({ name: 'done', result, from: view.from })}
        />
      )

    case 'done':
      return (
        <Done
          result={view.result}
          onHome={() => setView({ name: 'home' })}
          onAgain={() => startLesson({ mode: 'daily' }, view.from)}
        />
      )
  }
}
