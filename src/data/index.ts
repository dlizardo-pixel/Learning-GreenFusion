import type { Course, Item, Unit } from '../engine/types'
import { technikCourse, technikItems } from './courses/technik'
import { produktCourse, produktItems } from './courses/produkt'
import { vertriebCourse, vertriebItems } from './courses/vertrieb'
import { rechtCourse, rechtItems } from './courses/recht'

export const courses: Course[] = [technikCourse, produktCourse, vertriebCourse, rechtCourse]

export const items: Item[] = [...technikItems, ...produktItems, ...vertriebItems, ...rechtItems]

export const units: Unit[] = courses.flatMap((c) => c.units)

export const itemById = new Map(items.map((i) => [i.id, i]))
export const courseById = new Map(courses.map((c) => [c.id, c]))
export const unitById = new Map(units.map((u) => [u.id, u]))

export const itemsInUnit = (unitId: string) => items.filter((i) => i.unitId === unitId)
export const itemsInCourse = (courseId: string) => items.filter((i) => i.courseId === courseId)
