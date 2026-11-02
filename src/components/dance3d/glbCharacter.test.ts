// [DANCE-SWAP] Validate shipped GLBs, skin weights and the real source geometry after retargeting.
import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Group, SkinnedMesh, Texture, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { createRiggedCharacter, GLB_BONE_MAP } from './glbCharacter'
import { sampleMotion } from './motion'
import bad from './badInPlaceMotion.json'
import bang from './bangSourceMotion.json'

const templates: Group[] = []
beforeAll(async () => {
  for (const name of ['groom', 'bride']) {
    const bytes = readFileSync(`public/models/wedding/${name}-rigged.glb`)
    const loader = new GLTFLoader()
    // Node has no image decoder; only substitute texture decoding, retain actual mesh/skeleton parsing.
    loader.register(() => ({ name: 'EXT_texture_webp', loadTexture: async () => new Texture() }))
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
    templates.push((await loader.parseAsync(buffer, '')).scene)
  }
})

for (const [index, name] of ['groom', 'bride'].entries()) describe(`${name} Drive GLB`, () => {
  it('contains weighted source geometry, UVs and the required skeleton', () => {
    let vertices = 0, triangles = 0
    templates[index].traverse(node => {
      if (!(node instanceof SkinnedMesh)) return
      const geometry = node.geometry, weights = geometry.getAttribute('skinWeight')
      vertices += weights.count; triangles += (geometry.index?.count ?? weights.count) / 3
      expect(geometry.getAttribute('uv')).toBeDefined()
      for (let i = 0; i < weights.count; i++) {
        const values = [weights.getX(i), weights.getY(i), weights.getZ(i), weights.getW(i)]
        expect(values.every(v => v >= 0 && Number.isFinite(v))).toBe(true)
        expect(values.reduce((a, b) => a + b)).toBeCloseTo(1, 5)
      }
    })
    expect(templates[index].getObjectByName(`${name}-source-surface`)!.userData.source_sha256).toMatch(/^[a-f0-9]{64}$/)
    expect(vertices).toBeGreaterThan(10000)
    expect(triangles).toBeLessThanOrEqual(36000)
    const actor = createRiggedCharacter(templates[index], index === 1)
    try {
      expect(actor.group.userData.boneMapping.unmatched).toEqual([])
      for (const bone of GLB_BONE_MAP.limbs) expect(actor.group.getObjectByName(bone)).toBeDefined()
    } finally { actor.dispose() }
  })

  for (const [dance, clip] of [['BAD', bad], ['BANG', bang]] as const) it(`${dance}: remains finite, grounded and in place for ten loops`, () => {
    const actor = createRiggedCharacter(templates[index], index === 1)
    const rest = actor.pelvis.position.clone(), point = new Vector3(), positions: number[] = []
    const meshes: SkinnedMesh[] = []
    actor.group.traverse(node => { if (node instanceof SkinnedMesh) meshes.push(node) })
    try {
      for (let loop = 0; loop < 10; loop++) for (let i = 0; i <= clip.frames.length; i += 10) {
        actor.apply(sampleMotion(clip, Math.min(i / clip.fps, clip.duration), []))
        expect(actor.pelvis.position.x).toBe(rest.x)
        expect(actor.pelvis.position.z).toBe(rest.z)
        for (const bone of [actor.pelvis, actor.spine, actor.head, ...actor.limbs]) {
          expect(bone.quaternion.toArray().every(Number.isFinite)).toBe(true)
          expect(bone.quaternion.length()).toBeCloseTo(1, 5)
        }
        if (loop === 0 && i % 120 === 0) {
          let minimum = Infinity
          for (const mesh of meshes) for (let v = 0; v < mesh.geometry.getAttribute('position').count; v++) {
            mesh.getVertexPosition(v, point).applyMatrix4(mesh.matrixWorld)
            expect([point.x, point.y, point.z].every(Number.isFinite)).toBe(true)
            minimum = Math.min(minimum, point.y)
          }
          expect(minimum).toBeCloseTo(0, 3)
          actor.limbs[1].getWorldPosition(point); positions.push(point.z)
        }
      }
      expect(Math.max(...positions) - Math.min(...positions)).toBeGreaterThan(.03)
      actor.apply(sampleMotion(clip, 0, []))
      const first = actor.limbs.map(b => b.getWorldPosition(new Vector3()).toArray())
      actor.apply(sampleMotion(clip, clip.duration, []))
      expect(actor.limbs.map(b => b.getWorldPosition(new Vector3()).toArray())).toEqual(first)
    } finally { actor.dispose() }
  }, 60000)

  // [DANCE-SWAP] A mode/resume crossfade starts at the held pose and reaches the new pose at .3 s.
  it('crossfades without a first-frame jump and reaches the target pose', () => {
    const clock = vi.spyOn(performance, 'now').mockReturnValue(1000)
    const actor = createRiggedCharacter(templates[index], index === 1)
    try {
      actor.apply(sampleMotion(bad, 4, []))
      const held = actor.spine.quaternion.toArray()
      actor.apply(sampleMotion(bang, 12, []))
      const target = actor.spine.quaternion.toArray()
      actor.apply(sampleMotion(bad, 4, [])); actor.transition()
      actor.apply(sampleMotion(bang, 12, []))
      expect(actor.spine.quaternion.toArray()).toEqual(held)
      clock.mockReturnValue(1150); actor.apply(sampleMotion(bang, 12, []))
      expect(actor.spine.quaternion.toArray()).not.toEqual(held)
      clock.mockReturnValue(1300); actor.apply(sampleMotion(bang, 12, []))
      for (let i = 0; i < 4; i++) expect(actor.spine.quaternion.toArray()[i]).toBeCloseTo(target[i], 10)
    } finally { clock.mockRestore(); actor.dispose() }
  })

  it('clones an independent skeleton without duplicating immutable mesh buffers', () => {
    const a = createRiggedCharacter(templates[index], index === 1)
    const b = createRiggedCharacter(templates[index], index === 1)
    try {
      a.apply(sampleMotion(bad, 4, [])); b.apply(sampleMotion(bang, 12, []))
      expect(a.pelvis).not.toBe(b.pelvis)
      const qa = a.spine.quaternion.clone()
      b.apply(sampleMotion(bad, 20, []))
      expect(a.spine.quaternion.toArray()).toEqual(qa.toArray())
      a.dispose()
      expect(() => b.apply(sampleMotion(bad, 8, []))).not.toThrow()
    } finally { a.dispose(); b.dispose() }
  })
})
