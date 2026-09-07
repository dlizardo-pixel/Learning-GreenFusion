# Roadmap

Was diese Version kann, steht in der [README](../README.md). Hier steht,
was fehlt — sortiert danach, was den grössten Unterschied macht.

## Erledigt

- **Backend und Login** — Supabase (Region Frankfurt) ist implementiert:
  Anmeldung mit E-Mail und Passwort, beschränkt auf `@green-fusion.de`,
  Lernstand geräteübergreifend, echte Liga. Es fehlen nur das Projekt und
  zwei Umgebungsvariablen → [BACKEND.md](BACKEND.md).
- **Green Fusion Liga** — wöchentlicher Reset, Ligastufen mit Auf- und
  Abstieg, Serien- und Team-Wertung → [LIGA-UND-PUNKTE.md](LIGA-UND-PUNKTE.md).
- **Schutztage und Serien-Rettung**, **Aufgabe des Tages**,
  **Mastery-Abzeichen** je Kurs.

## Danach: die Inhaltsmenge

Aktuell 97 Aufgaben in 17 Lektionen. Das reicht für rund zwei Wochen
täglicher Lektionen, bevor Wiederholungen dominieren. Für „jeden Tag neue
Fragen" über Monate braucht es eher 400 bis 500.

**Das ist jetzt der wichtigste offene Punkt.** Alle Mechaniken stehen —
was den Unterschied macht, ob die App nach drei Wochen noch geöffnet wird,
ist die Menge an Material. Die Anleitung dafür steht in
[INHALTE-PFLEGEN.md](INHALTE-PFLEGEN.md); es braucht keine
Entwicklungsarbeit, sondern Fachwissen.

Ungleich verteilt sind bisher besonders:

- **Lesen & zusammenfassen**: 2 Aufgaben. Der wertvollste Typ und der
  aufwendigste. Kandidaten: kontinuierliche Optimierung (vorhanden),
  Umlagefähigkeit (vorhanden), dazu Einsparnachweis-Methodik,
  Sektorkopplungs-Qualifikation, Datenschutz-Gespräch mit der IT.
- **Kundengespräch**: 7 Aufgaben, alle im Vertriebskurs. Customer Success
  hätte eigene: Mieterbeschwerde, ausgebliebene Einsparung,
  Hausmeister-Eingriff.
- **Im Schema anklicken**: 3 Aufgaben auf 3 Schemata. Mehr Schemata
  (Hybridanlage, BHKW, Wohnungsstationen) würden räumliches Verständnis
  breiter abdecken.

## Quellen-Wächter statt Inhaltsgenerator

Jede Aufgabe nennt ihre Quelle. Daraus lässt sich etwas bauen, das echten
Aufwand spart: ein Skript, das per Notion-API prüft, ob eine verlinkte
Quelle seit dem letzten Stand bearbeitet wurde, und die betroffenen
Aufgaben zur Durchsicht meldet.

Das ist deutlich wertvoller als automatisch erzeugte Fragen — die
Begründung steht in
[INHALTE-PFLEGEN.md](INHALTE-PFLEGEN.md#warum-die-inhalte-nicht-automatisch-aus-notion-kommen).

## Duell-Modus

Fünf Fragen gegen eine Kollegin oder einen Kollegen, freiwillig, 24 Stunden
Zeit. Braucht das Backend, das jetzt steht — also eine Tabelle für Duelle
und eine Benachrichtigung. Günstig zu bauen, hoher Engagement-Effekt.

## Wochen-Post in Slack

Top 3, wie viele gelernt haben, und der häufigste Stolperstein der Woche.
Der Stolperstein ist der wertvolle Teil: er treibt Engagement und liefert
gleichzeitig ein echtes Enablement-Signal fürs Team. Braucht eine
Slack-App und einen wöchentlichen Job — die Liga-Sicht liefert die Zahlen
schon.

## LLM-Bewertung für Zusammenfassungen

Die Schnittstelle steht (`SummaryGrader` in `src/engine/summary.ts`), inklusive
Rückfall auf die lokale Bewertung bei jedem Fehler. Was fehlt, ist der
Endpunkt.

Wichtig dabei: die Rückmeldung muss weiterhin **benennen, was fehlte**.
Eine Bewertung, die nur eine Zahl liefert, ist ein Rückschritt gegenüber
der heutigen Konzeptabdeckung.

## Rollen und Empfehlungen

Heute sieht jede Person alle vier Kurse. Sinnvoll wäre eine Empfehlung beim
ersten Start („Was machst du bei Green Fusion?") mit Vorschlag einer
Reihenfolge — ohne die anderen Kurse zu verstecken. Ein Einstufungstest
könnte Personen mit Vorwissen die Grundlagen überspringen lassen.

## Team-Mechanik, vorsichtig

Eine Bestenliste von Personen schafft mehr Probleme als sie löst
(Begründung im [Lernkonzept](LERNKONZEPT.md#gamification-was-wir-nutzen-und-was-nicht)).
Was funktionieren könnte:

- Ein **gemeinsames Team-Ziel** („diese Woche 40 Lektionen im Sales-Team").
- **Duell-Modus** zu zweit, freiwillig, zeitlich begrenzt.
- Eine **anonyme Lückenübersicht** fürs Team: welche Konzepte gehen quer
  durchs Haus schief. Das ist ein Signal für Enablement, nicht für
  Bewertung von Einzelnen — und sollte auch so kommuniziert werden.

## Kleinere Dinge

- **Erinnerungen**: das Backend steht jetzt, es fehlt die Entscheidung über
  den Ton. Eine Erinnerung, die nach Vorgesetztem klingt, ruiniert die
  Serien-Mechanik.
- **Als App installierbar** (Manifest + Service Worker), damit es vom
  Homescreen startet und offline läuft.
- **Bilder aus echten Kellern**: eigene Fotos statt gezeichneter Schemata
  für einzelne Aufgaben. Die Brand-Bildsprache verlangt authentische
  Aufnahmen, keine Stock-Fotos.
- **Zwei Sprachen**: die Oberfläche ist deutsch, die Product Specification
  zweisprachig. Für die französische Expansion würde es relevant.
- **Barrierefreiheit prüfen**: Tastaturbedienung und ARIA-Rollen sind
  angelegt, aber nicht mit einem Screenreader getestet.
