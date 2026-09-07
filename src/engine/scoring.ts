/**
 * Punktevergabe.
 *
 * Die zentrale Entscheidung: **eine fällige Wiederholung bringt mehr XP als
 * eine neue Aufgabe.**
 *
 * Das ist der Umkehrschluss zur naheliegenden Umsetzung, und er ist wichtig.
 * Wiederholen ist der langweilige Teil — und der, der Wissen hält. Wenn
 * neues Material mehr einbringt, rasen Lernende durch den Lernpfad und
 * vergessen alles dahinter. Wer stattdessen für Wiederholung am besten
 * bezahlt wird, folgt automatisch dem Wiederholungsplan.
 *
 * Zweite Entscheidung: schon sitzende Aufgaben nochmal zu machen bringt
 * fast nichts (2 XP). Sonst wäre die günstigste Strategie für die
 * Rangliste, die leichteste Lektion in Dauerschleife zu spielen — und
 * Ranglisten, die man ergrinden kann, messen Fleiß statt Wissen.
 */

export interface AnswerContext {
  correct: boolean
  /** Item war noch nie beantwortet. */
  isNew: boolean
  /** Item war zur Wiederholung fällig. */
  wasDue: boolean
  /** Beim letzten Mal falsch beantwortet. */
  previouslyWrong: boolean
  /** Zweite Begegnung in derselben Lektion (nach einem Fehler nachgeholt). */
  repeatInLesson: boolean
}

export interface XpAward {
  xp: number
  /** Kurzer Grund, wird in der Rückmeldung angezeigt. */
  reason: string
}

export const XP_RULES = {
  /** Neue Aufgabe zum ersten Mal richtig. */
  newCorrect: 10,
  /** Fällige Wiederholung richtig — höher als neu, siehe oben. */
  dueReview: 15,
  /** Vorher falsch, jetzt in der Wiederholung richtig. Der stärkste Lernmoment. */
  comeback: 20,
  /** In derselben Lektion nachgeholt, nachdem es falsch war. */
  repeated: 5,
  /** Freiwillige Zusatzübung an etwas, das schon sitzt. Bewusst kaum belohnt. */
  extraPractice: 2,
  /** Falsche Antwort. Kein Abzug — Bestrafung erzeugt Vermeidung, nicht Wissen. */
  wrong: 0,
  /** Lektion vollständig durchgespielt. */
  lessonComplete: 20,
  /** Alle Aufgaben der Lektion beim ersten Versuch richtig. */
  perfectLesson: 15,
  /** Tagesziel erreicht. */
  dailyGoal: 25,
} as const

export function xpForAnswer(ctx: AnswerContext): XpAward {
  if (!ctx.correct) return { xp: XP_RULES.wrong, reason: 'Kommt gleich nochmal' }
  if (ctx.repeatInLesson) return { xp: XP_RULES.repeated, reason: 'Nachgeholt' }
  if (ctx.wasDue && ctx.previouslyWrong) return { xp: XP_RULES.comeback, reason: 'Comeback' }
  if (ctx.wasDue) return { xp: XP_RULES.dueReview, reason: 'Wiederholung' }
  if (ctx.isNew) return { xp: XP_RULES.newCorrect, reason: 'Neu gelernt' }
  return { xp: XP_RULES.extraPractice, reason: 'Zusatzübung' }
}

/**
 * Serien-Multiplikator, bewusst niedrig gedeckelt.
 *
 * Er belohnt Beständigkeit, ohne die Liga zu verzerren: wer seit Monaten
 * dabei ist, soll nicht dauerhaft unerreichbar vorne stehen. 14 Tage
 * erreicht jede Person, die mitmacht — danach ist der Vorteil bei allen
 * gleich. Die eigentliche Anerkennung für lange Serien passiert in der
 * separaten Serien-Rangliste, nicht über Punkte.
 */
export function streakMultiplier(streak: number): number {
  if (streak >= 14) return 1.25
  if (streak >= 5) return 1.1
  return 1
}

export const applyMultiplier = (xp: number, streak: number) =>
  Math.round(xp * streakMultiplier(streak))

/** Bonus am Ende einer Lektion. */
export function lessonBonus(args: {
  answered: number
  correctFirstTry: number
  goalReachedNow: boolean
}): XpAward[] {
  const out: XpAward[] = [{ xp: XP_RULES.lessonComplete, reason: 'Lektion abgeschlossen' }]
  if (args.answered > 0 && args.correctFirstTry === args.answered) {
    out.push({ xp: XP_RULES.perfectLesson, reason: 'Alles beim ersten Versuch' })
  }
  if (args.goalReachedNow) {
    out.push({ xp: XP_RULES.dailyGoal, reason: 'Tagesziel erreicht' })
  }
  return out
}
