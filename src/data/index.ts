import type { Item, LearningModule, ModuleId, Unit } from '../engine/types'
import { modules } from './modules'
import { m1Items } from './items/m1'
import { m2Items } from './items/m2'
import { m3Items } from './items/m3'
import { m4Items } from './items/m4'
import { m5Items } from './items/m5'
import { m6Items } from './items/m6'
import { m7Items } from './items/m7'
import { m8Items } from './items/m8'
import { m9Items } from './items/m9'

export { modules } from './modules'

export const items: Item[] = [
  ...m1Items,
  ...m2Items,
  ...m3Items,
  ...m4Items,
  ...m5Items,
  ...m6Items,
  ...m7Items,
  ...m8Items,
  ...m9Items,
]

export const units: Unit[] = modules.flatMap((m) => m.units)

export const itemById = new Map(items.map((i) => [i.id, i]))
export const moduleById = new Map<ModuleId, LearningModule>(modules.map((m) => [m.id, m]))
export const unitById = new Map(units.map((x) => [x.id, x]))

export const itemsInUnit = (unitId: string) => items.filter((i) => i.unitId === unitId)
export const itemsInModule = (moduleId: string) => items.filter((i) => i.moduleId === moduleId)
