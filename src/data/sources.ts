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

// ── Markt ─────────────────────────────────────────────────────────────
export const IMMOCONN: Source = {
  label: 'Wettbewerber-Notiz Immoconn (Vortragsmitschrift)',
  url: 'https://app.notion.com/p/89222c7d522d4ea3af6d8175801959e0',
}

/**
 * Allgemein anerkanntes Fachwissen der Heizungstechnik, das in keiner
 * einzelnen internen Quelle steht. Bewusst als solches gekennzeichnet,
 * damit man sieht, wo eine interne Quelle fehlt.
 */
export const FACH: Source = { label: 'Heizungstechnische Grundlagen (Fachwissen)' }
