import { useEffect, useState } from 'react'
import type { CourseId, Item, Progress } from './engine/types'
import { courses, courseById, unitById, items } from './data'
import { buildLesson, DEFAULT_LESSON_SIZE } from './engine/lesson'
import {
  emptyProgress,
  localStorageAdapter,
  type StorageAdapter,
} from './engine/progress'
import { grantWeeklyFreeze } from './engine/srs'
import { demoSource, setLeaderboardSource } from './engine/leaderboard'
import { isBackendConfigured, supabase } from './backend/supabase'
import { supabaseStorageAdapter } from './backend/supabaseStorage'
import { supabaseLeaderboardSource } from './backend/supabaseLeaderboard'
import { signOut, useAuth } from './backend/useAuth'
import { Home } from './screens/Home'
import { Liga } from './screens/Liga'
import { Login } from './screens/Login'
import { CoursePath } from './screens/CoursePath'
import { Lesson, type LessonResult } from './screens/Lesson'
import { Done } from './screens/Done'

type View =
  | { name: 'home' }
  | { name: 'liga' }
  | { name: 'course'; courseId: CourseId }
  | { name: 'lesson'; queue: Item[]; unitId: string | null; title: string; from: View }
  | { name: 'done'; result: LessonResult; from: View }

export default function App() {
  const auth = useAuth()
  const [storage, setStorage] = useState<StorageAdapter | null>(null)
  const [progress, setProgress] = useState<Progress>(emptyProgress)
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState<View>({ name: 'home' })

  // Datenquellen je nach Anmeldezustand festlegen.
  useEffect(() => {
    if (auth.status === 'local') {
      setStorage(localStorageAdapter)
      setLeaderboardSource(demoSource)
      return
    }
    if (auth.status === 'signedIn') {
      const userId = auth.session.user.id
      setStorage(supabaseStorageAdapter(userId))
      setLeaderboardSource(supabaseLeaderboardSource(userId))
      // Sicherstellen, dass die Person in der laufenden Woche in einer
      // Gruppe steht – sonst fehlt sie in der Liga.
      void supabase?.rpc('ensure_current_membership')
      return
    }
    setStorage(null)
    setLoaded(false)
  }, [auth])

  // Lernstand laden und den Wochen-Schutztag gutschreiben.
  useEffect(() => {
    if (!storage) return
    let cancelled = false
    storage.load().then((p) => {
      if (cancelled) return
      const withFreeze = grantWeeklyFreeze(p)
      setProgress(withFreeze)
      setLoaded(true)
      if (withFreeze !== p) void storage.save(withFreeze)
    })
    return () => {
      cancelled = true
    }
  }, [storage])

  function update(p: Progress) {
    setProgress(p)
    void storage?.save(p)
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

  if (auth.status === 'loading') {
    return (
      <div className="app">
        <div className="empty">Anmeldung wird geprüft …</div>
      </div>
    )
  }

  if (auth.status === 'signedOut') return <Login />

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
          onProgress={update}
          onStartDaily={() => startLesson({ mode: 'daily' }, { name: 'home' })}
          onStartReview={() => startLesson({ mode: 'review' }, { name: 'home' })}
          onOpenCourse={(courseId) => setView({ name: 'course', courseId })}
          onOpenLiga={() => setView({ name: 'liga' })}
          onSignOut={isBackendConfigured() ? () => void signOut() : undefined}
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
