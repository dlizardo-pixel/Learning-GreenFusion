import type { HotspotItem } from '../../engine/types'
import { Schematic, SCHEMATIC_TITLES } from '../Schematic'
import type { ExerciseProps } from './common'

export function Hotspot({ item, value, onChange, revealed }: ExerciseProps<HotspotItem>) {
  return (
    <>
      <div className="prompt">{item.prompt}</div>
      <div className="tiny muted" style={{ marginBottom: 'var(--gf-space-2)' }}>
        {SCHEMATIC_TITLES[item.schematic]}
      </div>
      <Schematic
        schematic={item.schematic}
        selected={(value as string | null) ?? null}
        correctId={item.answer}
        revealed={revealed}
        onPick={(id) => onChange(id)}
      />
    </>
  )
}
