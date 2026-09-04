import type { Item } from '../../engine/types'
import { MultiChoice, SingleChoice, TrueFalse } from './Choice'
import { Cloze } from './Cloze'
import { Estimate } from './Estimate'
import { Hotspot } from './Hotspot'
import { Match } from './Match'
import { Order } from './Order'
import { ReadSummarize } from './ReadSummarize'
import { Buckets } from './Buckets'
import { Card } from './Card'
import { Dialogue } from './Dialogue'
import type { ExerciseProps } from './common'

export { TYPE_HINT, hasInput, initialValue } from './common'
export type { ExerciseProps } from './common'

/** Wählt die Darstellung zum Aufgabentyp. */
export function Exercise(props: ExerciseProps<Item>) {
  const { item } = props
  switch (item.type) {
    case 'mc':
    case 'scenario':
      return <SingleChoice {...props} item={item} />
    case 'multi':
      return <MultiChoice {...props} item={item} />
    case 'truefalse':
      return <TrueFalse {...props} item={item} />
    case 'cloze':
      return <Cloze {...props} item={item} />
    case 'match':
      return <Match {...props} item={item} />
    case 'order':
      return <Order {...props} item={item} />
    case 'hotspot':
      return <Hotspot {...props} item={item} />
    case 'estimate':
      return <Estimate {...props} item={item} />
    case 'readSummarize':
      return <ReadSummarize {...props} item={item} />
    case 'buckets':
      return <Buckets {...props} item={item} />
    case 'card':
      return <Card {...props} item={item} />
    case 'dialogue':
      return <Dialogue {...props} item={item} />
  }
}
