import type { ReadSummarizeItem } from './types'
import { gradeSummary, type Grade } from './grade'

/**
 * Bewertung freier Zusammenfassungen.
 *
 * Die App nutzt standardmässig `localGrader`: Konzeptabdeckung über
 * Stichwortfamilien, komplett im Browser. Das ist robust, kostenlos und
 * erklärbar — aber es erkennt keine Umschreibung, die keines der
 * hinterlegten Wörter nutzt.
 *
 * Sobald ein Backend existiert, wird stattdessen `apiGrader` registriert.
 * Die Oberfläche kennt nur dieses Interface und ändert sich dadurch nicht.
 */
export interface SummaryGrader {
  name: string
  grade(item: ReadSummarizeItem, text: string): Promise<Grade>
}

export const localGrader: SummaryGrader = {
  name: 'local-rubric',
  async grade(item, text) {
    return gradeSummary(item.rubric, text, item.passRatio)
  },
}

/**
 * Platzhalter für die serverseitige Bewertung durch ein Sprachmodell.
 * Erwartet einen Endpunkt, der {score, missing[]} zurückgibt. Fällt bei
 * jedem Fehler auf die lokale Bewertung zurück — eine Lektion darf nie
 * an einer Netzwerkstörung scheitern.
 */
export function apiGrader(endpoint: string): SummaryGrader {
  return {
    name: 'api-llm',
    async grade(item, text) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: item.id, rubric: item.rubric, text }),
        })
        if (!res.ok) throw new Error(`Bewertung fehlgeschlagen: ${res.status}`)
        const data = (await res.json()) as { score: number; missing?: string[] }
        return {
          correct: data.score >= item.passRatio,
          score: data.score,
          detail: data.missing,
        }
      } catch {
        return localGrader.grade(item, text)
      }
    },
  }
}

let active: SummaryGrader = localGrader
export const setSummaryGrader = (g: SummaryGrader) => {
  active = g
}
export const getSummaryGrader = (): SummaryGrader => active
