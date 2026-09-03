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
| Tests | 42 Unit-Tests + Browser-Smoke-Test |

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
├── engine/          Lern-Engine, ohne React
│   ├── types.ts     Inhaltsmodell aller Aufgabentypen
│   ├── srs.ts       Verteilte Wiederholung (Leitner) und Serie
│   ├── lesson.ts    Lektionsaufbau: Wiederholung zuerst, Typen gemischt
│   ├── grade.ts     Bewertung je Aufgabentyp
│   ├── summary.ts   Bewertung freier Zusammenfassungen (austauschbar)
│   └── progress.ts  Lernstand, XP, Speicher-Abstraktion
├── data/courses/    Die Inhalte — eine Datei pro Kurs
├── components/      Aufgabentypen und Anlagenschemata
├── screens/         Übersicht, Lernpfad, Lektion, Abschluss
└── styles/app.css   Green Fusion Design System als CSS-Tokens
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
keine Bestenliste, keine Erinnerungen — die Schnittstellen dafür sind
gezogen (`StorageAdapter`, `SummaryGrader`), aber nicht implementiert.
Details in der [Roadmap](docs/ROADMAP.md).

## Weiterlesen

- **[docs/LERNKONZEPT.md](docs/LERNKONZEPT.md)** — warum die App so gebaut
  ist: was von Duolingo übernommen wurde, was bewusst nicht, und die
  Begründung hinter jeder Entscheidung
- **[docs/INHALTE-PFLEGEN.md](docs/INHALTE-PFLEGEN.md)** — Aufgaben
  schreiben, ändern, aussortieren; die Qualitätsschwelle
- **[docs/ROADMAP.md](docs/ROADMAP.md)** — was für eine echte
  Mitarbeiterplattform fehlt
