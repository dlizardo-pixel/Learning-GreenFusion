import { useEffect, useState } from 'react'
import type { Item, ModuleId, Progress } from './engine/types'
import { modules, moduleById, unitById, items } from './data'
import { buildLesson, DEFAULT_LESSON_SIZE } from './engine/lesson'
import { buildExam, FINAL } from './engine/exam'
import { emptyProgress, localStorageAdapter, type StorageAdapter } from './engine/progress'
import { grantWeeklyFreeze } from './engine/srs'
import { demoSource, setLeaderboardSource } from './engine/leaderboard'
import { isBackendConfigured, supabase } from './backend/supabase'
import { supabaseStorageAdapter } from './backend/supabaseStorage'
import { supabaseLeaderboardSource } from './backend/supabaseLeaderboard'
import { signOut, useAuth } from './backend/useAuth'
import { Home } from './screens/Home'
import { Liga } from './screens/Liga'
import { Login } from './screens/Login'
import { ModulePath } from './screens/ModulePath'
import { Lesson, type LessonResult } from './screens/Lesson'
import { Exam } from './screens/Exam'
import { Certificate } from './screens/Certificate'
import { Done } from './screens/Done'

type View =
  | { name: 'home' }
  | { name: 'liga' }
  | { name: 'certificate' }
  | { name: 'module'; moduleId: ModuleId }
  | { name: 'lesson'; queue: Item[]; unitId: string | null; title: string; from: View }
  | { name: 'exam'; queue: Item[]; examId: string; title: string; from: View }
  | { name: 'done'; result: LessonResult; from: View }

export default function App() {
  const auth = useAuth()
  const [storage, setStorage] = useState<StorageAdapter | null>(null)
  const [progress, setProgress] = useState<Progress>(emptyProgress)
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState<View>({ name: 'home' })

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
      void supabase?.rpc('ensure_current_membership')
      return
    }
    setStorage(null)
    setLoaded(false)
  }, [auth])

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

  function startExam(examId: string, from: View) {
    const queue = buildExam({ items, examId })
    if (queue.length === 0) return
    const title =
      examId === FINAL
        ? 'Abschlussprüfung'
        : `Modulprüfung ${moduleById.get(examId as ModuleId)?.title ?? ''}`.trim()
    setView({ name: 'exam', queue, examId, title, from })
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
          modules={modules}
          progress={progress}
          onProgress={update}
          onStartDaily={() => startLesson({ mode: 'daily' }, { name: 'home' })}
          onStartReview={() => startLesson({ mode: 'review' }, { name: 'home' })}
          onOpenModule={(moduleId) => setView({ name: 'module', moduleId })}
          onOpenLiga={() => setView({ name: 'liga' })}
          onOpenCertificate={() => setView({ name: 'certificate' })}
          onSignOut={isBackendConfigured() ? () => void signOut() : undefined}
        />
      )

    case 'liga':
      return <Liga progress={progress} onBack={() => setView({ name: 'home' })} />

    case 'certificate':
      return (
        <Certificate
          progress={progress}
          onBack={() => setView({ name: 'home' })}
          onStartFinal={() => startExam(FINAL, { name: 'certificate' })}
        />
      )

    case 'module': {
      const mod = moduleById.get(view.moduleId)
      if (!mod) return <div className="app">Modul nicht gefunden.</div>
      return (
        <ModulePath
          module={mod}
          progress={progress}
          onBack={() => setView({ name: 'home' })}
          onStartUnit={(unitId) => startLesson({ mode: 'unit', unitId }, view)}
          onStartExam={() => startExam(mod.id, view)}
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

    case 'exam':
      return (
        <Exam
          key={view.examId + view.queue.length}
          queue={view.queue}
          examId={view.examId}
          title={view.title}
          progress={progress}
          onProgress={update}
          onExit={() => setView(view.from)}
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
