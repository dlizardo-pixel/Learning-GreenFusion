import type { Progress } from '../engine/types'
import { modules } from '../data'
import { certificateStatus, examFor, FINAL } from '../engine/exam'

interface Props {
  progress: Progress
  onBack(): void
  onStartFinal(): void
}

/**
 * Der Zertifikatsbildschirm.
 *
 * Zeigt ehrlich, was erreicht ist: jede Modulprüfung einzeln, dann die
 * Abschlussprüfung. Kein Fortschrittsbalken, der Wohlwollen suggeriert —
 * bestanden oder nicht.
 */
export function Certificate({ progress, onBack, onStartFinal }: Props) {
  const moduleIds = modules.map((m) => m.id)
  const status = certificateStatus(progress, moduleIds)
  const final = examFor(progress, FINAL)

  return (
    <div className="app">
      <div className="topbar">
        <button className="btn btn--ghost" data-testid="back-home" onClick={onBack}>
          ‹ Übersicht
        </button>
      </div>

      {status.earned ? (
        <div className="cert" data-testid="certificate-earned">
          <div className="cert-seal" aria-hidden="true">
            🎓
          </div>
          <div className="cert-kicker">Green Fusion</div>
          <h1 className="cert-title">GF Heiz-Kompass</h1>
          <div className="cert-level">Level 1</div>
          <p className="cert-body">
            Alle acht Modulprüfungen und die Abschlussprüfung bestanden – von den physikalischen
            Grundlagen über die Produktlogik bis zu Regulatorik, Markt und Wirtschaftlichkeit.
          </p>
          {status.earnedAt && <div className="cert-date">Bestanden am {status.earnedAt}</div>}
        </div>
      ) : (
        <>
          <h1>GF Heiz-Kompass – Level 1</h1>
          <p className="muted" style={{ marginTop: 0 }}>
            Acht Modulprüfungen, dann die Abschlussprüfung. Bestanden ab 80 % richtigen Antworten;
            Fehlversuche kosten nichts ausser Zeit.
          </p>
          <div className="cert-progress">
            <strong>
              {status.modulesPassed} von {status.modulesTotal} Modulprüfungen bestanden
            </strong>
          </div>
        </>
      )}

      <div className="section-label">Modulprüfungen</div>
      <div className="path">
        {modules.map((m) => {
          const e = examFor(progress, m.id)
          return (
            <div className={`unit ${e.passed ? 'unit--done' : ''}`} key={m.id}>
              <span
                className="unit-badge"
                style={e.passed ? undefined : { background: 'var(--gf-pearly-white)' }}
                aria-hidden="true"
              >
                {e.passed ? '✓' : m.number}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="course-title">
                  Modul {m.number} · {m.title}
                </span>
                <span className="course-meta">
                  {e.passed
                    ? `bestanden mit ${Math.round(e.bestScore * 100)} %${
                        e.passedAt ? ` am ${e.passedAt}` : ''
                      }`
                    : e.attempts > 0
                      ? `${e.attempts} Versuch${e.attempts === 1 ? '' : 'e'} · bisher bester Wert ${Math.round(
                          e.bestScore * 100,
                        )} %`
                      : 'noch nicht angetreten'}
                </span>
              </span>
            </div>
          )
        })}
      </div>

      <div className="section-label">Abschlussprüfung</div>
      <div className="card">
        {status.finalPassed ? (
          <>
            <strong>Bestanden mit {Math.round(final.bestScore * 100)} %</strong>
            <div className="small muted" style={{ marginTop: 4 }}>
              24 Fragen quer über alle acht Module.
            </div>
          </>
        ) : status.finalUnlocked ? (
          <>
            <strong>Freigeschaltet</strong>
            <div className="small muted" style={{ marginTop: 4, marginBottom: 'var(--gf-space-4)' }}>
              24 Fragen quer über alle acht Module, bestanden ab 80 %.
              {final.attempts > 0 &&
                ` Bisher ${final.attempts} Versuch${final.attempts === 1 ? '' : 'e'}, bester Wert ${Math.round(
                  final.bestScore * 100,
                )} %.`}
            </div>
            <button className="btn btn--primary" data-testid="start-final" onClick={onStartFinal}>
              Abschlussprüfung starten
            </button>
          </>
        ) : (
          <>
            <strong>Noch gesperrt</strong>
            <div className="small muted" style={{ marginTop: 4 }}>
              Sie öffnet, wenn alle acht Modulprüfungen bestanden sind – noch{' '}
              {status.modulesTotal - status.modulesPassed} offen. Das ist die einzige Sperre in der
              App: beim freien Lernen wäre sie falsch, bei einer Prüfungsreihenfolge ist sie der
              Sinn der Sache.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
