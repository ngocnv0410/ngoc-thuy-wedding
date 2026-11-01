import type { DanceId } from '../../content/types'
import type { DanceSampler } from './danceSampler'

const samplers: Partial<Record<DanceId, Promise<DanceSampler>>> = {}
const loaders = {
  'ateez-bad': () => import('./badDance'),
  'bang-bang-bang': () => import('./chibiDance'),
}

/** Separate import sites avoid preloading the other dance's data. */
export function loadDance(id: DanceId): Promise<DanceSampler> {
  return samplers[id] ??= loaders[id]()
    .then((module) => module.dancePose)
    .catch((error) => { delete samplers[id]; throw error })
}
