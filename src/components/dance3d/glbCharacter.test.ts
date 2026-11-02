// [DANCE-SWAP] Validate shipped GLBs, skin weights and the real source geometry after retargeting.
import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Group, Ray, SkinnedMesh, Sphere, Texture, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { createRiggedCharacter, GLB_BONE_MAP } from './glbCharacter'
import { sampleMotion } from './motion'
import bad from './badInPlaceMotion.json'
import bang from './bangSourceMotion.json'

// [DANCE-SWAP] Independent ray/sphere visibility check from the existing camera direction.
function hiddenFromViewer(point: Vector3, inverse: import('three').Matrix4, center: Vector3, radii: Vector3): boolean {
  const origin = point.clone().applyMatrix4(inverse).sub(center).divide(radii)
  const direction = new Vector3(0, 0, 1).transformDirection(inverse).divide(radii).normalize()
  const hit = new Ray(origin, direction).intersectSphere(new Sphere(new Vector3(), 1), new Vector3())
  return !!hit && hit.distanceTo(origin) > .01
}

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
      // [DANCE-SWAP] Hunyuan AI albedo and roughness use PBR with the existing scene lights.
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        expect(material.type).toBe('MeshStandardMaterial')
      }
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

  // [DANCE-SWAP] Measure every rendered half-frame, including the small IK branch jumps missed by sparse pose checks.
  for (const [dance, clip] of [['BAD', bad], ['BANG', bang]] as const) it(`${dance}: has continuous bone rotation and wrist acceleration at 60 Hz`, () => {
    const actor = createRiggedCharacter(templates[index], index === 1)
    expect(clip.retargeted[index === 1 ? 'bride' : 'groom'].signature).toBe(actor.group.userData.bakeSignature)
    const hands = ['handL', 'handR'].map(n => actor.group.getObjectByName(n)!)
    let previous: Vector3[] | undefined, velocity: Vector3[] | undefined
    let rotations: import('three').Quaternion[] | undefined
    let maxStep = 0, maxAcceleration = 0, maxAngle = 0, corrections = 0, hidden = 0
    const center = new Vector3().fromArray(actor.group.userData.armHeadBounds.center)
    const radii = new Vector3().fromArray(actor.group.userData.armHeadBounds.radii)
    try {
      for (let f = 0; f <= Math.ceil(clip.duration * 60); f++) {
        actor.apply(sampleMotion(clip, Math.min(f / 60, clip.duration), []))
        const positions = hands.map(hand => hand.getWorldPosition(new Vector3()))
        const inverse = actor.head.matrixWorld.clone().invert()
        for (const point of positions) if (hiddenFromViewer(point, inverse, center, radii)) hidden++
        if (previous) {
          const nextVelocity = positions.map((p, i) => p.clone().sub(previous![i]))
          maxStep = Math.max(maxStep, ...nextVelocity.map(v => v.length()))
          if (velocity) maxAcceleration = Math.max(maxAcceleration, ...nextVelocity.map((v, i) => v.clone().sub(velocity![i]).length()))
          velocity = nextVelocity
        }
        const current = [actor.pelvis, actor.spine, actor.head, ...actor.limbs].map(b => b.quaternion.clone())
        if (rotations) maxAngle = Math.max(maxAngle, ...current.map((q, i) => q.angleTo(rotations![i])))
        previous = positions; rotations = current; corrections += actor.group.userData.contactCorrections
      }
      expect(maxStep).toBeLessThan(.05)
      expect(maxAcceleration).toBeLessThan(.012)
      expect(maxAngle).toBeLessThan(.105)
      expect(corrections).toBe(0)
      expect(hidden).toBe(0)
      // Seeking and changing clips must not depend on the previously displayed frame or the render clock.
      const snapshot = () => [actor.pelvis.position.toArray(), ...actor.limbs.map(b => b.quaternion.toArray())]
      actor.apply(sampleMotion(clip, 6.125, [])); const expected = snapshot()
      actor.apply(sampleMotion(index ? bad : bang, 18, []))
      actor.apply(sampleMotion(clip, 6.125, [])); expect(snapshot()).toEqual(expected)
    } finally { actor.dispose() }
  }, 60000)

  // [DANCE-SWAP] Cover the previously missed failures: hidden wrists, torn palms and chest flaps.
  it('keeps reachable wrists in front of the head and distal palms rigid through both dances', () => {
    const actor = createRiggedCharacter(templates[index], index === 1)
    const center = new Vector3().fromArray(actor.group.userData.armHeadBounds.center)
    const radii = new Vector3().fromArray(actor.group.userData.armHeadBounds.radii)
    const point = new Vector3(), shoulder = new Vector3(), elbow = new Vector3()
    const hands = ['handL', 'handR'].map(n => actor.group.getObjectByName(n)!)
    const palm: { mesh: SkinnedMesh; vertex: number; side: number; rest: Vector3 }[] = []
    actor.group.traverse(node => {
      if (!(node instanceof SkinnedMesh)) return
      const p = node.geometry.getAttribute('position')
      for (let i = 0; i < p.count; i++) {
        point.fromBufferAttribute(p, i).applyMatrix4(node.matrixWorld)
        const low = index === 1 ? .51 : .415, high = index === 1 ? .58 : .475
        if (Math.abs(point.x) > .35 && point.y > low && point.y < high && point.z > .025) {
          const side = point.x < 0 ? 0 : 1
          palm.push({ mesh: node, vertex: i, side, rest: point.clone().applyMatrix4(hands[side].matrixWorld.clone().invert()) })
        }
      }
    })
    expect(palm.length).toBeGreaterThan(10)
    const lengths = [0, 2].map(i => {
      actor.limbs[i].getWorldPosition(shoulder); actor.limbs[i + 1].getWorldPosition(elbow)
      hands[i / 2].getWorldPosition(point)
      return [shoulder.distanceTo(elbow), elbow.distanceTo(point)]
    })
    let hidden = 0, hiddenPalm = 0, maximumPalmError = 0
    const actualHeadRadii = radii.clone().subScalar(actor.group.userData.armHeadBounds.padding)
    try {
      for (const clip of [bad, bang]) for (let time = 0; time < clip.duration; time += .5) {
        actor.apply(sampleMotion(clip, time, []))
        const inverseHead = actor.head.matrixWorld.clone().invert()
        for (let side = 0; side < 2; side++) {
          hands[side].getWorldPosition(point); actor.limbs[side * 2].getWorldPosition(shoulder)
          actor.limbs[side * 2 + 1].getWorldPosition(elbow)
          expect(shoulder.distanceTo(elbow)).toBeCloseTo(lengths[side][0], 5)
          expect(elbow.distanceTo(point)).toBeCloseTo(lengths[side][1], 5)
          if (hiddenFromViewer(point, inverseHead, center, radii)) hidden++
        }
        const inverseHands = hands.map(hand => hand.matrixWorld.clone().invert())
        for (const v of palm) {
          v.mesh.getVertexPosition(v.vertex, point).applyMatrix4(v.mesh.matrixWorld)
          if (hiddenFromViewer(point, inverseHead, center, actualHeadRadii)) hiddenPalm++
          point.applyMatrix4(inverseHands[v.side])
          maximumPalmError = Math.max(maximumPalmError, point.distanceTo(v.rest))
        }
      }
      expect(hidden).toBe(0)
      expect(hiddenPalm).toBe(0)
      expect(maximumPalmError).toBeLessThan(.005)
    } finally { actor.dispose() }
  }, 60000)

  it('does not pull the middle of the jacket or bodice when only the arms move', () => {
    const actor = createRiggedCharacter(templates[index], index === 1), point = new Vector3()
    const base = sampleMotion(bad, 0, []).slice(), selected: { mesh: SkinnedMesh; vertex: number; rest: Vector3 }[] = []
    actor.apply(base)
    actor.group.traverse(node => {
      if (!(node instanceof SkinnedMesh)) return
      const p = node.geometry.getAttribute('position')
      for (let i = 0; i < p.count; i++) {
        point.fromBufferAttribute(p, i)
        if (Math.abs(point.x) < (index === 1 ? .105 : .13) && point.y > .61 && point.y < .73) {
          node.getVertexPosition(i, point).applyMatrix4(node.matrixWorld)
          selected.push({ mesh: node, vertex: i, rest: point.clone() })
        }
      }
    })
    let maximum = 0
    try {
      for (const clip of [bad, bang]) for (const time of [4, 8, 12, 16, 20, 24]) {
        const pose = base.slice(), arms = sampleMotion(clip, time, [])
        for (let k = 13; k < 25; k++) pose[k] = arms[k]
        actor.apply(pose)
        for (const v of selected) {
          v.mesh.getVertexPosition(v.vertex, point).applyMatrix4(v.mesh.matrixWorld)
          maximum = Math.max(maximum, point.distanceTo(v.rest))
        }
      }
      expect(selected.length).toBeGreaterThan(100)
      expect(maximum).toBeLessThan(.0001)
    } finally { actor.dispose() }
  })

  // [DANCE-SWAP] Source changes include low hand sweeps: sample forearms as well as wrists against the gown.
  if (index === 1) it('keeps wrists and forearms outside the animated gown envelope', () => {
    const actor = createRiggedCharacter(templates[index], true), wrist = new Vector3(), elbow = new Vector3(), point = new Vector3()
    let penetrations = 0
    try {
      for (const clip of [bad, bang]) for (let t = 0; t < clip.duration; t += .25) {
        actor.apply(sampleMotion(clip, t, []))
        const e = actor.group.userData.gownEnvelope
        expect(e).toBeDefined()
        for (const [i, name] of [[1, 'handL'], [3, 'handR']] as const) {
          actor.limbs[i].getWorldPosition(elbow); actor.group.getObjectByName(name)!.getWorldPosition(wrist)
          for (const blend of [.25, .5, .75, 1]) {
            point.lerpVectors(elbow, wrist, blend)
            if (point.y <= e.minY || point.y >= e.maxY) continue
            const height = (point.y - e.minY) / (e.maxY - e.minY), shape = .30 + .70 * (1 - height) ** .9
            const radius = ((point.x - e.x) / (e.rx * shape)) ** 2 + ((point.z - e.z) / (e.rz * shape)) ** 2
            if (radius < .98) penetrations++
          }
        }
      }
      expect(penetrations).toBe(0)
    } finally { actor.dispose() }
  }, 60000)

  // [DANCE-SWAP] Safety must hold between poses too, not only at the two transition endpoints.
  it('keeps wrists visible throughout a mode transition', () => {
    const clock = vi.spyOn(performance, 'now').mockReturnValue(1000)
    const actor = createRiggedCharacter(templates[index], index === 1), point = new Vector3()
    const center = new Vector3().fromArray(actor.group.userData.armHeadBounds.center)
    const radii = new Vector3().fromArray(actor.group.userData.armHeadBounds.radii)
    const hands = ['handL', 'handR'].map(n => actor.group.getObjectByName(n)!)
    let hidden = 0
    try {
      actor.apply(sampleMotion(bad, 8, [])); actor.transition()
      for (let step = 0; step <= 10; step++) {
        clock.mockReturnValue(1000 + step * 30); actor.apply(sampleMotion(bang, 5.733333, []))
        const inverse = actor.head.matrixWorld.clone().invert()
        for (const hand of hands) {
          hand.getWorldPosition(point)
          if (hiddenFromViewer(point, inverse, center, radii)) hidden++
        }
      }
      expect(hidden).toBe(0)
    } finally { clock.mockRestore(); actor.dispose() }
  })

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
