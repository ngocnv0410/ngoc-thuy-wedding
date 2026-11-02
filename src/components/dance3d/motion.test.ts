import { describe, expect, it } from 'vitest'
import { Box3, Euler, Quaternion, Texture, Vector3 } from 'three'
// [DANCE-SWAP] Verify the actual replacement tracks selected by loadMotion3D.
import bad from './badInPlaceMotion.json'
import bang from './bangSourceMotion.json'
import { CHIBI_BONES, approvedHeadGeometry, createWeddingCharacter } from './character'
import { loadMotion3D, sampleMotion } from './motion'
import { shouldPreloadDance } from './preload'

// [DANCE-SWAP] Exercise every 30-fps pose for ten complete loops, including each media-clock reset.
for (const [name, clip] of [['BAD', bad], ['BANG BANG BANG', bang]] as const) it(`${name} stays in place and joins smoothly for ten loops`, () => {
  const texture = new Texture(), art = { groom: texture, bride: texture }
  const actors = [createWeddingCharacter(false, art), createWeddingCharacter(true, art)]
  const foot = new Vector3(), otherFoot = new Vector3(), pose: number[] = []
  const start = sampleMotion(clip, 0, []), end = sampleMotion(clip, clip.duration, [])
  expect(end).toEqual(start)
  for (const time of [.001, clip.duration - .001]) {
    const near = sampleMotion(clip, time, [])
    for (let i = 0; i < start.length; i++) expect(near[i]).toBeCloseTo(start[i], 12)
  }
  try {
    for (let loop = 0; loop < 10; loop++) for (let frame = 0; frame < clip.frames.length; frame++) {
      sampleMotion(clip, frame / clip.fps, pose)
      expect(pose.every(Number.isFinite)).toBe(true)
      for (const actor of actors) {
        actor.apply(pose)
        expect(actor.pelvis.position.x).toBe(0)
        expect(actor.pelvis.position.z).toBe(0)
        actor.ankles[0].getWorldPosition(foot); actor.ankles[1].getWorldPosition(otherFoot)
        expect(Math.min(foot.y, otherFoot.y)).toBeCloseTo(.067, 5)
      }
    }
    const names = new Set<string>()
    actors[0].group.traverse(node => { if (node.type === 'Bone') names.add(node.name) })
    const unmatched = Object.values(clip.boneMap).filter(name => !names.has(name))
    console.info(`[DANCE-SWAP] ${name}: ${Object.keys(clip.boneMap).length} mapped bones; unmatched: ${unmatched.join(', ') || 'none'}`)
    expect(unmatched).toEqual([])
  } finally { actors.forEach(actor => actor.dispose()); texture.dispose() }
}, 20000)

// [DANCE-SWAP] The replacement must retain exact audio timestamps and the untouched BAD interior.
it('keeps the original duration, speed and BAD poses outside the loop blend', async () => {
  const original = (await import('./badMotion.json')).default
  expect(bad.duration).toBe(original.duration)
  expect(bang.duration).toBe(28.444444)
  expect(bang.bpm).toBe(135)
  expect(bang.playbackRate).toBe(1)
  expect(bang.sourceTimeScale).toBe(1.333821)
  for (let i = 19; i < bad.frames.length - 19; i++) expect(bad.frames[i].slice(1)).toEqual(original.frames[i].slice(1))
})

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

it('uses the approved portrait on rounded heads and bright full-length clothing', () => {
  const groomTexture = new Texture(), brideTexture = new Texture()
  const art = { groom: groomTexture, bride: brideTexture }
  const actor = createWeddingCharacter(false, art), bride = createWeddingCharacter(true, art)
  try {
    actor.group.updateMatrixWorld(true)
    const head = actor.head.getObjectByName('approved-portrait-head') as import('three').Mesh
    const jacket = actor.spine.getObjectByName('approved-taupe-jacket')!
    const size = new Box3().setFromObject(head).getSize(new Vector3())
    const body = new Box3().setFromObject(jacket).getSize(new Vector3())
    expect(size.x / body.x).toBeGreaterThan(1.8)
    expect(size.z).toBeGreaterThan(.15)
    expect((head.material as import('three').MeshBasicMaterial[])[0].map).toBe(groomTexture)
    expect(bride.head.getObjectByName('low-nape-bun')).toBeDefined()
    expect(bride.group.getObjectByName('approved-white-gown')).toBeDefined()
    expect(bride.group.getObjectByName('approved-white-veil')).toBeDefined()
  } finally { actor.dispose(); bride.dispose(); groomTexture.dispose(); brideTexture.dispose() }
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

it('closes both head surfaces and preserves gentle head angles through deep bows', () => {
  for (const bride of [false, true]) {
    const geometry = approvedHeadGeometry(bride)
    expect(geometry.groups.map(group => group.materialIndex)).toEqual([0, 1])
    const p = geometry.getAttribute('position'), uv = geometry.getAttribute('uv')
    for (let row = 0; row < 81; row++) {
      const first = row * 65, last = first + 64
      expect(p.getX(first)).toBeCloseTo(p.getX(last), 6)
      expect(p.getZ(first)).toBeCloseTo(p.getZ(last), 6)
    }
    for (let i = 0; i < p.count; i++) {
      expect([p.getX(i), p.getY(i), p.getZ(i)].every(Number.isFinite)).toBe(true)
      expect(uv.getX(i)).toBeGreaterThanOrEqual(0)
      expect(uv.getX(i)).toBeLessThanOrEqual(1)
    }
    geometry.dispose()
  }
  const actor = createWeddingCharacter(false), world = new Quaternion(), angle = new Euler(0, 0, 0, 'YXZ')
  try {
    for (const clip of [bad, bang]) for (let t = 0; t < clip.duration; t += .25) {
      actor.apply(sampleMotion(clip, t, [])); actor.head.getWorldQuaternion(world); angle.setFromQuaternion(world, 'YXZ')
      expect(Math.abs(angle.x)).toBeLessThanOrEqual(.301)
      expect(Math.abs(angle.y)).toBeLessThanOrEqual(.301)
    }
  } finally { actor.dispose() }
})
