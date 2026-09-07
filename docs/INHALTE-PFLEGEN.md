# Inhalte pflegen

Wie man Aufgaben ergänzt, ändert und aussortiert. Geschrieben so, dass es
auch ohne Programmiererfahrung nachvollziehbar ist — Aufgaben zu schreiben
ist Fachwissen, nicht Softwareentwicklung.

## Wo die Inhalte liegen

```
src/data/
├── modules.ts      Der Lehrplan: 8 Module, 43 Lektionen mit Nummer und Ziel
├── sources.ts      Alle Quellenangaben an einer Stelle
└── items/
    ├── m1.ts       Physik & Technik
    ├── m2.ts       Regelung & Digitalisierung
    ├── m3.ts       Green Fusion Produktlogik
    ├── m4.ts       Regulatorik & Recht
    ├── m5.ts       Wettbewerb & Markt
    ├── m6.ts       Wirtschaftlichkeit & Vertrieb
    ├── m7.ts       Sektorkopplung
    └── m8.ts       Praxis & Zertifizierung
```

Struktur und Inhalt sind getrennt: `modules.ts` sagt, welche Lektionen es
gibt, die Dateien unter `items/` füllen sie. Und `sources.ts` hält die
Quellenangaben zentral, damit ein aktualisierter Link nicht an dreissig
Stellen gepflegt werden muss.

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

Dazu kommen die Prüfungen für die neuen Aufgabentypen: jeder Begriff einer
Einsortier-Aufgabe zeigt auf einen existierenden Korb, **kein Korb bleibt
immer leer** (ein Ablenker, der nie stimmt, frustriert ohne zu prüfen),
jede Karte hat Fakten und ein Feedback je Option, und jedes Gespräch hat
pro Zug Optionen, Antwort, Feedback und eine Reaktion.

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
  id: 'm6-neue-frage',            // eindeutig, Präfix = Modul
  moduleId: 'm6-wirtschaft',
  unitId: 'm6-u2',                // Lektion, siehe modules.ts
  level: 2,                       // 1 Einstieg · 2 Aufbau · 3 Vertiefung
  type: 'mc',
  concepts: ['Rabattrichtlinien'],
  prompt: 'Die Frage.',
  options: ['Richtig', 'Plausibel falsch', 'Plausibel falsch', 'Plausibel falsch'],
  answer: 0,                      // Index in options
  why: 'Warum das so ist – und was es im Gespräch bedeutet.',
  source: PLAYBOOK,               // aus sources.ts
},
```

Die Importe aus `sources.ts` müssen zur Verwendung passen — `npm run build`
meldet unbenutzte Importe als Fehler.

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

**Lektion:** in `modules.ts` beim passenden Modul ergänzen — mit
Lehrplan-Nummer (`code`), Titel, Ziel und Icon. Dann mindestens drei
Aufgaben mit dieser `unitId` schreiben. Das `goal` ist wichtig: es steht im
Lernpfad und ist das Versprechen der Lektion. Ein Satz, aktiv, aus Sicht
der Lernenden.

Drei Aufgaben genügen, weil eine Lektion bei Bedarf aus dem umgebenden
Modul auffüllt — der Lehrplan gibt die Gliederung vor, nicht die
Lektionsgrösse. Ein Modul braucht aber mindestens zwölf Aufgaben, sonst
lässt sich keine Modulprüfung stellen; auch das prüft ein Test.

**Modul:** neue Datei in `src/data/items/`, `ModuleId` in
`src/engine/types.ts` erweitern, in `modules.ts` und `src/data/index.ts`
registrieren. Farbe aus dem Green Fusion Design System wählen, keine neue
erfinden.

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

## Wenn eine Quelle fehlt

Wo kein interner Beleg existiert, wird die Quelle als `FACH`
(„Heizungstechnische Grundlagen") gekennzeichnet. Das ist kein Freibrief
für Behauptungen, sondern eine sichtbare Markierung: hier fehlt eine
Quelle, und wenn eine auftaucht, gehört sie nachgetragen.

Was **nicht** passiert: eine Aufgabe schreiben, weil eine Zahl plausibel
klingt. Beim Aufbau des Zertifikatsmoduls liess sich das Preismodell
„Basis / Komfort / Premium" nicht belegen — es ist deshalb nicht zu einer
Aufgabe geworden, sondern in [LEHRPLAN.md](LEHRPLAN.md) als offener Punkt
vermerkt. Dasselbe gilt für die Prüffristen der Trinkwasserverordnung.
