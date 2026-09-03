/**
 * Vereinfachte Anlagenschemata für Klick-Aufgaben.
 *
 * Gleiche Logik wie im Technik-Tab der Plattform: Bauteile modular,
 * Rohrverläufe als parallele Linien vereinfacht. Wer das hier lesen kann,
 * findet sich in der echten Ansicht wieder — das ist der ganze Zweck.
 *
 * Beschriftungen von Rohren stehen ausserhalb des Balkens, Bauteilnamen
 * darin. Sonst kollidieren lange Wörter wie "Erzeuger-Rücklauf" mit den
 * Nachbarelementen.
 */
import type { HotspotItem } from '../engine/types'

export interface Part {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  /** Rohre werden als flache Balken gezeichnet, Bauteile als Kästen. */
  pipe?: boolean
  /** Wo die Beschriftung sitzt. Standard: innen. */
  labelAt?: 'in' | 'above' | 'below'
}

/** Nicht anklickbare Verbindungslinien – nur damit das Bild wie ein Schema aussieht. */
export type Line = [x1: number, y1: number, x2: number, y2: number]

export interface Diagram {
  parts: Part[]
  connectors: Line[]
  title: string
}

const gasboiler: Diagram = {
  title: 'Gaskessel mit Warmwasserspeicher',
  parts: [
    { id: 'kessel', label: 'Gaskessel', x: 14, y: 92, w: 84, h: 56 },
    { id: 'gaszaehler', label: 'Gaszähler', x: 14, y: 176, w: 84, h: 34 },
    { id: 'erz-vorlauf', label: 'Erzeuger-Vorlauf', x: 106, y: 96, w: 110, h: 16, pipe: true, labelAt: 'above' },
    { id: 'erz-ruecklauf', label: 'Erzeuger-Rücklauf', x: 106, y: 136, w: 110, h: 16, pipe: true, labelAt: 'below' },
    { id: 'verteiler', label: 'Verteiler', x: 224, y: 80, w: 54, h: 90 },
    { id: 'hk-vorlauf', label: 'Heizkreis-Vorlauf', x: 296, y: 52, w: 130, h: 16, pipe: true, labelAt: 'above' },
    { id: 'hk-ruecklauf', label: 'Heizkreis-Rücklauf', x: 296, y: 100, w: 130, h: 16, pipe: true, labelAt: 'above' },
    { id: 'ww-speicher', label: 'Warmwasser-\nspeicher', x: 306, y: 142, w: 120, h: 50 },
    { id: 'zirkulation', label: 'Zirkulation', x: 296, y: 206, w: 130, h: 16, pipe: true, labelAt: 'below' },
  ],
  connectors: [
    [56, 176, 56, 148], // Gaszähler → Kessel
    [98, 104, 106, 104], // Kessel → Erzeuger-Vorlauf
    [98, 144, 106, 144], // Erzeuger-Rücklauf → Kessel
    [216, 104, 224, 104], // Erzeuger-Vorlauf → Verteiler
    [216, 144, 224, 144], // Verteiler → Erzeuger-Rücklauf
    // Der Heizkreis-Vorlauf liegt höher als der Verteiler — er wird über
    // eine Steigleitung angebunden, nicht schwebend danebengesetzt.
    [278, 92, 286, 92],
    [286, 92, 286, 60],
    [286, 60, 296, 60],
    [278, 108, 296, 108], // Verteiler → Heizkreis-Rücklauf
    [278, 155, 306, 155], // Verteiler → Warmwasserspeicher
    [366, 192, 366, 206], // Speicher → Zirkulation
  ],
}

const districtheating: Diagram = {
  title: 'Fernwärme-Übergabestation',
  parts: [
    { id: 'primaer-vorlauf', label: 'Vorlauf primär', x: 14, y: 66, w: 104, h: 16, pipe: true, labelAt: 'above' },
    { id: 'wmz', label: 'Wärmemengen-\nzähler', x: 14, y: 104, w: 104, h: 44 },
    { id: 'primaer-ruecklauf', label: 'Rücklauf primär', x: 14, y: 170, w: 104, h: 16, pipe: true, labelAt: 'below' },
    { id: 'waermetauscher', label: 'Wärme-\ntauscher', x: 130, y: 66, w: 86, h: 120 },
    { id: 'sek-vorlauf', label: 'Vorlauf sekundär', x: 228, y: 66, w: 122, h: 16, pipe: true, labelAt: 'above' },
    { id: 'sek-ruecklauf', label: 'Rücklauf sekundär', x: 228, y: 170, w: 122, h: 16, pipe: true, labelAt: 'below' },
    { id: 'heizkreis', label: 'Heizkreis', x: 358, y: 96, w: 68, h: 60 },
  ],
  connectors: [
    [66, 82, 66, 104],
    [118, 74, 130, 74],
    [118, 178, 130, 178],
    [216, 74, 228, 74],
    [216, 178, 228, 178],
    [350, 74, 392, 74],
    [392, 74, 392, 96],
    [392, 156, 392, 178],
    [350, 178, 392, 178],
  ],
}

