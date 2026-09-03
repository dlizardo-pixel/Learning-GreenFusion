# Heizungsheld — Lernapp für Green Fusion

Eine Lernapp im Duolingo-Stil für Heizungswissen, Produktwissen, Vertrieb
und Regulatorik. Gebaut für Kolleginnen und Kollegen, die noch nie einen
Heizungskeller von innen gesehen haben — und trotzdem morgen im
Kundentermin sitzen.

Kurze Lektionen von rund vier Minuten, verteilte Wiederholung, zehn
Aufgabentypen. Jede Antwort bekommt eine Erklärung mit Quellenangabe aus
unseren internen Unterlagen.

## Schnellstart

```bash
npm install
npm run dev          # Entwicklungsserver auf http://localhost:5173
```

Weitere Befehle:

```bash
npm test             # Unit-Tests für Lern-Engine und Inhalte
npm run build        # Produktions-Build nach dist/
npm run preview      # gebaute Version auf http://localhost:4173
npm run smoke        # klickt echte Lektionen im Browser durch (Preview muss laufen)
```

Der Smoke-Test braucht Chromium und Playwright:

```bash
npm install --no-save playwright
npm run build && npm run preview &
npm run smoke
```

## Was drin ist

| | |
|---|---|
| Kurse | 4 |
| Lektionen | 17 |
| Aufgaben | 97 |
| Aufgabentypen | 10 |
| Tests | 74 Unit-Tests + Browser-Smoke-Test |

### Die vier Kurse

- 🔧 **Heizungstechnik** — Erzeuger und Verbraucher, Vorlauf und Rücklauf,
  Heizkurve und Nachtabsenkung, Anlagentypen, Warmwasser und Hygiene
- 🖥️ **Produkt & Plattform** — Energiespar-Pilot und Sektorkopplung,
  GreenBox-Generationen, die vier Tabs der Plattform, der Weg von der
  Empfehlung zur umgesetzten Änderung
- 💼 **Wirtschaft & Vertrieb** — Zielkundenprofil, Preise und Pakete,
  Business Case, die häufigsten Einwände, SPICED und Sales-Prozess
- ⚖️ **Recht & Regulatorik** — Umlagefähigkeit, GEG-Prüfpflichten,
  Datenschutz und EU AI Act

### Green Fusion Liga

Wöchentliche Rangliste in Ligastufen (Bronze bis Diamant) mit Auf- und
Abstieg, plus zwei weitere Wertungen: eine **Serien-Rangliste**, die man mit
fünf Minuten am Tag gewinnen kann, und eine **Team-Wertung** nach
Durchschnitt der Aktiven. Die Punktevergabe ist bewusst so gebaut, dass
Wiederholen mehr einbringt als neues Material — Begründung in
[docs/LIGA-UND-PUNKTE.md](docs/LIGA-UND-PUNKTE.md).

Ohne Backend zeigt die Liga Beispieldaten (in der Oberfläche als solche
gekennzeichnet); nur die eigene Zeile ist echt.

### Die zehn Aufgabentypen

Eine Antwort · Mehrere Antworten · Stimmt das? · Lücken füllen · Zuordnen ·
Reihenfolge · Im Anlagenschema anklicken · Schätzen ·
Kundengespräch mit Einwand · Lesen & in eigenen Worten zusammenfassen

## Woher die Inhalte kommen

Alle Aufgaben sind aus internen Quellen belegt, jede nennt ihre Herkunft
direkt in der Rückmeldung:

- **Product Specification 1.0 (08.26)** — verifizierte Quelle der Wahrheit
  für den heutigen Produktstand, mit Abschnittsangabe
- **Knowledge Base** — Umlagefähigkeit der Kosten zur Heizungsoptimierung
- **Commercial Playbook** — Angeboterstellung und Preismodell
- **Sales Materials** — Preise, Einsparbenchmarks, Case Studies,
  Zielkundenprofil

Keine Aufgabe ohne Erklärung und Quelle — ein Test setzt das durch.
Widersprüchliche Angaben aus verschiedenen Quellen werden **nicht** zu
Aufgaben, sondern erst geklärt.

## Aufbau

```
src/
├── engine/            Lern-Engine, ohne React
│   ├── types.ts       Inhaltsmodell aller Aufgabentypen
│   ├── srs.ts         Verteilte Wiederholung (Leitner) und Serie
│   ├── lesson.ts      Lektionsaufbau: Wiederholung zuerst, Typen gemischt
│   ├── grade.ts       Bewertung je Aufgabentyp
│   ├── summary.ts     Bewertung freier Zusammenfassungen (austauschbar)
│   ├── scoring.ts     Punktevergabe und Serien-Multiplikator
│   ├── liga.ts        Wochengrenze, Rangbildung, Team-Wertung
│   ├── leaderboard.ts Datenquelle der Liga (austauschbar)
│   └── progress.ts    Lernstand, XP, Speicher-Abstraktion
├── data/courses/      Die Inhalte — eine Datei pro Kurs
├── components/        Aufgabentypen und Anlagenschemata
├── screens/           Übersicht, Lernpfad, Lektion, Abschluss, Liga
└── styles/app.css     Green Fusion Design System als CSS-Tokens
```

Die Engine ist frei von React und vollständig getestet. Wer die Inhalte
pflegt, muss nur `src/data/courses/` anfassen.

## Design

Green Fusion Design System: `#3AD99F` als Primärfarbe, Source Sans 3,
Abstände in 8er-Schritten, deutsche Oberfläche, Du-Ansprache (intern).
Mobil zuerst — gelernt wird auf dem Handy, auch wenn die Kundenplattform
selbst nur für Computer freigegeben ist.

## Stand dieser Version

Der Lernstand liegt im Browser (`localStorage`). Kein Login, kein Backend,
keine echte Rangliste, keine Erinnerungen — die Schnittstellen dafür sind
gezogen (`StorageAdapter`, `LeaderboardSource`, `SummaryGrader`), aber
nicht implementiert. Der konkrete Weg dorthin samt Datenmodell steht in
[docs/BACKEND.md](docs/BACKEND.md).

## Weiterlesen

- **[docs/LERNKONZEPT.md](docs/LERNKONZEPT.md)** — warum die App so gebaut
  ist: was von Duolingo übernommen wurde, was bewusst nicht, und die
  Begründung hinter jeder Entscheidung
- **[docs/INHALTE-PFLEGEN.md](docs/INHALTE-PFLEGEN.md)** — Aufgaben
  schreiben, ändern, aussortieren; die Qualitätsschwelle
- **[docs/LIGA-UND-PUNKTE.md](docs/LIGA-UND-PUNKTE.md)** — die
  Punktevergabe und die Liga, mit Begründung je Regel; auch was wir
  bewusst nicht bauen und warum Punkte keine Führungskennzahl werden dürfen
- **[docs/BACKEND.md](docs/BACKEND.md)** — der Weg zur Website mit Login:
  zwei Optionen, Datenmodell, API-Vertrag, und was vor dem Rollout zu
  klären ist
- **[docs/ROADMAP.md](docs/ROADMAP.md)** — was darüber hinaus fehlt
