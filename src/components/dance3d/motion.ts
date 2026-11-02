// [DANCE-SWAP] Sample metadata stays off the 37-channel public pose array.
import type { BakedMotion } from './bakedMotion'
import type { DanceId } from '../../content/types'

/** Quantized root translation, three world quaternions and eight world limb directions. */
export interface MotionClip { fps: number; duration: number; scale: number; source: string; frames: number[][]; retargeted?: BakedMotion }
// [DANCE-SWAP] No history-based damping: pause, seek, loops and frame rate return the same pose.
const samples = new WeakMap<number[], { clip: MotionClip; seconds: number }>()
export const motionSampleContext = (pose: number[]) => samples.get(pose)
const loading: Partial<Record<DanceId, Promise<MotionClip>>> = {}
const loaders = {
  // [DANCE-SWAP] Keep the existing IDs/cache/media-clock interface; retain old tracks for rollback.
  'ateez-bad': () => import('./badInPlaceMotion.json'),
  'bang-bang-bang': () => import('./bangSourceMotion.json'),
}
export function loadMotion3D(id: DanceId): Promise<MotionClip> {
  return loading[id] ??= loaders[id]().then(m => m.default).catch(error => { delete loading[id]; throw error })
}

/** Continuous, media-clock-driven sampling; no elapsed-time accumulation or random dancing. */
export function sampleMotion(clip: MotionClip, seconds: number, target: number[]): number[] {
  // [DANCE-SWAP] Closed-loop endpoint uses the identical boundary sample, avoiding roundoff from fractional end frames.
  const position = seconds >= clip.duration - 1 / clip.fps ? 0 : Math.max(0, Math.min(clip.frames.length - 1, seconds * clip.fps))
  const index = Math.floor(position), t = position - index, t2 = t * t, t3 = t2 * t
  const weights = [(1 - t) ** 3 / 6, (3 * t3 - 6 * t2 + 4) / 6, (-3 * t3 + 3 * t2 + 3 * t + 1) / 6, t3 / 6]
  for (let channel = 0; channel < 37; channel++) {
    let sum = 0
    for (let k = 0; k < 4; k++) sum += weights[k] * clip.frames[Math.max(0, Math.min(clip.frames.length - 1, index + k - 1))][channel]
    target[channel] = sum / clip.scale
  }
  for (const offset of [1, 5, 9]) {
    const length = Math.hypot(...target.slice(offset, offset + 4))
    if (length > 1e-8) for (let k = offset; k < offset + 4; k++) target[k] /= length
    else { target[offset] = 0; target[offset + 1] = 0; target[offset + 2] = 0; target[offset + 3] = 1 }
  }
  // [DANCE-SWAP] Preserve the numeric pose interface used by the unchanged scene/controller.
  samples.set(target, { clip, seconds })
  return target
}