const heatpumpPv: Diagram = {
  title: 'PV, Batterie und Wärmepumpe',
  parts: [
    { id: 'pv', label: 'PV-Anlage', x: 14, y: 42, w: 92, h: 44 },
    { id: 'batterie', label: 'Batterie', x: 14, y: 108, w: 92, h: 44 },
    { id: 'netz', label: 'Netz', x: 14, y: 174, w: 92, h: 40 },
    { id: 'ems', label: 'GreenBox\n(EMS)', x: 140, y: 100, w: 100, h: 62 },
    { id: 'waermepumpe', label: 'Wärmepumpe', x: 276, y: 62, w: 116, h: 52 },
    { id: 'puffer', label: 'Puffer-\nspeicher', x: 276, y: 142, w: 116, h: 60 },
  ],
  connectors: [
    [106, 64, 124, 64],
    [124, 64, 124, 130],
    [106, 130, 140, 130],
    [106, 194, 124, 194],
    [124, 194, 124, 130],
    [240, 120, 258, 120],
    [258, 120, 258, 88],
    [258, 88, 276, 88],
    [258, 120, 258, 172],
    [258, 172, 276, 172],
    [334, 114, 334, 142],
  ],
}

const DIAGRAMS: Record<HotspotItem['schematic'], Diagram> = {
  gasboiler,
  districtheating,
  'heatpump-pv': heatpumpPv,
}

/** Vollständige Geometrie – für die Integritätsprüfung in den Tests. */
export const SCHEMATIC_DIAGRAMS: Record<HotspotItem['schematic'], Diagram> = DIAGRAMS

export const SCHEMATICS = Object.fromEntries(
  Object.entries(DIAGRAMS).map(([k, v]) => [k, v.parts]),
) as Record<HotspotItem['schematic'], Part[]>

export const SCHEMATIC_TITLES = Object.fromEntries(
  Object.entries(DIAGRAMS).map(([k, v]) => [k, v.title]),
) as Record<HotspotItem['schematic'], string>

interface Props {
  schematic: HotspotItem['schematic']
  selected: string | null
  correctId?: string
  revealed: boolean
  onPick(id: string): void
}

export function Schematic({ schematic, selected, correctId, revealed, onPick }: Props) {
  const { parts, connectors, title } = DIAGRAMS[schematic]

  const stateClass = (p: Part) => {
    if (revealed) {
      if (p.id === correctId) return 'hot--correct'
      if (p.id === selected) return 'hot--wrong'
      return ''
    }
    return p.id === selected ? 'hot--selected' : ''
  }

  const labelLines = (p: Part) => {
    const lines = p.label.split('\n')
    const at = p.labelAt ?? 'in'
    const cx = p.x + p.w / 2
    const baseY =
      at === 'above' ? p.y - 6 : at === 'below' ? p.y + p.h + 14 : p.y + p.h / 2 + 4
    return lines.map((line, li) => ({
      line,
      x: cx,
      y: baseY + (li - (lines.length - 1) / 2) * 12,
    }))
  }

  return (
    <svg className="schematic" viewBox="0 0 440 250" role="group" aria-label={title}>
      <g stroke="var(--gf-glaciar-gray)" strokeWidth="1.5" fill="none">
        {connectors.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>

      {parts.map((p) => (
        <g
          key={p.id}
          className={`hot ${stateClass(p)}`}
          onClick={() => !revealed && onPick(p.id)}
          role="button"
          tabIndex={revealed ? -1 : 0}
          aria-label={p.label.replace(/\n/g, ' ')}
          aria-pressed={p.id === selected}
          onKeyDown={(e) => {
            if (!revealed && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              onPick(p.id)
            }
          }}
        >
          {/*
            Unsichtbare, grössere Trefferfläche. Ein 16 px hoher Rohrbalken
            ist auf einem Handy nicht zuverlässig zu treffen — die Fläche
            wächst nach oben und unten mit und schliesst die Beschriftung
            ein, ohne das Bild zu verändern.
          */}
          <rect
            x={p.x}
            y={p.y - (p.pipe ? 12 : 2)}
            width={p.w}
            height={p.h + (p.pipe ? 24 : 4)}
            fill="transparent"
          />
          <rect
            className="hot-shape"
            x={p.x}
            y={p.y}
            width={p.w}
            height={p.h}
            rx={p.pipe ? 8 : 6}
          />
          {labelLines(p).map(({ line, x, y }, li) => (
            <text key={li} className="hot-label" x={x} y={y} textAnchor="middle">
              {line}
            </text>
          ))}
        </g>
      ))}
    </svg>
  )
}
