import type { LearningModule, ModuleId, Unit } from '../engine/types'

/**
 * Der Lehrplan des Zertifikats "GF Heiz-Kompass – Level 1".
 *
 * Die Nummerierung (`code`) folgt dem Lehrplan, damit man von einer
 * Lektion in der App auf die Stelle im Curriculum schliessen kann und
 * umgekehrt. Jede Lektion hat ein Ziel in einem Satz — was kann ich
 * danach, was ich vorher nicht konnte.
 *
 * Zwei Lektionen sind Ergänzungen gegenüber dem ursprünglichen Lehrplan
 * und als solche gekennzeichnet: 4.9 (Daten, Datenschutz und KI) und 6.5
 * (Prozess und Methodik). Beides ist Wissen, das im Kundengespräch
 * gebraucht wird und sonst keinen Platz hätte.
 *
 * Modul 9 ist vollständig neu und im ursprünglichen Lehrplan nicht
 * vorgesehen. Es beantwortet die Frage, die vor jeder Fachfrage kommt:
 * wie arbeitet eigentlich ein Wohnungsunternehmen?
 */

const u = (
  moduleId: ModuleId,
  id: string,
  code: string,
  title: string,
  goal: string,
  icon: string,
): Unit => ({ id, moduleId, code, title, goal, icon })

