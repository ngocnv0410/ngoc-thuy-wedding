import { describe, expect, it } from 'vitest'
import { Box3, Quaternion, ShapeGeometry, Vector3 } from 'three'
import { GROOM } from '../chibi/chibiArt'
import { chibiShapes } from './svgShapes'
import bad from './badMotion.json'
import bang from './bangMotion.json'
import { CHIBI_BONES, createWeddingCharacter } from './character'
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
        expect(actor.limbs[1].position.length()).toBeCloseTo(CHIBI_BONES.upperArm, 7)
        expect(actor.ankles[0].position.length()).toBeCloseTo(CHIBI_BONES.shin, 7)
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

it('retains the original large-head chibi silhouette and recognizable art details', () => {
  const actor = createWeddingCharacter(false), bride = createWeddingCharacter(true)
  try {
    actor.group.updateMatrixWorld(true)
    const face = actor.head.getObjectByName('original-chibi-face')!
    const jacket = actor.spine.getObjectByName('original-groom-jacket')!
    const headSize = new Box3().setFromObject(face).getSize(new Vector3())
    const jacketSize = new Box3().setFromObject(jacket).getSize(new Vector3())
    expect(headSize.x / jacketSize.x).toBeGreaterThan(1.8)
    expect(headSize.y).toBeGreaterThan(jacketSize.y * 1.3)
    expect(actor.head.getObjectByName('original-groom-tuft')).toBeDefined()
    expect(bride.head.getObjectByName('low-nape-bun')).toBeDefined()
    expect(bride.group.getObjectByName('full-length-bridal-skirt')).toBeDefined()
  } finally { actor.dispose(); bride.dispose() }
})
it('removes estimator-driven full-turn snaps from the complete BAD animation', () => {
  const target: number[] = [], previous: number[] = []
  const a = new Quaternion(), b = new Quaternion(), u = new Vector3(), v = new Vector3()
  for (let i = 0; i < bad.frames.length; i++) {
    sampleMotion(bad, i / bad.fps, target)
    if (i) {
      for (const [j, off] of [1, 5, 9].entries()) {
        a.fromArray(previous, off).normalize(); b.fromArray(target, off).normalize()
        expect(a.angleTo(b) * 180 / Math.PI).toBeLessThan(bad.rotationLimitsDegrees[j] + .3)
      }
      for (let j = 0; j < 8; j++) {
        u.fromArray(previous, 13 + j * 3).normalize(); v.fromArray(target, 13 + j * 3).normalize()
        expect(u.angleTo(v) * 180 / Math.PI).toBeLessThan(bad.rotationLimitsDegrees[j + 3] + .3)
      }
    }
    previous.splice(0, previous.length, ...target)
  }
})

it('keeps the original groom hair silhouette when adding rounded 3D depth', () => {
  const actor = createWeddingCharacter(false)
  const original = new ShapeGeometry(chibiShapes(GROOM.hair, 60, 106))
  try {
    original.computeBoundingBox()
    const hair = actor.head.getObjectByName('original-chibi-hair') as import('three').Mesh
    hair.geometry.computeBoundingBox()
    for (const axis of ['x', 'y'] as const) {
      expect(Math.abs(hair.geometry.boundingBox!.min[axis] - original.boundingBox!.min[axis])).toBeLessThan(.02)
      expect(Math.abs(hair.geometry.boundingBox!.max[axis] - original.boundingBox!.max[axis])).toBeLessThan(.02)
    }
  } finally { original.dispose(); actor.dispose() }
})
