# Heizungsheld — GF Heiz-Kompass Level 1

Ein Zertifikatskurs im Duolingo-Stil für Heizungswissen, Produktwissen,
Vertrieb und Regulatorik. Gebaut für Kolleginnen und Kollegen, die noch nie
einen Heizungskeller von innen gesehen haben — und trotzdem morgen im
Kundentermin sitzen.

Neun Module, kurze Lektionen von rund vier Minuten, verteilte
Wiederholung, dreizehn Aufgabentypen. Jede Antwort bekommt eine Erklärung
mit Quellenangabe. Am Ende jedes Moduls eine Prüfung, am Ende aller Module
das Zertifikat **GF Heiz-Kompass – Level 1**.

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
npm run smoke        # klickt echte Lektionen im Browser durch
```

Der Smoke-Test braucht einen Build und Chromium. Die Vorschau startet er
selbst, wenn auf Port 4173 noch keine läuft:

```bash
npx playwright install chromium   # einmalig
npm run build && npm run smoke
```

## Continuous Integration

`.github/workflows/ci.yml` läuft bei jedem Pull Request und bei jedem Push
auf `main`: Typecheck, Unit-Tests und Build im ersten Job, danach der
Browser-Smoke-Test. Schlägt Letzterer fehl, liegen die Screenshots als
Artefakt `smoke-shots` am Lauf — das ist meist schneller gelesen als das Log.

## Was drin ist

| | |
|---|---|
| Module | 9 |
| Lektionen | 49 |
| Aufgaben | 236 |
| Aufgabentypen | 13 |
| Prüfungen | 9 Modulprüfungen + Abschlussprüfung |
| Tests | 135 Unit-Tests + Browser-Smoke-Test |

### Die neun Module

1. 🔧 **Physik & Technik** — Erzeuger, Verteilung, Übergabe und Trägheit, Warmwasser, Kennzahlen
2. 🎛️ **Regelung & Digitalisierung** — Steuerung vs. Regelung, Heizkurve, hydraulischer Abgleich, Reglerlandschaft
3. 🖥️ **Green Fusion Produktlogik** — Energiespar-Pilot, GreenBox, Empfehlungen, Freigabeprozess, Erfolgsmessung
4. ⚖️ **Regulatorik & Recht** — GEG-Historie, §60a/§60b/§60c, §71a und TÜV, Umlagefähigkeit, Trinkwasser, Datenschutz
5. 🧭 **Wettbewerb & Markt** — Monitoring-only vs. aktive Optimierung, Fallbeispiel Immoconn, Nachbarfelder
6. 💼 **Wirtschaftlichkeit & Vertrieb** — Rentabilitätsschwelle, Preismodell, Angebot, technische Einwände
7. ☀️ **Sektorkopplung** — Echtzeit vs. iterativ, Machbarkeit, §9 EEG, Mieterstrom, Ausblick
8. 🎓 **Praxis & Zertifizierung** — Kellerbegehung, vollständige Gesprächssimulation, Abschluss
9. 🏘️ **Wohnungswirtschaft verstehen** — Rechtsformen, Gremien und Entscheidungswege, Rollen im Alltag, Stadtwerke, Verbände

Welcher Lehrplan-Punkt wo liegt, steht in
**[docs/LEHRPLAN.md](docs/LEHRPLAN.md)** — inklusive der Punkte, die noch
eine fachliche Freigabe brauchen.

### Green Fusion Liga

Wöchentliche Rangliste in Ligastufen (Bronze bis Diamant) mit Auf- und
Abstieg, plus zwei weitere Wertungen: eine **Serien-Rangliste**, die man mit
fünf Minuten am Tag gewinnen kann, und eine **Team-Wertung** nach
Durchschnitt der Aktiven. Die Punktevergabe ist bewusst so gebaut, dass
Wiederholen mehr einbringt als neues Material — Begründung in
[docs/LIGA-UND-PUNKTE.md](docs/LIGA-UND-PUNKTE.md).

Dazu drei Mechaniken, die auf Verbleib statt auf Sucht setzen:
**Schutztage** für die Serie (einer pro Woche, automatisch — ein
Krankheitstag soll keine 60-Tage-Serie kosten), eine wechselnde
**Aufgabe des Tages**, und **Mastery-Abzeichen** je Kurs, die an
Beherrschung hängen statt an Punkten.

Ohne Backend zeigt die Liga Beispieldaten (in der Oberfläche als solche
gekennzeichnet); nur die eigene Zeile ist echt.

### Die dreizehn Aufgabentypen

Eine Antwort · Mehrere Antworten · Stimmt das? · Lücken füllen · Zuordnen ·
Reihenfolge · Im Anlagenschema anklicken · Schätzen · Kundengespräch mit
Einwand · Lesen & in eigenen Worten zusammenfassen · **Einsortieren**
(„Wer macht das?") · **Karte beurteilen** („Fernoptimierbar oder nicht?") ·
**Gespräch** (mehrstufige Simulation)

### Prüfungen und Zertifikat

Je Modul eine Prüfung mit 12 Fragen, bestanden ab 80 %. Sind alle acht
bestanden, öffnet die Abschlussprüfung mit 24 Fragen über alle Module —
die einzige Sperre in der App. In der Prüfung kommen Fehler nicht nochmal
und die Auflösung erst am Ende; ein Fehlversuch kostet nichts, der beste
Wert bleibt stehen.

## Woher die Inhalte kommen

Alle Aufgaben sind belegt, jede nennt ihre Herkunft direkt in der
Rückmeldung:

- **Product Specification 1.0 (08.26)** — verifizierte Quelle der Wahrheit
  für den heutigen Produktstand, mit Abschnittsangabe
- **Knowledge Base** — Umlagefähigkeit der Kosten zur Heizungsoptimierung
- **Commercial Playbook** — Angeboterstellung und Preismodell
- **Sales Materials** — Preise, Einsparbenchmarks, Case Studies,
  Zielkundenprofil
- **§60a / §60b / §60c GEG** — Prüfpflichten und Fristen aus dem
  Gesetzestext selbst, nicht aus zweiter Hand
- **TÜV-Zertifikat §71a**, **Wettbewerber-Notiz Immoconn**,
  **Webinar-Vorbereitung mit KEDi** — Regulatorik, Markt, Umlagepraxis

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
│   ├── challenge.ts   Aufgabe des Tages
│   ├── badges.ts      Mastery-Abzeichen je Modul
│   ├── exam.ts        Prüfungen, Bestehensgrenze, Zertifikat
│   └── progress.ts    Lernstand, XP, Speicher-Abstraktion
├── data/modules.ts    Der Lehrplan: Module, Lektionen, Lehrplan-Nummern
├── data/sources.ts    Alle Quellenangaben an einer Stelle
├── data/items/        Die Aufgaben — eine Datei pro Modul
├── components/        Aufgabentypen und Anlagenschemata
├── screens/           Übersicht, Modulpfad, Lektion, Prüfung, Zertifikat, Liga, Login
├── backend/           Supabase: Anmeldung, Lernstand, Liga
└── styles/app.css     Green Fusion Design System als CSS-Tokens

supabase/migrations/   Tabellen, Rechte, Liga-Sicht, Wochenwechsel
```

