import { describe, expect, it } from 'vitest'
import { splitEmphasis } from '../../components/Emphasis'
import { items } from '../../data'

describe('Betonung in Erklärungstexten', () => {
  it('macht aus *Wort* einen betonten Teil', () => {
    expect(splitEmphasis('nur *eine* Sache')).toEqual(['nur ', 'eine', ' Sache'])
  })

  it('lässt Text ohne Sternchen unverändert', () => {
    expect(splitEmphasis('nichts zu betonen')).toEqual(['nichts zu betonen'])
  })

  it('lässt ein einzelnes Sternchen stehen, statt den Rest zu verschlucken', () => {
    expect(splitEmphasis('5 * 3 = 15')).toEqual(['5 * 3 = 15'])
  })

  // Der eigentliche Zweck: in keinem why-Text darf ein Sternchen als
  // Sternchen ankommen. Findet die Regel eines nicht, ist es im Text falsch
  // gesetzt — und der Lernende sieht einen vermeintlichen Tippfehler.
  it('keine unaufgelösten Sternchen in den Erklärungstexten', () => {
    const kaputt = items
      .filter((i) => splitEmphasis(i.why).some((part, n) => n % 2 === 0 && part.includes('*')))
      .map((i) => i.id)
    expect(kaputt).toEqual([])
  })
})
