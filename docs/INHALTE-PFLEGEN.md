# Inhalte pflegen

Wie man Aufgaben ergänzt, ändert und aussortiert. Geschrieben so, dass es
auch ohne Programmiererfahrung nachvollziehbar ist — Aufgaben zu schreiben
ist Fachwissen, nicht Softwareentwicklung.

## Wo die Inhalte liegen

```
src/data/courses/
├── technik.ts     🔧 Heizungstechnik
├── produkt.ts     🖥️ Produkt & Plattform
├── vertrieb.ts    💼 Wirtschaft & Vertrieb
└── recht.ts       ⚖️ Recht & Regulatorik
```

Jede Datei enthält oben die Kursstruktur (Lektionen mit Titel und Ziel) und
darunter die Aufgaben.

## Die Qualitätsschwelle

Drei Regeln, die durch Tests erzwungen werden — eine Aufgabe, die eine
davon verletzt, lässt sich nicht ausliefern:

1. **`why` erklärt die Antwort** (mindestens 40 Zeichen). Nicht die richtige
   Antwort wiederholen, sondern begründen — und wo möglich sagen, was das
   im Gespräch bedeutet.
2. **`source` nennt die Herkunft.** Product Specification mit Abschnitt,
   Knowledge-Base-Artikel, Playbook, Deck. Mit Link, wenn es einen gibt.
3. **`concepts` benennt, was geprüft wird.** Ein bis drei Begriffe.
   Grundlage für Wiederholung und spätere Lückenanalyse.

Weitere Prüfungen, die automatisch laufen: eindeutige IDs, Antwortindizes
im gültigen Bereich, jede Mehrfachauswahl hat auch falsche Optionen, jeder
Lückentext hat für jeden Platzhalter eine Lösung und mindestens einen
Ablenker, jede Zuordnung hat mindestens zwei Paare ohne Dopplungen, jede
Lektion hat genug Aufgaben für eine vollständige Lektion, jede Musterlösung
erfüllt ihre eigene Rubrik.

Ausführen mit:

```bash
npm test
```

## Was eine gute Aufgabe ausmacht

**Prüfe Entscheidungen, nicht Vokabeln.** Schwach: „Wie heisst unser
Kernprodukt?" Stark: „Ein Kunde fragt nach Echtzeitsteuerung für seine
Wärmepumpen — was gilt heute?"

**Baue Ablenker aus echten Verwechslungen.** Die falschen Optionen sollen
die Fehler sein, die Menschen tatsächlich machen. „Vertragsstart =
Unterschriftsdatum" ist ein guter Ablenker, weil genau das die häufigste
Verwechslung ist. Eine erfundene Option ist verschenkte Fläche.

**Sag auch, was wir nicht können.** Die wertvollsten Aufgaben markieren
Produktgrenzen: dass die SLAs vorgeschlagen und nicht verbindlich sind,
dass Reglereingriffe von Hand nicht im Logbuch landen, dass die Batterie in
der Sektorkopplung noch nicht von uns gesteuert wird. Wer diese Grenzen
kennt, verspricht im Termin nichts Falsches.

**Nimm die Kundensprache.** Bei Kundengespräch-Aufgaben wortnah zitieren,
nicht glätten. „Ehrlich gesagt sehe ich keinen Unterschied zu KUGU" ist
brauchbar; „Der Kunde äussert Bedenken bezüglich der Differenzierung" ist
es nicht.

**Ein Konzept pro Aufgabe.** Wer zwei Dinge gleichzeitig prüft, weiss beim
Fehler nicht, welches gefehlt hat — und die Wiederholung greift ins Leere.

## Wenn Quellen sich widersprechen

Kommt vor: der Brand Guide nennt 175+ Kunden, das Sales-Deck 180+. **Aus
widersprüchlichen Quellen wird keine Aufgabe.** Erst klären, dann
aufnehmen. Eine Lernapp, die eine strittige Zahl als richtig markiert,
verbreitet den Fehler schneller als jedes Wiki.

