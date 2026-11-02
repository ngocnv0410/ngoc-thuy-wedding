// [DANCE-SWAP] Deterministic smooth retarget tracks, sampled on the existing music clock.
import type { Bone } from 'three'

export interface BakedTrack { signature: string; bones: string[]; scale: number; frames: number[][] }
export interface BakedMotion { version: number; groom: BakedTrack; bride: BakedTrack }

// [DANCE-SWAP] Reject curves baked for different bone names or rest transforms.
export function rigSignature(bones: Map<string, Bone>): string {
  let hash = 2166136261
  const text = [...bones].map(([name, bone]) => [name, ...bone.position.toArray(), ...bone.quaternion.toArray()]
    .map(v => typeof v === 'number' ? v.toFixed(5) : v).join(',')).join(';')
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
  return (hash >>> 0).toString(16)
}

// [DANCE-SWAP] Match the public sampler's boundary rule; normalize signed quaternion interpolation.
export function applyBakedTrack(track: BakedTrack, bones: Map<string, Bone>, seconds: number, fps: number, duration: number): void {
  const position = seconds >= duration - 1 / fps ? 0 : Math.max(0, Math.min(track.frames.length - 1, seconds * fps))
  const frame = Math.floor(position), t = position - frame, t2 = t * t, t3 = t2 * t
  const weights = [(1 - t) ** 3 / 6, (3 * t3 - 6 * t2 + 4) / 6, (-3 * t3 + 3 * t2 + 3 * t + 1) / 6, t3 / 6]
  for (let b = 0; b < track.bones.length; b++) {
    const bone = bones.get(track.bones[b])!, offset = b * 5, reference = track.frames[frame]
    let x = 0, y = 0, z = 0, w = 0, scale = 0
    for (let k = 0; k < 4; k++) {
      const sample = track.frames[Math.max(0, Math.min(track.frames.length - 1, frame + k - 1))]
      const dot = sample[offset] * reference[offset] + sample[offset + 1] * reference[offset + 1]
        + sample[offset + 2] * reference[offset + 2] + sample[offset + 3] * reference[offset + 3]
      const weight = weights[k] * (dot < 0 ? -1 : 1)
      x += sample[offset] * weight; y += sample[offset + 1] * weight
      z += sample[offset + 2] * weight; w += sample[offset + 3] * weight
      scale += sample[offset + 4] * weights[k] / track.scale
    }
    bone.quaternion.set(x, y, z, w).normalize()
    bone.scale.y = scale
  }
}
