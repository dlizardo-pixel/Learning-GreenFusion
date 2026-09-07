import { describe, expect, it } from 'vitest'
import { applyMultiplier, lessonBonus, streakMultiplier, XP_RULES, xpForAnswer } from '../scoring'

const ctx = (o: Partial<Parameters<typeof xpForAnswer>[0]> = {}) => ({
  correct: true,
  isNew: false,
  wasDue: false,
  previouslyWrong: false,
  repeatInLesson: false,
  ...o,
})

describe('Punktevergabe', () => {
  it('gibt für eine fällige Wiederholung mehr als für eine neue Aufgabe', () => {
    // Das ist die tragende Entscheidung: Wiederholen ist der langweilige
    // Teil und der, der Wissen hält. Wenn Neues mehr bringt, rasen
    // Lernende durch den Pfad und vergessen alles dahinter.
    const neu = xpForAnswer(ctx({ isNew: true })).xp
    const wiederholung = xpForAnswer(ctx({ wasDue: true })).xp
    expect(wiederholung).toBeGreaterThan(neu)
  })

  it('belohnt das Comeback am stärksten', () => {
    const comeback = xpForAnswer(ctx({ wasDue: true, previouslyWrong: true })).xp
    expect(comeback).toBeGreaterThan(xpForAnswer(ctx({ wasDue: true })).xp)
    expect(comeback).toBe(XP_RULES.comeback)
  })

  it('macht Grinding unattraktiv: Zusatzübung an Sitzendem bringt fast nichts', () => {
    const zusatz = xpForAnswer(ctx()).xp
    expect(zusatz).toBe(XP_RULES.extraPractice)
    expect(zusatz).toBeLessThan(xpForAnswer(ctx({ isNew: true })).xp / 4)
  })

  it('zieht für falsche Antworten nichts ab', () => {
    // Bestrafung erzeugt Vermeidung, nicht Wissen.
    expect(xpForAnswer(ctx({ correct: false, isNew: true })).xp).toBe(0)
    expect(xpForAnswer(ctx({ correct: false, wasDue: true })).xp).toBe(0)
  })

  it('zahlt für die Nachholung in derselben Lektion weniger als für den Ersttreffer', () => {
    const nachgeholt = xpForAnswer(ctx({ repeatInLesson: true, isNew: true })).xp
    expect(nachgeholt).toBe(XP_RULES.repeated)
    expect(nachgeholt).toBeLessThan(XP_RULES.newCorrect)
  })

  it('nennt zu jeder Vergabe einen Grund', () => {
    for (const c of [
      ctx({ isNew: true }),
      ctx({ wasDue: true }),
      ctx({ wasDue: true, previouslyWrong: true }),
      ctx({ repeatInLesson: true }),
      ctx(),
      ctx({ correct: false }),
    ]) {
      expect(xpForAnswer(c).reason.length).toBeGreaterThan(3)
    }
  })
})

describe('Serien-Multiplikator', () => {
  it('steigt in Stufen und ist gedeckelt', () => {
    expect(streakMultiplier(0)).toBe(1)
    expect(streakMultiplier(4)).toBe(1)
    expect(streakMultiplier(5)).toBe(1.1)
    expect(streakMultiplier(13)).toBe(1.1)
    expect(streakMultiplier(14)).toBe(1.25)
    // Der Deckel ist der Punkt: eine Serie von 300 Tagen darf die Liga
    // nicht dauerhaft unerreichbar machen.
    expect(streakMultiplier(300)).toBe(1.25)
  })

  it('rundet auf ganze Punkte', () => {
    expect(applyMultiplier(15, 14)).toBe(19)
    expect(applyMultiplier(10, 0)).toBe(10)
  })
})

describe('Lektionsbonus', () => {
  it('gibt den Abschlussbonus immer', () => {
    const b = lessonBonus({ answered: 8, correctFirstTry: 3, goalReachedNow: false })
    expect(b.map((x) => x.xp)).toEqual([XP_RULES.lessonComplete])
  })

  it('gibt einen Extra-Bonus für eine fehlerfreie Lektion', () => {
    const b = lessonBonus({ answered: 8, correctFirstTry: 8, goalReachedNow: false })
    expect(b.length).toBe(2)
    expect(b.some((x) => x.xp === XP_RULES.perfectLesson)).toBe(true)
  })

  it('wertet eine leere Lektion nicht als fehlerfrei', () => {
    const b = lessonBonus({ answered: 0, correctFirstTry: 0, goalReachedNow: false })
    expect(b.length).toBe(1)
  })

  it('gibt den Zielbonus nur beim Erreichen', () => {
    const b = lessonBonus({ answered: 8, correctFirstTry: 8, goalReachedNow: true })
    expect(b.length).toBe(3)
    expect(b.reduce((s, x) => s + x.xp, 0)).toBe(
      XP_RULES.lessonComplete + XP_RULES.perfectLesson + XP_RULES.dailyGoal,
    )
  })
})
