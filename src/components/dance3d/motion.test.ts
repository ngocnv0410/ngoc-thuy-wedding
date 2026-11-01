import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import bad from './badMotion.json'
import bang from './bangMotion.json'
import { createWeddingCharacter } from './character'
import { loadMotion3D, sampleMotion } from './motion'
import { shouldPreloadDance } from './preload'

for (const [name, clip] of [['BAD', bad], ['BANG BANG BANG', bang]] as const) describe(`${name} 3D rig`, () => {
  it('has a complete finite media-time track and continuous seeking', () => {
    expect(clip.frames.length / clip.fps).toBeCloseTo(clip.duration, 1)
    const target: number[] = []
    for (let i = 0; i < clip.frames.length; i += 3) {
      const pose = sampleMotion(clip, i / clip.fps, target)
      expect(pose).toHaveLength(37)
      for (const value of pose) expect(Number.isFinite(value)).toBe(true)
      for (const offset of [1, 5, 9]) expect(Math.hypot(...pose.slice(offset, offset + 4))).toBeGreaterThan(.9)
    }
    const seek = [...sampleMotion(clip, 8, target)]
    sampleMotion(clip, 20, target)
    expect(sampleMotion(clip, 8, target)).toEqual(seek)
    expect(sampleMotion(clip, -1, [])).toEqual(sampleMotion(clip, 0, []))
  })

  it('moves real bones in depth, keeps fixed limb lengths and supports the feet', () => {
    const actor = createWeddingCharacter(false), pose: number[] = []
    const left = new Vector3(), right = new Vector3(), wrist = new Vector3()
    const depths: number[] = []
    try {
      for (let time = 0; time < clip.duration; time += .25) {
        actor.apply(sampleMotion(clip, time, pose))
        actor.ankles[0].getWorldPosition(left); actor.ankles[1].getWorldPosition(right)
        expect(Math.min(left.y, right.y)).toBeCloseTo(.067, 5)
        expect(actor.limbs[1].position.length()).toBeCloseTo(.30, 7)
        expect(actor.ankles[0].position.length()).toBeCloseTo(.30, 7)
        actor.limbs[1].getWorldPosition(wrist); depths.push(wrist.z)
        for (const joint of [actor.pelvis, actor.spine, actor.head, ...actor.limbs]) expect(joint.quaternion.length()).toBeCloseTo(1, 5)
      }
      expect(Math.max(...depths) - Math.min(...depths)).toBeGreaterThan(.1)
      expect(actor.pelvis.isBone).toBe(true)
    } finally { actor.dispose() }
  })
})

it('shares each loaded animation between the opening and hero scenes', async () => {
  const first = loadMotion3D('ateez-bad')
  expect(loadMotion3D('ateez-bad')).toBe(first)
  expect(await first).toBe(bad)
  expect(await loadMotion3D('bang-bang-bang')).toBe(bang)
})
it('warms all animation data on normal networks while respecting data saving', () => {
  expect(shouldPreloadDance()).toBe(true)
  expect(shouldPreloadDance({ effectiveType: '4g' })).toBe(true)
  expect(shouldPreloadDance({ saveData: true })).toBe(false)
  expect(shouldPreloadDance({ effectiveType: '2g' })).toBe(false)
})
