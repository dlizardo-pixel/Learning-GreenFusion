import type { Source } from '../engine/types'

/**
 * Quellenangaben, zentral.
 *
 * Jede Aufgabe nennt ihre Herkunft; die Angaben stehen hier an einer
 * Stelle, damit ein aktualisierter Link nicht an dreissig Stellen gepflegt
 * werden muss.
 *
 * Für Rechtsinhalte wird auf den Gesetzestext selbst verwiesen, nicht auf
 * eine interne Zusammenfassung: Fristen und Schwellen sind zu wichtig, um
 * sie aus zweiter Hand zu lernen.
 */

// ── Produkt ───────────────────────────────────────────────────────────
export const SPEC: Source = {
  label: 'Product Specification 1.0 (08.26)',
  url: 'https://app.notion.com/p/36d8e7b69be5818bbff9e11b126cb984',
}
/**
 * Der validierte Ist-Stand des Produkts – bewusst getrennt von der
 * Product Specification. Die Spec beschreibt, was gebaut wurde; diese
 * Seite beschreibt, was davon heute tatsächlich im Feld läuft. Für den
 * Vertrieb ist der Unterschied entscheidend.
 */
export const STATUSQUO: Source = {
  label: 'GreenFusion Product – Status Quo (Stand 07/2026)',
  url: 'https://app.notion.com/p/3a68e7b69be58070b468e4614d30faf3',
}

export const spec = (section: string): Source => ({
  ...SPEC,
  label: `Product Specification 1.0, ${section}`,
})
export const SPEC_21 = spec('Abschnitt 2.1 Datenerfassung')
export const SPEC_22 = spec('Abschnitt 2.2 Monitoring')
export const SPEC_24 = spec('Abschnitt 2.4 Optimierungsempfehlungen')
export const SPEC5 = spec('Abschnitt 5 Data Management & Compliance')

// ── Vertrieb ──────────────────────────────────────────────────────────
export const DECK: Source = {
  label: 'Sales Materials – Pitch- & Angebots-Deck (Preise, Benchmarks, Case Studies)',
}
export const BENCH: Source = { label: 'Einsparwerte nach Anlagentyp (Pitch-Deck-Benchmark)' }
export const PREISBLATT: Source = {
  label: 'Preisblatt KI-Energiespar-Pilot 2026 (Stand Juni 2026, gültig ab 01.07.2026)',
  url: 'https://drive.google.com/file/d/1SX95Bhg-KNYvkQTvH2juZUgl-FKm8_O8/view',
}
export const COMPLAY: Source = {
  label: 'Commercial Playbook – Go-to-Market-Framework & kommerzielles Regelwerk',
  url: 'https://app.notion.com/p/2408e7b69be580ceba22e8e644cd4cf3',
}
export const PLAYBOOK: Source = {
  label: 'Angeboterstellung & Das Preismodell (Commercial Playbook)',
  url: 'https://app.notion.com/p/1948e7b69be580a68abbe01a38a1ed4e',
}
export const ICP: Source = { label: 'Green Fusion Sales Expert – Zielkunden (ICP) & Sales-Prozess' }