Wo eine Zahl eine Spanne ist (§60b-Prüfung: 200 bis 600 €), gehört sie in
eine Schätzaufgabe mit passender Toleranz — nicht in eine
Multiple-Choice-Frage mit Scheingenauigkeit.

## Aufgabe hinzufügen

Datei des passenden Kurses öffnen, an die richtige Lektion anfügen. Muster
für den häufigsten Fall:

```ts
{
  id: 'v2-neue-frage',            // eindeutig, Präfix = Lektion
  courseId: 'vertrieb',
  unitId: 'vertrieb-2',
  level: 2,                       // 1 Einstieg · 2 Aufbau · 3 Vertiefung
  type: 'mc',
  concepts: ['Rabattrichtlinien'],
  prompt: 'Die Frage.',
  options: ['Richtig', 'Plausibel falsch', 'Plausibel falsch', 'Plausibel falsch'],
  answer: 0,                      // Index in options
  why: 'Warum das so ist – und was es im Gespräch bedeutet.',
  source: PLAYBOOK,               // oben in der Datei definiert
},
```

Alle zehn Typen mit ihren Feldern stehen mit Kommentaren in
`src/engine/types.ts`. Die Levelstufe steuert nur die Reihenfolge, in der
neues Material innerhalb einer Lektion kommt.

## Aufgabe ändern oder aussortieren

**Inhalt veraltet** (Preis, SLA, Funktion): Aufgabe anpassen, `source`
aktualisieren. Die **ID unverändert lassen** — sie hängt am Lernstand aller
Nutzenden. Eine geänderte ID setzt das Item für alle auf „nie gesehen"
zurück.

**Aufgabe war falsch**: ändern, ID behalten. Wer sie falsch gelernt hat,
bekommt sie in der nächsten Wiederholung richtig.

**Aufgabe ist überholt**: löschen. Der Lernstand dazu wird dann ignoriert,
das schadet nichts. Vorher prüfen, dass die Lektion noch mindestens vier
Aufgaben hat — sonst schlägt der Test an, und das ist richtig so: eine
Lektion mit drei Aufgaben ist keine Lektion.

## Neue Lektion oder neuen Kurs anlegen

**Lektion:** im `units`-Array des Kurses ergänzen (`id`, `title`, `goal`,
`icon`), dann mindestens vier Aufgaben mit dieser `unitId` schreiben. Das
`goal` ist wichtig — es steht im Lernpfad und ist das Versprechen der
Lektion. Ein Satz, aktiv, aus Sicht der Lernenden.

**Kurs:** neue Datei in `src/data/courses/` nach dem Muster der
bestehenden, `CourseId` in `src/engine/types.ts` erweitern und in
`src/data/index.ts` registrieren. Farbe aus dem Green Fusion Design System
wählen, keine neue erfinden.

## Warum die Inhalte nicht automatisch aus Notion kommen

Naheliegende Idee, und wir haben sie bewusst nicht umgesetzt. Gründe:

- **Eine Notion-Seite ist keine Aufgabe.** Aus „Alarm bei Vorlauf < 25 °C
  für > 30 min" eine gute Frage mit drei plausiblen Ablenkern zu machen ist
  eine fachliche Leistung, keine Formatumwandlung.
- **Nicht alles Wahre ist prüfbar.** Widersprüchliche Zahlen, „Known
  limitations", noch nicht verbindliche SLAs — das braucht ein Urteil
  darüber, was gelernt werden *soll*.
- **Automatisch erzeugte Fragen veralten unsichtbar.** Eine händisch
  gepflegte Aufgabe mit Quellenangabe kann jemand prüfen. Eine generierte
  merkt niemand.

Was sinnvoll wäre: ein Skript, das **prüft**, ob sich verlinkte
Notion-Quellen seit dem letzten Stand geändert haben, und die betroffenen
Aufgaben zur Durchsicht meldet. Steht in der
[Roadmap](ROADMAP.md) — Vorschlagen ist billig, Prüfen ist wertvoll.
