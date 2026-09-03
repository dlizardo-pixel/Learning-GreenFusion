# Roadmap

Was diese Version kann, steht in der [README](../README.md). Hier steht,
was fehlt — sortiert danach, was den grössten Unterschied macht.

## Zuerst: Backend und Login

Ohne Backend liegt der Lernstand im Browser. Das reicht, um das Konzept zu
prüfen, aber nicht für eine Mitarbeiterplattform: wer das Gerät wechselt,
fängt neu an, und es gibt keine Auswertung fürs Team.

Was dafür nötig ist, ist überschaubar, weil die Grenzen schon gezogen sind:

- `StorageAdapter` in `src/engine/progress.ts` gegen eine API
  implementieren. Die Oberfläche kennt nur dieses Interface.
- Login über das bestehende Keycloak, das die Kundenplattform nutzt — kein
  zweites Benutzerverzeichnis.
- Serverseitig sollte die Bewertung liegen, wenn das Ergebnis irgendwann
  zählen soll. Solange es reines Selbstlernen ist, ist die Bewertung im
  Browser in Ordnung.

## Danach: die Inhaltsmenge

Aktuell 97 Aufgaben in 17 Lektionen. Das reicht für rund zwei Wochen
täglicher Lektionen, bevor sich Wiederholungen dominieren. Für „jeden Tag
neue Fragen" über Monate braucht es eher 400 bis 500.

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

- **Erinnerungen**: braucht Backend und eine Entscheidung über den Ton.
  Eine Erinnerung, die nach Vorgesetztem klingt, ruiniert die Serie-Mechanik.
- **Als App installierbar** (Manifest + Service Worker), damit es vom
  Homescreen startet und offline läuft.
- **Bilder aus echten Kellern**: eigene Fotos statt gezeichneter Schemata
  für einzelne Aufgaben. Die Brand-Bildsprache verlangt authentische
  Aufnahmen, keine Stock-Fotos.
- **Zwei Sprachen**: die Oberfläche ist deutsch, die Product Specification
  zweisprachig. Für die französische Expansion würde es relevant.
- **Barrierefreiheit prüfen**: Tastaturbedienung und ARIA-Rollen sind
  angelegt, aber nicht mit einem Screenreader getestet.