// ── Recht ─────────────────────────────────────────────────────────────
export const KB: Source = {
  label: 'Knowledge Base: Umlagefähigkeit der Kosten von Green Fusion zur Heizungsoptimierung',
  url: 'https://knowledge.green-fusion.de/umlagef%C3%A4higkeit-der-kosten-von-green-fusion-zur-heizungsoptimierung',
}
export const GEG_60A: Source = {
  label: '§ 60a GEG – Prüfung und Optimierung von Wärmepumpen (Gesetzestext)',
  url: 'https://www.gesetze-im-internet.de/geg/__60a.html',
}
export const GEG_60B: Source = {
  label: '§ 60b GEG – Prüfung und Optimierung älterer Heizungsanlagen (Gesetzestext)',
  url: 'https://www.gesetze-im-internet.de/geg/__60b.html',
}
export const GEG_60C: Source = {
  label: '§ 60c GEG – Hydraulischer Abgleich und weitere Maßnahmen (Gesetzestext)',
  url: 'https://www.gesetze-im-internet.de/geg/__60c.html',
}
export const TUEV: Source = {
  label: 'Interne Notiz: TÜV-Zertifikat §71a GEG (Certipedia 0000088020)',
  url: 'https://app.notion.com/p/19d8e7b69be5801ea09cdc943fbc5739',
}
export const KEDI: Source = {
  label: 'Webinar-Vorbereitung "Umlagefähigkeit Deep Dive" mit KEDi (Gregor Jaschke)',
  url: 'https://app.notion.com/p/23f8e7b69be580d19527e6626ce36efe',
}

// ── Wohnungswirtschaft ────────────────────────────────────────────────
/**
 * Rechtsformen und Gremien sind kein Beiwerk, sondern sagen den
 * Entscheidungsweg voraus. Deshalb steht hier das Gesetz und nicht die
 * Zusammenfassung eines Vertriebstrainings.
 */
export const GENG_27: Source = {
  label: '§ 27 GenG – Leitung der Genossenschaft (Gesetzestext)',
  url: 'https://www.gesetze-im-internet.de/geng/__27.html',
}
export const GENG_38: Source = {
  label: '§ 38 GenG – Aufgaben des Aufsichtsrats (Gesetzestext)',
  url: 'https://www.gesetze-im-internet.de/geng/__38.html',
}
export const GENG_43A: Source = {
  label: '§ 43a GenG – Vertreterversammlung (Gesetzestext)',
  url: 'https://www.gesetze-im-internet.de/geng/__43a.html',
}
export const GENG_54: Source = {
  label: '§ 54 GenG – Pflichtmitgliedschaft im Prüfungsverband (Gesetzestext)',
  url: 'https://www.gesetze-im-internet.de/geng/__54.html',
}
export const GENG_53: Source = {
  label: '§ 53 GenG – Pflichtprüfung (Gesetzestext)',
  url: 'https://www.gesetze-im-internet.de/geng/__53.html',
}
/**
 * Der Jahreslauf eines Wohnungsunternehmens steht in drei Gesetzen und
 * einer Satzung. Er ist kein Verwaltungsdetail: er entscheidet, wann eine
 * Entscheidung überhaupt möglich ist.
 */
export const HGB_336: Source = {
  label: '§ 336 HGB – Pflicht zur Aufstellung von Jahresabschluss und Lagebericht (Gesetzestext)',
  url: 'https://www.gesetze-im-internet.de/hgb/__336.html',
}
export const GENG_48: Source = {
  label: '§ 48 GenG – Zuständigkeit der Generalversammlung (Gesetzestext)',
  url: 'https://www.gesetze-im-internet.de/geng/__48.html',
}
export const BGB_556: Source = {
  label: '§ 556 Abs. 3 BGB – Abrechnung der Betriebskosten (Gesetzestext)',
  url: 'https://www.gesetze-im-internet.de/bgb/__556.html',
}
/**
 * Was das Gesetz offenlässt, regelt die Satzung: ab welcher Summe der
 * Vorstand die Zustimmung des Aufsichtsrats braucht und wie oft der
 * Aufsichtsrat zusammentritt. Satzungen von Wohnungsgenossenschaften sind
 * öffentlich einsehbar — hier eine als Beispiel.
 */
export const SATZUNG: Source = {
  label: 'Satzung einer Wohnungsgenossenschaft (Beispiel: WGLi Wohnungsgenossenschaft Lichtenberg eG)',
  url: 'https://www.wgli.de/wp-content/uploads/2022/04/WGLi_Satzung_A5_20190711-Deutsch_Web.pdf',
}

