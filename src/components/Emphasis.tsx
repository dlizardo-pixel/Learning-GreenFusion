/**
 * Winziger Renderer für *Betonung* in Erklärungstexten.
 *
 * Die `why`-Texte sind über die Zeit mit Sternchen geschrieben worden, weil
 * sich das beim Schreiben natürlich anfühlt. Gerendert wurden sie bisher als
 * Sternchen – also als Tippfehler lesbar. Statt die Betonung aus den Texten
 * zu entfernen, wird sie hier ausgewertet: ein Format, das Autorinnen und
 * Autoren ohnehin benutzen, soll auch funktionieren.
 *
 * Bewusst kein Markdown-Paket: ein Sonderzeichen, eine Regel, keine
 * Abhängigkeit und keine Möglichkeit, HTML einzuschleusen.
 */
/**
 * Zerlegt den Text in Teile; jeder ungerade Index ist betont.
 * Exportiert, damit die Regel testbar ist, ohne React zu rendern.
 */
export function splitEmphasis(text: string): string[] {
  return text.split(/\*([^*\n]+)\*/g)
}

export function Emphasis({ text }: { text: string }) {
  const parts = splitEmphasis(text)
  return (
    <>
      {parts.map((part, i) =>
        // Ungerade Indizes sind die Treffer der Klammer, also der betonte Text.
        i % 2 === 1 ? <em key={i}>{part}</em> : part,
      )}
    </>
  )
}
