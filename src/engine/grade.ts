import type { Item } from './types'

export interface Answer {
  /** Rohantwort je Aufgabentyp — siehe die Komponenten in components/exercises. */
  value: unknown
}

export interface Grade {
  correct: boolean
  /** 0..1 — für Teilpunkte bei Zuordnung, Reihenfolge und Zusammenfassung. */
  score: number
  /** Optionale Detailrückmeldung, z. B. welche Rubrik-Punkte fehlten. */
  detail?: string[]
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const sameSet = (a: number[], b: number[]) =>
  a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i])

export function grade(item: Item, answer: Answer): Grade {
  switch (item.type) {
    case 'mc':
    case 'scenario':
    case 'card': {
      const correct = answer.value === item.answer
      return { correct, score: correct ? 1 : 0 }
    }

    case 'multi': {
      const picked = (answer.value as number[]) ?? []
      const correct = sameSet(picked, item.answer)
      // Teilpunkte: Treffer minus Fehlgriffe, nie negativ.
      const hits = picked.filter((i) => item.answer.includes(i)).length
      const misses = picked.filter((i) => !item.answer.includes(i)).length
      const score = Math.max(0, (hits - misses) / item.answer.length)
      return { correct, score }
    }

    case 'truefalse': {
      const correct = answer.value === item.answer
      return { correct, score: correct ? 1 : 0 }
    }

    case 'cloze': {
      const filled = (answer.value as string[]) ?? []
      const hits = item.blanks.filter((b, i) => norm(filled[i] ?? '') === norm(b)).length
      const correct = hits === item.blanks.length
      return { correct, score: hits / item.blanks.length }
    }

    case 'match': {
      // value: Record<left, right>
      const map = (answer.value as Record<string, string>) ?? {}
      const hits = item.pairs.filter((p) => norm(map[p.left] ?? '') === norm(p.right)).length
      return { correct: hits === item.pairs.length, score: hits / item.pairs.length }
    }

    case 'order': {
      const given = (answer.value as string[]) ?? []
      const hits = item.steps.filter((s, i) => given[i] === s).length
      return { correct: hits === item.steps.length, score: hits / item.steps.length }
    }

    case 'hotspot': {
      const correct = answer.value === item.answer
      return { correct, score: correct ? 1 : 0 }
    }

    case 'estimate': {
      const v = Number(answer.value)
      const correct = Math.abs(v - item.answer) <= item.tolerance
      return { correct, score: correct ? 1 : 0 }
    }

    case 'buckets': {
      // value: Record<Begriff, Korb-ID>
      const map = (answer.value as Record<string, string>) ?? {}
      const hits = item.entries.filter((e) => map[e.text] === e.bucketId).length
      return { correct: hits === item.entries.length, score: hits / item.entries.length }
    }

    case 'dialogue': {
      // value: gewählte Option je Gesprächszug
      const picks = (answer.value as number[]) ?? []
      const hits = item.turns.filter((t, i) => picks[i] === t.answer).length
      const score = item.turns.length ? hits / item.turns.length : 0
      return {
        correct: score >= item.passRatio,
        score,
        detail: item.turns
          .map((t, i) => (picks[i] === t.answer ? null : t.optionFeedback[picks[i]] ?? null))
          .filter((x): x is string => x !== null),
      }
    }

    case 'readSummarize':
      return gradeSummary(item.rubric, String(answer.value ?? ''), item.passRatio)
  }
}

/**
 * Bewertung einer geschriebenen Zusammenfassung über Konzeptabdeckung.
 *
 * Absichtlich *kein* Sprachmodell im Kern: die App muss offline und ohne
 * API-Kosten funktionieren, und die Rückmeldung soll nachvollziehbar sein
 * ("dir fehlte der Punkt X"), nicht ein undurchsichtiger Score. Für eine
 * inhaltlich tiefere Bewertung siehe `summary.ts` — dort ist eine
 * LLM-Bewertung als austauschbare Erweiterung vorgesehen.
 */
export function gradeSummary(
  rubric: { concept: string; keywords: string[]; hint: string }[],
  text: string,
  passRatio: number,
): Grade {
  const haystack = norm(text)
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  const missing: string[] = []
  let hits = 0
  for (const r of rubric) {
    const found = r.keywords.some((k) => haystack.includes(norm(k)))
    if (found) hits++
    else missing.push(r.hint)
  }

  const score = rubric.length ? hits / rubric.length : 0
  // Untergrenze gegen Stichwort-Spam: eine Zusammenfassung ist ein Text,
  // keine Schlagwortliste.
  const longEnough = wordCount >= 25
  return {
    correct: score >= passRatio && longEnough,
    score,
    detail: longEnough
      ? missing
      : ['Schreib mindestens zwei bis drei ganze Sätze — Stichwörter reichen nicht.', ...missing],
  }
}