export const BGB_556C: Source = {
  label: '§ 556c BGB – Umstellung auf gewerbliche Wärmelieferung (Gesetzestext)',
  url: 'https://www.gesetze-im-internet.de/bgb/__556c.html',
}
export const GDW: Source = {
  label: 'GdW – Unternehmenssparten und Mitgliederstruktur',
  url: 'https://www.gdw.de/der-gdw/unternehmenssparten/',
}
export const VDW_RW: Source = {
  label: 'VdW Rheinland Westfalen – Der Verband',
  url: 'https://vdw-rw.de/der-verband/',
}
/**
 * Die Rechtsprechung zum Auftraggeberstatus kommunaler
 * Wohnungsunternehmen ist nicht einheitlich. Genau deshalb ist die
 * Quelle eine anwaltliche Einordnung und keine Regel — und die Aufgabe
 * lehrt Nachfragen statt Annehmen.
 */
export const VERGABE: Source = {
  label: 'GGSC: Wann sind kommunale Wohnungsbaugesellschaften öffentliche Auftraggeber?',
  url: 'https://www.ggsc.de/aktuelles/newsletter/newsletter-bau-mai-2019/wann-sind-kommunale-wohnungsbaugesellschaften-oeffentliche-auftraggeber',
}
/**
 * Dass Objektbetreuung ein eigenes Berufsbild mit eigener Fortbildung
 * ist, belegt besser als jede Behauptung, warum diese Rolle im Projekt
 * zählt.
 */
export const VDW_BAYERN: Source = {
  label: 'VdW Bayern – Fortbildung "Technisches Wissen für Hausmeister und Objektbetreuer"',
  url: 'https://www.vdwbayern.de/kalender/',
}
export const KOMMAR: Source = {
  label: 'BVerwG zum Weisungsrecht des Stadtrats gegenüber seinen Aufsichtsratsmitgliedern',
  url: 'https://www.strunz-alter.de/aktuelle-informationen/bverwg-weisungsrecht-des-stadtrates-gegenueber-seinen-vertretern-im-aufsichtsrat-eines-kommunalen-unternehmens/',
}
export const PROFILE: Source = {
  label: 'Kundenprofile aus echten Gesprächsmitschriften (Green Fusion Sales Expert)',
}

// ── Markt ─────────────────────────────────────────────────────────────
export const IMMOCONN: Source = {
  label: 'Wettbewerber-Notiz Immoconn (Vortragsmitschrift)',
  url: 'https://app.notion.com/p/89222c7d522d4ea3af6d8175801959e0',
}

/**
 * Trinkwasserhygiene ist die harte Untergrenze jeder
 * Warmwasser-Optimierung. Das Arbeitsblatt W 551 wird derzeit
 * überarbeitet (Entwurf W 551-1); die Temperaturgrenzen für Grossanlagen
 * sind seit 2004 unverändert.
 */
export const DVGW_W551: Source = {
  label: 'DVGW W 551 – Vermeidung von Legionellen im Trinkwasser',
  url: 'https://www.dvgw.de/themen/wasser/wasserqualitaet/vermeidung-von-legionellen-im-trinkwasser',
}
/**
 * Die Bundesförderstelle erklärt beide Verfahren des hydraulischen
 * Abgleichs neutral — besser als jede Herstellerseite.
 */
export const GEBAEUDEFORUM: Source = {
  label: 'Gebäudeforum klimaneutral (dena) – Hydraulischer Abgleich: Verfahren A und B',
  url: 'https://www.gebaeudeforum.de/realisieren/heizungstechnik/hydraulischer-abgleich/',
}

/**
 * Allgemein anerkanntes Fachwissen der Heizungstechnik, das in keiner
 * einzelnen internen Quelle steht. Bewusst als solches gekennzeichnet,
 * damit man sieht, wo eine interne Quelle fehlt.
 */
export const FACH: Source = { label: 'Heizungstechnische Grundlagen (Fachwissen)' }
