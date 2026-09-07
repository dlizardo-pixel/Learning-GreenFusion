# Lernkonzept

Warum die App so gebaut ist, wie sie gebaut ist. Dieses Dokument ist die
Begründung hinter jeder Design-Entscheidung — wer Inhalte ergänzt oder
Funktionen vorschlägt, sollte es einmal gelesen haben.

## Das Problem, das wir lösen

Bei Green Fusion arbeiten über 100 Menschen an einem Produkt, das
Heizungsanlagen optimiert. Ein Grossteil von ihnen hat nie einen
Heizungskeller von innen gesehen. Das ist kein Vorwurf — es ist normal in
einem Software-Unternehmen. Aber es hat Folgen:

- Im Kundengespräch entstehen Versprechen, die das Produkt heute nicht hält
  („alles läuft automatisch aus der Ferne").
- Fragen zur Umlagefähigkeit werden aus dem Bauch beantwortet, obwohl es
  eine belastbare Argumentationskette gibt.
- Wissen liegt in Notion — aber niemand liest eine 98.000 Zeichen lange
  Product Specification freiwillig zweimal.

Klassische Antworten darauf sind Onboarding-Sessions und Wikis. Beide haben
das gleiche Problem: sie liefern Wissen **einmal**, zu einem Zeitpunkt, an
dem man es nicht braucht. Was danach passiert, beschreibt die
Vergessenskurve.

## Warum nicht einfach Duolingo kopieren

Duolingo trainiert **Reflexe**. Wer „la manzana" sieht, soll ohne Nachdenken
„der Apfel" sagen. Dafür ist die Mechanik gebaut: kurze Wiederholungen,
hohes Tempo, sofortige Korrektur.

Wir brauchen **Verständnis**. Ein Vertriebler muss nicht das Wort
„Heizkurve" abrufen können, sondern im Termin entscheiden können, ob das
Gebäude vor ihm überhaupt Empfehlungen bekommen kann. Das ist eine andere
Aufgabe.

Deshalb übernehmen wir Duolingos **Motivationsmechanik** und ersetzen seine
**Lernmechanik**:

| Übernommen | Verändert |
|---|---|
| Kurze Lektionen (~4 Min, 8 Aufgaben) | Jede Antwort bekommt eine Erklärung mit Quelle |
| Serie, XP, Tagesziel | Keine Herzen, kein Rauswurf bei Fehlern |
| Verteilte Wiederholung | Fehler kommen in derselben Lektion nochmal |
| Gemischte Aufgabentypen | Aufgaben aus echten Kundengesprächen |
| Lernpfad in Lektionen | Lektionen sind nicht gesperrt — freier Einstieg |

## Die fünf tragenden Entscheidungen

### 1. Keine Herzen, keine Bestrafung

Duolingo nimmt bei Fehlern Leben weg und wirft irgendwann aus der Lektion.
Das funktioniert bei Freiwilligen, die eine Sprache aus Spass lernen — und
es funktioniert, weil Bestrafung Spannung erzeugt.

Im Arbeitskontext kippt das. Wer beim Thema Heizungstechnik dreimal
rausgeworfen wird, öffnet die App nicht wieder — und genau diese Person ist
die Zielgruppe. Statt Bestrafung nutzen wir den Teil des Duolingo-Modells,
der tatsächlich lernwirksam ist: **falsch beantwortete Aufgaben werden
hinten an die Lektion angehängt** und wenige Minuten später erneut gestellt,
während die Erklärung noch frisch ist.

→ `src/screens/Lesson.tsx`

### 2. Jede Antwort erklärt sich — mit Quelle

Kein Item darf ohne `why` und `source` in die App; ein Test setzt das
durch. Das hat zwei Gründe.

Der erste ist didaktisch: Multiple-Choice ohne Erklärung erzeugt
Ratewissen. Wer richtig geraten hat, weiss danach nicht, warum. Die
Erklärung erscheint deshalb **auch bei richtiger Antwort**.

Der zweite ist organisatorisch: unser Wissen veraltet. Preise ändern sich,
SLAs werden verbindlich, Sektorkopplung bekommt Funktionen. Eine Lernapp
ohne Quellenangabe wird nach einem Jahr zur Fehlerquelle, die niemand
prüfen kann. Mit Quellenangabe ist jedes Item nachvollziehbar — und
korrigierbar.

### 3. Verteilte Wiederholung statt Pauken

Nach Leitner-Prinzip mit sechs Boxen und Abständen von 0, 1, 3, 7, 16 und
35 Tagen. Bewusst Leitner und nicht SM-2: SM-2 braucht eine
Selbsteinschätzung („wie leicht war das?"), die bei Multiple-Choice
unzuverlässig ist. Leitner braucht nur richtig/falsch — genau das, was wir
sicher messen.

Eine Besonderheit: bei einem Fehler fällt ein Item auf **Box 0** zurück,
nicht eine Box. Wer ein Konzept verwechselt, hat es meist gar nicht
verstanden, nicht „fast".

→ `src/engine/srs.ts`

### 4. Gemischt üben, nicht blockweise

Innerhalb einer Lektion wechseln die Aufgabentypen ab, und fällige
Wiederholungen kommen vor neuem Material — höchstens die Hälfte einer
Lektion ist Wiederholung, sonst kommt man im Lernpfad nie voran.

Gemischtes Üben schneidet in der Lernforschung durchweg besser ab als
blockweises, obwohl es sich beim Üben *schlechter* anfühlt. Das ist eine
der robustesten und gleichzeitig kontraintuitivsten Erkenntnisse zum
Lernen: das Gefühl von Mühelosigkeit ist ein schlechter Indikator für
Lernerfolg.

Lange Aufgaben (Lesetext, Zuordnung, Reihenfolge) landen nie an erster
Stelle und nie direkt hintereinander. Eine Lektion soll mit einem schnellen
Erfolg beginnen.

→ `src/engine/lesson.ts`

### 5. Kein gesperrter Lernpfad

Bei Duolingo sind spätere Lektionen gesperrt, bis frühere bestanden sind.
Für Sprachen ist das richtig — Grammatik baut auf.

Bei uns wäre es falsch. Wer morgen ein Angebotsgespräch hat, muss direkt zu
„Preise & Pakete" springen können, ohne sich vorher durch Heizkreise zu
arbeiten. Die empfohlene Reihenfolge bleibt sichtbar, aber sie ist eine
Empfehlung, kein Tor. Innerhalb einer Lektion sorgt die Levelstufe
(Einstieg → Aufbau → Vertiefung) dafür, dass neues Material trotzdem in
sinnvoller Ordnung kommt.

## Vom Kurs zum Führerschein

Die App ist als **Zertifikat** aufgebaut, nicht als Themensammlung: acht
Module, 43 Lektionen, danach Prüfungen. Das ist mehr als Kosmetik — es
löst ein Problem, das reine Lernpfade haben: sie haben kein Ende.

Ohne Abschluss bleibt „ich lerne gerade Heizungstechnik" ein Dauerzustand
ohne Punkt, an dem man sagen kann: das kann ich jetzt. Mit acht
Modulprüfungen und einer Abschlussprüfung gibt es acht solche Punkte und
ein Ziel.

**Eine Prüfung ist keine Lektion.** Drei Unterschiede, jeder mit Absicht:

| | Lektion | Prüfung |
|---|---|---|
| Fehler | kommen am Ende nochmal | zählen beim ersten Versuch |
| Auflösung | nach jeder Antwort | erst im Debrief am Ende |
| Auswahl | Wiederholung zuerst, dann Neues | Querschnitt über alle Lektionen |

Der zweite Punkt ist der wichtigste: wer nach jeder Frage die Auflösung
sieht, macht eine Übung. Damit die Prüfung trotzdem lehrt, erscheinen alle
Erklärungen samt Quellen vollständig im Debrief — sortiert nach dem, was
nicht saß.

Der dritte verhindert einen echten Fehler: eine Prüfung, die zufällig aus
dem Topf zieht, kann eine halbe Ausbildung auslassen. Gezogen wird deshalb
reihum über die Lektionen — und bei der Abschlussprüfung zweistufig, erst
über die Module, dann innerhalb. Genau daran ist die erste Fassung
gescheitert: sie deckte nur vier von acht Modulen ab, und ein Test hat es
gefunden.

**Die Abschlussprüfung ist die einzige Sperre in der App.** Sie öffnet erst,
wenn alle acht Modulprüfungen bestanden sind. Beim freien Lernen wäre eine
Sperre falsch — bei einer Prüfungsreihenfolge ist sie der Sinn der Sache.

**Ein Fehlversuch kostet nichts.** Der beste Wert bleibt stehen, das
Bestehen kann man nicht wieder verlieren. Wer Angst vor dem Antreten hat,
tritt nicht an.

## Die dreizehn Aufgabentypen

Jeder Typ prüft eine andere Art von Wissen. Das ist der Punkt: wer nur
Multiple-Choice baut, prüft nur Wiedererkennen.

| Typ | Prüft | Beispiel |
|---|---|---|
| **Eine Antwort** (`mc`) | Wiedererkennen, Abgrenzung | „Was macht eine Heizkurve?" |
| **Mehrere Antworten** (`multi`) | Vollständigkeit, Ausschlüsse | „Was ist umlagefähig?" |
| **Stimmt das?** (`truefalse`) | Verbreitete Fehlannahmen | „Der Hausmeister-Eingriff steht im Logbuch." |
| **Lücken füllen** (`cloze`) | Fachbegriffe im Satzkontext | Vorlauf / Rücklauf / Spreizung |
| **Zuordnen** (`match`) | Zusammenhänge zwischen Sets | Anlagentyp ↔ Einsparwert |
| **Reihenfolge** (`order`) | Prozesse | Freigabe → Geprüft → Umgesetzt |
| **Im Schema anklicken** (`hotspot`) | Räumliches Verständnis | „Klick auf den Heizkreis-Vorlauf" |
| **Schätzen** (`estimate`) | Größenordnungen | „Was kostet das Komfort-Paket?" |
| **Kundengespräch** (`scenario`) | Urteilsvermögen | Einwand + vier Reaktionen, jede mit Begründung |
| **Lesen & zusammenfassen** (`readSummarize`) | Echtes Verständnis | Text lesen, in eigenen Worten zusammenfassen |
| **Einsortieren** (`buckets`) | Zuständigkeiten, Systematik | „Wer macht das?" – Green Fusion / Partner / Kunde |
| **Karte beurteilen** (`card`) | Urteil aus Merkmalen | Reglerkarte → fernoptimierbar oder nicht? |
| **Gespräch** (`dialogue`) | Gesprächsführung über mehrere Züge | „Herr Kamp fragt nach Umlagefähigkeit" |

**Einsortieren** unterscheidet sich von der Zuordnung darin, dass mehrere
Begriffe in denselben Korb gehören — bei Zuständigkeiten ist das der
Normalfall, und daran scheitert eine Paar-Zuordnung. Ein Korb, der immer
leer bleibt, ist übrigens ein Fehler und wird vom Test gefunden: er
frustriert, ohne etwas zu prüfen.

**Karte beurteilen** ersetzt den Entscheidungsbaum aus dem Lehrplan. Ein
Baum prüft, ob man dem Baum folgen kann; eine Karte prüft, ob man aus
Merkmalen die Folge ableitet. Letzteres ist die Fähigkeit, die im Termin
gebraucht wird.

**Gespräch** ist der aufwendigste Typ und der einzige, der Gesprächsführung
trainiert. Entscheidend ist der Zeitpunkt der Rückmeldung: während des
Gesprächs sieht man nur, **wie die Person reagiert** — nicht, ob die
Antwort gut war. Die Auswertung kommt am Ende, Zug für Zug. In einem echten
Termin sagt niemand mitten im Satz, dass man es vergeigt hat; man merkt es
an der Reaktion und erfährt es im Debrief. Wer nach jedem Zug ein grünes
Häkchen bekommt, trainiert Multiple-Choice.

Die aufwendigsten Typen sind gleichzeitig die wertvollsten.

**Kundengespräch-Aufgaben** haben eine Besonderheit: nach der Antwort wird
zu *jeder* Option gesagt, warum sie besser oder schlechter ist. Der
Lerneffekt liegt nicht darin, die richtige zu finden, sondern zu verstehen,
warum die plausiblen Alternativen scheitern.

**Lesen & zusammenfassen** ist der einzige Typ, bei dem man nichts erraten
kann. Der Ablauf: Text lesen (150–350 Wörter, eine Kaffeepause) →
Zusammenfassung schreiben → Rückmeldung, welche Kernpunkte abgedeckt waren
und welche fehlten → Musterlösung zum Vergleich.

Die Bewertung läuft heute über **Konzeptabdeckung**: jede Rubrik-Position
hat eine Familie von Stichwörtern, und der Text wird darauf geprüft
(umlautrobust, groß-/kleinschreibungsunabhängig). Dazu eine Mindestlänge,
damit Stichwort-Spam nicht durchgeht.

Das ist bewusst kein Sprachmodell im Kern: die App läuft ohne Backend, ohne
API-Kosten und ohne Netz, und die Rückmeldung ist nachvollziehbar („dir
fehlte Punkt X") statt ein undurchsichtiger Score. Die Grenze ist ehrlich
benannt: eine gute Umschreibung, die keines der hinterlegten Wörter nutzt,
wird nicht erkannt. Für den Wechsel auf eine LLM-Bewertung ist die
Schnittstelle `SummaryGrader` vorbereitet — die Oberfläche muss sich dafür
nicht ändern.

→ `src/engine/summary.ts`

Eine Selbstkontrolle sitzt im Test: **jede Musterlösung muss ihre eigene
Rubrik erfüllen.** Wenn nicht, ist die Rubrik falsch, nicht die Antwort der
Lernenden.

## Die vier Kurse

Aufgeteilt nach *Rolle*, nicht nach Thema — damit jede Person weiss, wo sie
anfängt.

| Kurs | Für wen zuerst | Inhalt |
|---|---|---|
| 🔧 **Heizungstechnik** | alle ohne Vorwissen | Erzeuger/Verbraucher, Heizkurve, Anlagentypen, Warmwasser & Hygiene |
| 🖥️ **Produkt & Plattform** | alle mit Kundenkontakt | Energiespar-Pilot, GreenBox, die vier Tabs, Optimierungs-Workflow, Sektorkopplung |
| 💼 **Wirtschaft & Vertrieb** | Sales, CS, Marketing | ICP, Preise & Pakete, Business Case, Einwände, SPICED |
| ⚖️ **Recht & Regulatorik** | Sales, CS, Support | Umlagefähigkeit, GEG-Prüfpflichten, Datenschutz & EU AI Act |

Jeder Kurs hat 3 bis 5 Lektionen. Jede Lektion hat ein Ziel in einem Satz:
was kann ich danach, was ich vorher nicht konnte.

## Gamification: was wir nutzen und was nicht

**Genutzt:**

- **Serie (Streak)** — der stärkste Mechanismus, weil er das eigentliche
  Ziel abbildet: fünf Minuten täglich schlagen eine Stunde im Monat. Nicht
  wegen Motivation, sondern wegen Vergessen.
- **Tagesziel in XP** mit Fortschrittsring — ein sichtbares, erreichbares
  Ende. Standard 50 XP, etwa eine Lektion.
- **Wochenansicht** — sieben Punkte, gefüllt oder leer. Macht Lücken
  sichtbar, ohne zu mahnen.
- **„Sitzt"-Zähler pro Kurs** — Box 3 erreicht, also dreimal richtig in
  wachsenden Abständen. Das ist eine ehrlichere Aussage als „Lektion
  abgeschlossen".

**Nicht genutzt (und warum):**

- **Herzen/Leben** — siehe oben.
- **Ligen und öffentliche Bestenlisten** — im Team schaffen sie zwei
  Probleme: wer wenig Zeit hat, sieht sich unten, und wer viel Zeit hat,
  klickt für Punkte statt zu lernen. Falls es kommt, dann als
  Team-Bestenliste mit gemeinsamem Ziel, nicht als Rangliste von Personen.
- **Streak-Freeze / Streak kaufen** — funktioniert in einer App mit
  Bezahlmodell. Hier wäre es Bürokratie.
- **Push-Erinnerungen** — braucht ein Backend und eine bewusste
  Entscheidung über Ton. Eine Erinnerung, die nach Chef klingt, ruiniert
  das Ganze.

## Was diese Version noch nicht ist

Ehrlich benannt, damit niemand danach sucht:

- **Kein Backend.** Der Lernstand liegt im Browser (`localStorage`). Wer
  das Gerät wechselt, fängt neu an. Es gibt keine Bestenliste, keine
  Auswertung fürs Team, keine Erinnerungen. Die Schnittstelle
  `StorageAdapter` ist dafür vorbereitet.
- **Kein Login.** Damit auch keine Rollen — jede Person sieht alle Kurse.
- **Inhalte sind händisch gepflegt**, nicht automatisch aus Notion
  gezogen. Das ist Absicht, nicht Faulheit: siehe
  [INHALTE-PFLEGEN.md](INHALTE-PFLEGEN.md).
- **Mobil-optimiert, aber keine App.** Läuft im Browser. Für einen
  Homescreen-Start bräuchte es ein Manifest und einen Service Worker.

## Weiterlesen

- [INHALTE-PFLEGEN.md](INHALTE-PFLEGEN.md) — wie man Aufgaben schreibt und
  was die Qualitätsschwelle ist
- [ROADMAP.md](ROADMAP.md) — was für eine echte Mitarbeiterplattform fehlt