export const modules: LearningModule[] = [
  {
    id: 'm1-grundlagen',
    number: 1,
    title: 'Physik & Technik',
    subtitle: 'Vom Keller aufwärts – ohne Vorwissen',
    icon: '🔧',
    color: '#3AD99F',
    units: [
      u('m1-grundlagen', 'm1-u1', '1.1', 'Wärmeerzeuger im Vergleich',
        'Du erkennst Gaskessel, Fernwärme, BHKW, Solarthermie und Wärmepumpe und weisst, was jeweils gemessen wird.', '🔥'),
      u('m1-grundlagen', 'm1-u2', '1.2', 'Wärmeverteilung',
        'Du kannst Vorlauf, Rücklauf und Spreizung erklären und weisst, wozu Puffer und hydraulische Weiche da sind.', '🔁'),
      u('m1-grundlagen', 'm1-u3', '1.3', 'Wärmeübergabe & Trägheit',
        'Du kannst erklären, warum die Trägheit eines Systems darüber entscheidet, welche Optimierung überhaupt wirkt.', '🌡️'),
      u('m1-grundlagen', 'm1-u4', '1.4', 'Warmwasserbereitung',
        'Du unterscheidest zentral und dezentral, Speicher und Durchfluss – und weisst, was das für die Optimierung bedeutet.', '🚿'),
      u('m1-grundlagen', 'm1-u5', '1.5', 'Kennzahlen',
        'Du kannst Heizlast, JAZ, kWh/m²a und Gradtagszahlen einordnen, ohne sie zu verwechseln.', '📐'),
    ],
  },
  {
    id: 'm2-regelung',
    number: 2,
    title: 'Regelung & Digitalisierung',
    subtitle: 'Was ein Regler kann – und was darüber entscheidet',
    icon: '🎛️',
    color: '#12AF7D',
    units: [
      u('m2-regelung', 'm2-u1', '2.1–2.2', 'Steuerung, Regelung, Regelkreis',
        'Du kannst den Unterschied zwischen Steuerung und Regelung erklären und einen Regelkreis benennen.', '⚙️'),
      u('m2-regelung', 'm2-u3', '2.3', 'Die Heizkurve',
        'Du kannst Steigung, Niveau und witterungsgeführte Regelung erklären – unser wichtigster Hebel.', '📈'),
      u('m2-regelung', 'm2-u4', '2.4', 'Nachtabsenkung',
        'Du kennst Konzept, typische Zeitfenster und Wirkung – und die Grenzen bei Schichtarbeit.', '🌙'),
      u('m2-regelung', 'm2-u5', '2.5', 'Hydraulischer Abgleich',
        'Du kannst sauber trennen, was der Abgleich ist und was er nicht ist – das trägt später die Umlagefähigkeit.', '🔩'),
      u('m2-regelung', 'm2-u6', '2.6', 'Gebäudeleittechnik',
        'Du kannst GLT einordnen und sagen, wo unsere Leistung endet und die eines GLT-Anbieters beginnt.', '🏢'),
      u('m2-regelung', 'm2-u7', '2.7–2.8', 'Reglerlandschaft',
        'Du verstehst, warum der Regler im Keller über Fernoptimierbarkeit entscheidet – nicht das Gebäude, nicht der Erzeuger.', '🗺️'),
    ],
  },
  {
    id: 'm3-produkt',
    number: 3,
    title: 'Green Fusion Produktlogik',
    subtitle: 'Das Kernmodul: was wir wirklich verkaufen',
    icon: '🖥️',
    color: '#0054B1',
    units: [
      u('m3-produkt', 'm3-u1', '3.1', 'Energiespar-Pilot im Überblick',
        'Du kannst Monitoring, Alarmierung und Optimierung als ein Paket erklären und die Plattform führen.', '📦'),
      u('m3-produkt', 'm3-u2', '3.2', 'Datenerfassung & GreenBox',
        'Du weisst, wie Daten in die Plattform kommen und was die GreenBox-Generationen unterscheidet.', '📡'),
      u('m3-produkt', 'm3-u3', '3.3', 'Optimierungsempfehlungen',
        'Du kannst Erst- und Folge-Optimierung trennen und erklären, warum wir je Subsystem rechnen.', '💡'),
      u('m3-produkt', 'm3-u4', '3.4', 'Sonderfälle & Ausschlüsse',
        'Du weisst, welche Subsysteme keine Empfehlung bekommen – und kannst sagen warum, nicht nur dass.', '🚧'),
      u('m3-produkt', 'm3-u5', '3.5–3.9', 'Freigabe & Logbuch',
        'Du kannst den Weg von der Empfehlung zur umgesetzten Änderung führen und die Grenzen des Logbuchs benennen.', '📋'),
      u('m3-produkt', 'm3-u6', '3.6', 'Remote, On-Site, kontinuierlich',
        'Du kannst begründen, warum Kontinuität der Pitch ist und nicht der einmalige Abgleich.', '🔄'),
      u('m3-produkt', 'm3-u7', '3.7', 'Erfolgsmessung',
        'Du kannst die Temperaturdifferenz-Methode erklären und die Zahl als fundierte Näherung einordnen.', '📊'),
      u('m3-produkt', 'm3-u8', '3.8', 'Trinkwarmwasser-Hygiene',
        'Du verstehst das DVGW-Ampelsystem und warum wir hier überwachen statt zu optimieren.', '🚰'),
    ],
  },
  {
    id: 'm4-recht',
    number: 4,
    title: 'Regulatorik & Recht',
    subtitle: 'Fristen, Pflichten, Umlagefähigkeit',
    icon: '⚖️',
    color: '#216377',
    units: [
      u('m4-recht', 'm4-u1', '4.1', 'GEG: Grundlagen & Historie',
        'Du kannst den Weg von EnEG und EnEV zum GEG einordnen und weisst, wofür das Gesetz da ist.', '📜'),
      u('m4-recht', 'm4-u2', '4.2', '§60a & §60b: Prüfpflichten',
        'Du kennst Fristen und Schwellen – und die Ausnahme, die fernüberwachte Anlagen privilegiert.', '⏳'),
      u('m4-recht', 'm4-u3', '4.3', '§60c: Hydraulischer Abgleich',
        'Du weisst, wann der Abgleich Pflicht wird, nach welchem Verfahren und wer die Bestätigung sehen darf.', '🔧'),
      u('m4-recht', 'm4-u4', '4.4', '§71a & TÜV',
        'Du kannst erklären, wie unsere Zertifizierung eine gesetzliche Prüfpflicht ersetzt – und was sie nicht ersetzt.', '🎖️'),
      u('m4-recht', 'm4-u5', '4.5', 'EED im Überblick',
        'Du kannst den europäischen Rahmen in zwei Sätzen einordnen, ohne ins Detail zu gehen.', '🇪🇺'),
      u('m4-recht', 'm4-u6', '4.6–4.8', 'Umlagefähigkeit',
        'Du kannst einem Mieter-Widerspruch begründet antworten und weisst, warum Wirtschaftlichkeit die Voraussetzung ist.', '🧾'),
      u('m4-recht', 'm4-u7', '4.7', 'Trinkwasser & Hygienepflichten',
        'Du weisst, welche Pflichten beim Trinkwarmwasser bestehen und wo unsere Überwachung dabei hilft.', '💧'),
      u('m4-recht', 'm4-u8', '4.9*', 'Daten, Datenschutz & KI',
        'Du kannst Fragen von IT und Datenschutz beantworten, ohne ins Schwimmen zu kommen. (Ergänzung zum Lehrplan)', '🔐'),
    ],
  },
  {
    id: 'm5-markt',
    number: 5,
    title: 'Wettbewerb & Markt',
    subtitle: 'Wer macht was – und wo liegt die Lücke',
    icon: '🧭',
    color: '#4F8DDF',
    units: [
      u('m5-markt', 'm5-u1', '5.1', 'Monitoring-only vs. aktive Optimierung',
        'Du kannst die grundsätzliche Marktlinie erklären und weisst, warum sie über die Umlagefähigkeit entscheidet.', '↔️'),
      u('m5-markt', 'm5-u2', '5.2', 'Fallbeispiel Immoconn',
        'Du kennst Stärken und die Argumentationslücke – und grenzt dich ab, ohne schlecht über andere zu reden.', '🔍'),
      u('m5-markt', 'm5-u3', '5.3–5.4', 'Nachbarfelder einordnen',
        'Du kannst in Sekunden sagen, ob eine Anfrage zu uns, zu einem Partner oder zum Kunden selbst gehört.', '🧩'),
    ],
  },
  {
    id: 'm6-wirtschaft',
    number: 6,
    title: 'Wirtschaftlichkeit & Vertrieb',
    subtitle: 'Rechnen, anbieten, Einwände einordnen',
    icon: '💼',
    color: '#E0A32E',
    units: [
      u('m6-wirtschaft', 'm6-u1', '6.1', 'Rentabilitätsschwelle & Zielkunden',
        'Du kannst im Kopf einschätzen, ob sich ein Portfolio rechnet – anlagenbasiert, nicht nach Einheitenzahl.', '🧮'),
      u('m6-wirtschaft', 'm6-u2', '6.2', 'Preismodell-Grundlagen',
        'Du kennst die Preisbestandteile und weisst, warum die Umlagefähigkeit an der Optimierung hängt.', '💸'),
      u('m6-wirtschaft', 'm6-u3', '6.3', 'Rahmenverträge & Angebot',
        'Du kannst ein Angebot korrekt aufbauen und kennst die Rabattgrenzen ohne Nachsehen.', '📄'),
      u('m6-wirtschaft', 'm6-u4', '6.4–6.5', 'Technische Einwände',
        'Du hast auf die häufigsten Einwände technischer Leiter eine Antwort, die eine Frage zurückgibt.', '🛡️'),
      u('m6-wirtschaft', 'm6-u5', '6.6*', 'Prozess & Methodik',
        'Du weisst, was in welcher Stage passieren muss und wie ein Meeting bewertet wird. (Ergänzung zum Lehrplan)', '🗺️'),
    ],
  },
  {
    id: 'm7-sektorkopplung',
    number: 7,
    title: 'Sektorkopplung',
    subtitle: 'PV, Batterie, Wärmepumpe – ein anderes Spiel',
    icon: '☀️',
    color: '#00BCA4',
    units: [
      u('m7-sektorkopplung', 'm7-u1', '7.1', 'Echtzeit vs. iterativ',
        'Du kannst erklären, warum PV plus Wärmepumpe Echtzeitsteuerung braucht und ein Gaskessel nicht.', '⚡'),
      u('m7-sektorkopplung', 'm7-u2', '7.2', 'Anforderungen & Machbarkeit',
        'Du kannst in einer Frage qualifizieren, ob ein Gebäude für Sektorkopplung geeignet ist.', '✅'),
      u('m7-sektorkopplung', 'm7-u3', '7.3', '§9 EEG & Einspeisung',
        'Du verstehst den Unterschied zwischen Erzeugung und Einspeisung drosseln – und was das wert ist.', '🔌'),
      u('m7-sektorkopplung', 'm7-u4', '7.4', 'Mieterstrom & GGV',
        'Du kannst die Grundbegriffe der PV-Nutzungsmodelle auseinanderhalten.', '🏘️'),
      u('m7-sektorkopplung', 'm7-u5', '7.5', 'Ausblick',
        'Du kannst sagen, was heute läuft und was Roadmap ist – ohne die Roadmap zu verkaufen.', '🔭'),
    ],
  },
  {
    id: 'm8-praxis',
    number: 8,
    title: 'Praxis & Zertifizierung',
    subtitle: 'Anwenden, was du gelernt hast',
    icon: '🎓',
    color: '#2F4858',
    units: [
      u('m8-praxis', 'm8-u1', '8.1', 'Kellerbegehung',
        'Du kannst ein echtes hydraulisches Schema lesen und die Bauteile benennen.', '🏚️'),
      u('m8-praxis', 'm8-u2', '8.2', 'Gesprächssimulation',
        'Du führst ein vollständiges Gespräch von der Situationsaufnahme bis zur Einwandbehandlung.', '🎭'),
      u('m8-praxis', 'm8-u3', '8.3', 'Vor der Abschlussprüfung',
        'Du prüfst quer über alle Module, wo noch Lücken sind – bevor es zählt.', '🏁'),
    ],
  },
  {
    id: 'm9-wohnungswirtschaft',
    number: 9,
    title: 'Wohnungswirtschaft verstehen',
    subtitle: 'Wer sitzt dir gegenüber – und wer entscheidet wirklich',
    icon: '🏘️',
    // Sunstone, der sekundäre Brand-Akzent — die einzige noch freie Token-Farbe,
    // die sich von den acht bestehenden Modulfarben klar unterscheidet.
    color: '#EB5D38',
    units: [
      u('m9-wohnungswirtschaft', 'm9-u1', '9.1', 'Wer besitzt was',
        'Du erkennst an der Rechtsform, wem das Unternehmen gehört und wem seine Führung Rechenschaft schuldet.', '🏛️'),
      u('m9-wohnungswirtschaft', 'm9-u2', '9.2', 'Wer entscheidet was',
        'Du kannst den Entscheidungsweg bis zur Unterschrift benennen – und er ist je Rechtsform ein anderer.', '✍️'),
      u('m9-wohnungswirtschaft', 'm9-u3', '9.3', 'Die Rollen im Alltag',
        'Du weisst, wer den Ausfall merkt, wer bestellt und wer dich in den Keller lässt.', '👷'),
      u('m9-wohnungswirtschaft', 'm9-u4', '9.4', 'Stadtwerke & Wärmelieferung',
        'Du kannst die vier Rollen eines Stadtwerks auseinanderhalten: Kunde, Lieferant, Contractor, Wettbewerber.', '🏭'),
      u('m9-wohnungswirtschaft', 'm9-u5', '9.5', 'Verbände & Netzwerke',
        'Du verstehst, warum Verbände in dieser Branche mehr Gewicht haben als Werbung – und warum das gesetzlich so ist.', '🤝'),
      u('m9-wohnungswirtschaft', 'm9-u6', '9.6', 'Wen musst du fragen?',
        'Du liest aus Rechtsform, Grösse und Gremien ab, welchen Weg ein Abschluss nehmen wird.', '🧭'),
    ],
  },
]

export const moduleById = new Map(modules.map((m) => [m.id, m]))
export const allUnits: Unit[] = modules.flatMap((m) => m.units)
export const unitById = new Map(allUnits.map((x) => [x.id, x]))