Die Engine ist frei von React und vollständig getestet. Wer die Inhalte
pflegt, muss nur `src/data/courses/` anfassen.

## Design

Green Fusion Design System: `#3AD99F` als Primärfarbe, Source Sans 3,
Abstände in 8er-Schritten, deutsche Oberfläche, Du-Ansprache (intern).
Mobil zuerst — gelernt wird auf dem Handy, auch wenn die Kundenplattform
selbst nur für Computer freigegeben ist.

## Stand dieser Version

Die App läuft in zwei Modi, und der Unterschied ist eine Konfiguration:

- **Lokal** (Standard, ohne Einrichtung): Lernstand im Browser, keine
  Anmeldung, Liga mit Beispieldaten. So kann man sie sofort starten.
- **Mit Anmeldung**: sind `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY`
  gesetzt, gibt es Konten (nur `@green-fusion.de`), geräteübergreifenden
  Lernstand und die echte Liga. Der Code dafür ist fertig; es fehlen nur
  das Supabase-Projekt und die beiden Variablen. Einrichtung in sieben
  Schritten: [docs/BACKEND.md](docs/BACKEND.md).

Noch nicht da: Erinnerungen, Duell-Modus, LLM-Bewertung der
Zusammenfassungen. Siehe [Roadmap](docs/ROADMAP.md).

## Weiterlesen

- **[docs/LERNKONZEPT.md](docs/LERNKONZEPT.md)** — warum die App so gebaut
  ist: was von Duolingo übernommen wurde, was bewusst nicht, und die
  Begründung hinter jeder Entscheidung
- **[docs/INHALTE-PFLEGEN.md](docs/INHALTE-PFLEGEN.md)** — Aufgaben
  schreiben, ändern, aussortieren; die Qualitätsschwelle
- **[docs/LEHRPLAN.md](docs/LEHRPLAN.md)** — der Lehrplan mit
  Abdeckungstabelle je Lektion, die bewussten Abweichungen und die offenen
  Punkte, die eine fachliche Freigabe brauchen
- **[docs/LIGA-UND-PUNKTE.md](docs/LIGA-UND-PUNKTE.md)** — die
  Punktevergabe und die Liga, mit Begründung je Regel; auch was wir
  bewusst nicht bauen und warum Punkte keine Führungskennzahl werden dürfen
- **[docs/BACKEND.md](docs/BACKEND.md)** — der Weg zur Website mit Login:
  zwei Optionen, Datenmodell, API-Vertrag, und was vor dem Rollout zu
  klären ist
- **[docs/ROADMAP.md](docs/ROADMAP.md)** — was darüber hinaus fehlt
