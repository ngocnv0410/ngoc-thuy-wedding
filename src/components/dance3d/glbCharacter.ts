// [DANCE-SWAP] Adapter for the owner's colored/skinned Drive GLBs. The legacy rig remains available.
import { Bone, Box3, Euler, Group, MathUtils, Quaternion, SkinnedMesh, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import type { WeddingCharacter } from './character'
// [DANCE-SWAP] Preserve source gestures within the unchanged chibi arm reach and head silhouette.
import { fitWristInFrontOfHead } from './armReach'

// [DANCE-SWAP] Keep async asset loading outside the synchronous scene/actor interface.
let prepared: Group[] | undefined
let loading: Promise<void> | undefined
export function preloadRiggedCharacters(): Promise<void> {
  return loading ??= Promise.all(['groom', 'bride'].map(name => new GLTFLoader()
    .loadAsync(`${import.meta.env.BASE_URL}models/wedding/${name}-rigged.glb`)
    .then(gltf => {
      // [DANCE-SWAP] Four-view photographs already contain shading; preserve their sRGB colors.
      gltf.scene.traverse(node => {
        if (node instanceof SkinnedMesh) for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
          if (material.type === 'MeshBasicMaterial') material.toneMapped = false
        }
      })
      return gltf.scene
    })))
    .then(models => { prepared = models })
    .catch(error => { loading = undefined; throw error })
}

// [DANCE-SWAP] Explicit motion channel -> actual exported bone mapping, with bind-pose correction.
export const GLB_BONE_MAP = {
  pelvis: 'pelvis', spine: 'spine', head: 'head',
  limbs: ['upperArmL', 'forearmL', 'upperArmR', 'forearmR', 'thighL', 'shinL', 'thighR', 'shinR'],
  ankles: ['ankleL', 'ankleR'],
} as const

export function createWeddingCharacter(bride: boolean): WeddingCharacter & { transition: () => void } {
  if (!prepared) throw Error('[DANCE-SWAP] Rigged GLB assets are not ready')
  return createRiggedCharacter(prepared[bride ? 1 : 0], bride)
}

// [DANCE-SWAP] Clone skeletons per actor; cached geometry/materials remain shared and immutable.
export function createRiggedCharacter(template: Group, bride: boolean): WeddingCharacter & { transition: () => void } {
  const group = new Group()
  group.name = bride ? 'bride-3d' : 'groom-3d'
  group.userData.source = bride ? 'bride.glb' : 'gloom.glb'
  const model = clone(template) as Group
  group.add(model)
  const bones = new Map<string, Bone>(), meshes: SkinnedMesh[] = []
  model.traverse(node => {
    if (node instanceof Bone) bones.set(node.name, node)
    if (node instanceof SkinnedMesh) {
      // Grounding/crouching changes the source mesh bounds; avoid stale bind-pose culling.
      node.frustumCulled = false
      meshes.push(node)
    }
  })
  const required = ['pelvis', 'spine', 'neck', 'head', ...GLB_BONE_MAP.limbs, ...GLB_BONE_MAP.ankles,
    ...(bride ? ['skirtFront', 'skirtBack', 'skirtL', 'skirtR', 'veil'] : [])]
  const missing = required.filter(name => !bones.has(name))
  if (missing.length) {
    console.error('[DANCE-SWAP] Unmatched GLB bones:', missing)
    throw Error(`[DANCE-SWAP] Missing bones: ${missing.join(', ')}`)
  }
  group.userData.boneMapping = { matched: required, unmatched: missing }
  const pelvis = bones.get('pelvis')!, spine = bones.get('spine')!, head = bones.get('head')!
  const limbs = GLB_BONE_MAP.limbs.map(name => bones.get(name)!)
  const ankles = GLB_BONE_MAP.ankles.map(name => bones.get(name)!)
  const skirts = ['skirtFront', 'skirtBack', 'skirtL', 'skirtR'].map(name => bones.get(name)).filter((b): b is Bone => !!b)
  const veil = bones.get('veil')
  group.updateMatrixWorld(true)
  const bindWorld = new Map<Bone, Quaternion>()
  for (const bone of bones.values()) bindWorld.set(bone, bone.getWorldQuaternion(new Quaternion()))
  const start = new Vector3(), end = new Vector3()
  const limbEnds = ['forearmL', 'handL', 'forearmR', 'handR', 'shinL', 'ankleL', 'shinR', 'ankleR']
  const restDirections = limbs.map((bone, i) => {
    bone.getWorldPosition(start); bones.get(limbEnds[i])!.getWorldPosition(end)
    return end.clone().sub(start).normalize()
  })
  // [DANCE-SWAP] Measure the actual rigid head in bind space, including the lower cheek/chin.
  const headBounds = new Box3(), headBindInverse = head.matrixWorld.clone().invert()
  for (const mesh of meshes) {
    const positions = mesh.geometry.getAttribute('position'), weights = mesh.geometry.getAttribute('skinWeight')
    const indices = mesh.geometry.getAttribute('skinIndex'), index = mesh.skeleton.bones.indexOf(head)
    for (let i = 0; i < positions.count; i++) for (let k = 0; k < 4; k++) {
      if (indices.getComponent(i, k) === index && weights.getComponent(i, k) > .9) {
        start.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).applyMatrix4(headBindInverse)
        headBounds.expandByPoint(start); break
      }
    }
  }
  const headCenter = headBounds.getCenter(new Vector3())
  // [DANCE-SWAP] Include the full rigid hand, not only the wrist/palm center, in the keep-out margin.
  const handPadding = bride ? .10 : .12
  const headRadii = headBounds.getSize(new Vector3()).multiplyScalar(.5).addScalar(handPadding)
  group.userData.armHeadBounds = { center: headCenter.toArray(), radii: headRadii.toArray(), padding: handPadding }
  const headInverse = head.matrixWorld.clone(), armDirections = Array.from({ length: 4 }, () => new Vector3())
  const shoulder = new Vector3(), elbow = new Vector3(), wrist = new Vector3(), axis = new Vector3(), pole = new Vector3()
  const armLengths = [0, 1, 2, 3].map(i => {
    limbs[i].getWorldPosition(start); bones.get(limbEnds[i])!.getWorldPosition(end)
    return start.distanceTo(end)
  })
  const restPelvis = pelvis.position.clone(), restHeight = pelvis.getWorldPosition(new Vector3()).y
  const restPositions = new Map([...bones.values()].map(b => [b, b.position.clone()]))
  const support: { mesh: SkinnedMesh; indices: number[] }[] = []
  // [DANCE-SWAP] Measure the actual deformed shoe soles/gown hem, rather than an ankle proxy.
  for (const mesh of meshes) {
    mesh.geometry.computeBoundingBox()
    const position = mesh.geometry.getAttribute('position')
    const floor = mesh.geometry.boundingBox!.min.y
    const indices: number[] = []
    for (let i = 0; i < position.count; i++) if (position.getY(i) <= floor + .025) indices.push(i)
    support.push({ mesh, indices })
  }
  // [DANCE-SWAP] Transport forearm roll with the upper arm before bending the elbow.
  const armQ = new Quaternion(), inherited = new Vector3()
  // [DANCE-SWAP] Sample actual skinned skirt surfaces, excluding the veil and upper torso.
  const gownSamples: { mesh: SkinnedMesh; indices: number[] }[] = []
  if (bride) for (const mesh of meshes) {
    const p = mesh.geometry.getAttribute('position'), w = mesh.geometry.getAttribute('skinWeight'), ids = mesh.geometry.getAttribute('skinIndex')
    const candidates: number[] = []
    for (let i = 0; i < p.count; i++) {
      let skirtWeight = 0
      for (let k = 0; k < 4; k++) if (mesh.skeleton.bones[ids.getComponent(i, k)]?.name.startsWith('skirt')) skirtWeight += w.getComponent(i, k)
      if (p.getY(i) < restHeight + .10 && skirtWeight > .6) candidates.push(i)
    }
    gownSamples.push({ mesh, indices: candidates.filter((_, i) => i % Math.max(1, Math.ceil(candidates.length / 192)) === 0) })
  }
  const gownBounds = new Box3(), gownPoint = new Vector3(), clavicleQ = new Quaternion()
  const clavicles = ['clavicleL', 'clavicleR'].map(n => bones.get(n)!)
  const parentQ = new Quaternion(), targetQ = new Quaternion(), delta = new Quaternion()
  const direction = new Vector3(), foot = new Vector3(), euler = new Euler(0, 0, 0, 'YXZ')
  const up = new Vector3(0, 1, 0)
  // [DANCE-SWAP] Blend from the currently displayed pose on playback/mode transitions.
  let fading: { bone: Bone; rotation: Quaternion; scale: Vector3 }[] | undefined
  let fadeStarted = 0
  const transition = () => {
    fading = [...bones.values()].map(bone => ({ bone, rotation: bone.quaternion.clone(), scale: bone.scale.clone() }))
    fadeStarted = performance.now()
  }
  const orient = (bone: Bone, world: Quaternion) => {
    bone.parent!.getWorldQuaternion(parentQ)
    bone.quaternion.copy(parentQ.invert().multiply(world)).normalize()
    bone.updateWorldMatrix(false, true)
  }
  const update = () => {
    group.updateMatrixWorld(true)
    for (const mesh of meshes) mesh.skeleton.update()
  }
  const apply = (pose: number[]) => {
    // [DANCE-SWAP] Reset transforms every sample: pause/seek/loop cannot accumulate root travel.
    for (const [bone, position] of restPositions) { bone.position.copy(position); bone.scale.set(1, 1, 1) }
    pelvis.position.copy(restPelvis)
    group.updateMatrixWorld(true)
    orient(pelvis, targetQ.fromArray(pose, 1).normalize().multiply(bindWorld.get(pelvis)!))
    orient(spine, targetQ.fromArray(pose, 5).normalize().multiply(bindWorld.get(spine)!))
    euler.setFromQuaternion(targetQ.fromArray(pose, 9).normalize(), 'YXZ')
    // [DANCE-SWAP] Preserve observed head turns, but reject estimator roll flips.
    euler.x = MathUtils.clamp(euler.x, -.5, .5)
    euler.y = MathUtils.clamp(euler.y, -1.25, 1.25)
    euler.z = MathUtils.clamp(euler.z, -.6, .6)
    orient(head, targetQ.setFromEuler(euler).multiply(bindWorld.get(head)!))
    // [DANCE-SWAP] Scapular elevation shares the raise with the shoulder instead of stretching one armpit pivot.
    for (let side = 0; side < 2; side++) {
      const elevation = Math.max(0, Math.asin(MathUtils.clamp(pose[14 + side * 6], -1, 1)) + .15) * .30
      spine.getWorldQuaternion(clavicleQ)
      clavicleQ.multiply(targetQ.copy(bindWorld.get(spine)!).invert()).multiply(bindWorld.get(clavicles[side])!)
      delta.setFromAxisAngle(new Vector3(0, 0, 1), (side === 0 ? -1 : 1) * elevation)
      orient(clavicles[side], targetQ.copy(delta).multiply(clavicleQ))
    }
    // [DANCE-SWAP] Retarget the two arm chains to reachable, visible wrists before rotating the bones.
    headInverse.copy(head.matrixWorld).invert()
    for (const i of [0, 2]) {
      armDirections[i].fromArray(pose, 13 + i * 3).normalize()
      armDirections[i + 1].fromArray(pose, 16 + i * 3).normalize()
      limbs[i].getWorldPosition(shoulder)
      elbow.copy(shoulder).addScaledVector(armDirections[i], armLengths[i])
      wrist.copy(elbow).addScaledVector(armDirections[i + 1], armLengths[i + 1])
      const minimum = Math.abs(armLengths[i] - armLengths[i + 1]) + .0001
      const maximum = armLengths[i] + armLengths[i + 1] - .0001
      if (fitWristInFrontOfHead(shoulder, wrist, minimum, maximum, head.matrixWorld, headInverse, headCenter, headRadii, wrist)) {
        axis.copy(wrist).sub(shoulder)
        const distance = MathUtils.clamp(axis.length(), minimum, maximum)
        axis.normalize()
        pole.copy(elbow).sub(shoulder)
        pole.addScaledVector(axis, -pole.dot(axis))
        if (pole.lengthSq() < 1e-8) pole.set(i === 0 ? -1 : 1, 0, 0).addScaledVector(axis, -axis.x * (i === 0 ? -1 : 1))
        pole.normalize()
        const along = (armLengths[i] ** 2 - armLengths[i + 1] ** 2 + distance ** 2) / (2 * distance)
        const height = Math.sqrt(Math.max(0, armLengths[i] ** 2 - along ** 2))
        elbow.copy(shoulder).addScaledVector(axis, along).addScaledVector(pole, height)
        armDirections[i].copy(elbow).sub(shoulder).normalize()
        armDirections[i + 1].copy(wrist).sub(elbow).normalize()
      }
    }
    for (let i = 0; i < limbs.length; i++) {
      if (i < 4) direction.copy(armDirections[i])
      else direction.fromArray(pose, 13 + i * 3).normalize()
      // [DANCE-SWAP] Independent world-space swings counter-twisted the two sides of the elbow.
      if (i === 1 || i === 3) {
        limbs[i - 1].getWorldQuaternion(armQ)
        armQ.multiply(targetQ.copy(bindWorld.get(limbs[i - 1])!).invert())
        inherited.copy(restDirections[i]).applyQuaternion(armQ).normalize()
        delta.setFromUnitVectors(inherited, direction)
        orient(limbs[i], targetQ.copy(delta).multiply(armQ).multiply(bindWorld.get(limbs[i])!))
      } else {
        delta.setFromUnitVectors(restDirections[i], direction)
        orient(limbs[i], targetQ.copy(delta).multiply(bindWorld.get(limbs[i])!))
      }
    }
    for (const ankle of ankles) orient(ankle, bindWorld.get(ankle)!)
    update()
    let lowestAnkle = Infinity
    for (const ankle of ankles) { ankle.getWorldPosition(foot); lowestAnkle = Math.min(lowestAnkle, foot.y) }
    // Keep the gown vertical and shorten it with the stance; legs cannot drag it sideways.
    if (bride) {
      const height = MathUtils.clamp(restHeight + .075 - lowestAnkle, .35, restHeight + .14)
      euler.setFromQuaternion(targetQ.fromArray(pose, 1).normalize(), 'YXZ')
      delta.setFromAxisAngle(up, euler.y * .55)
      for (const skirt of skirts) {
        orient(skirt, targetQ.copy(delta).multiply(bindWorld.get(skirt)!))
        skirt.scale.y = height / restHeight
      }
      if (veil) orient(veil, targetQ.copy(delta).multiply(bindWorld.get(veil)!))
      update()
    }
    // [DANCE-SWAP] Smooth .3-second crossfade; grounding is solved after interpolating the bones.
    if (fading) {
      const t = MathUtils.clamp((performance.now() - fadeStarted) / 300, 0, 1)
      const weight = t * t * (3 - 2 * t)
      for (const { bone, rotation, scale } of fading) {
        targetQ.copy(bone.quaternion)
        direction.copy(bone.scale)
        bone.quaternion.slerpQuaternions(rotation, targetQ, weight)
        bone.scale.lerpVectors(scale, direction, weight)
      }
      if (t === 1) fading = undefined
      update()
    }
    // [DANCE-SWAP] Resolve final-pose hands against the moving gown, including crossfade intermediates.
    {
      gownBounds.makeEmpty()
      for (const sample of gownSamples) for (const v of sample.indices) {
        sample.mesh.getVertexPosition(v, gownPoint).applyMatrix4(sample.mesh.matrixWorld); gownBounds.expandByPoint(gownPoint)
      }
      {
        const envelope = bride && !gownBounds.isEmpty() ? { minY: gownBounds.min.y, maxY: gownBounds.max.y, x: (gownBounds.min.x + gownBounds.max.x) / 2,
          z: (gownBounds.min.z + gownBounds.max.z) / 2, rx: (gownBounds.max.x - gownBounds.min.x) / 2, rz: (gownBounds.max.z - gownBounds.min.z) / 2 } : undefined
        headInverse.copy(head.matrixWorld).invert()
        for (const i of [0, 2]) {
          limbs[i].getWorldPosition(shoulder); limbs[i + 1].getWorldPosition(elbow); bones.get(limbEnds[i + 1])!.getWorldPosition(wrist)
          if (!fitWristInFrontOfHead(shoulder, wrist, Math.abs(armLengths[i] - armLengths[i + 1]) + .0001,
            armLengths[i] + armLengths[i + 1] - .0001, head.matrixWorld, headInverse, headCenter, headRadii, wrist, envelope)) continue
          axis.copy(wrist).sub(shoulder); const distance = axis.length(); axis.normalize()
          pole.copy(elbow).sub(shoulder); pole.addScaledVector(axis, -pole.dot(axis))
          if (pole.lengthSq() < 1e-8) pole.set(i === 0 ? -1 : 1, 0, 0).addScaledVector(axis, -axis.x * (i === 0 ? -1 : 1))
          pole.normalize()
          const along = (armLengths[i] ** 2 - armLengths[i + 1] ** 2 + distance ** 2) / (2 * distance)
          elbow.copy(shoulder).addScaledVector(axis, along).addScaledVector(pole, Math.sqrt(Math.max(0, armLengths[i] ** 2 - along ** 2)))
          direction.copy(elbow).sub(shoulder).normalize(); delta.setFromUnitVectors(restDirections[i], direction)
          orient(limbs[i], targetQ.copy(delta).multiply(bindWorld.get(limbs[i])!))
          limbs[i].getWorldQuaternion(armQ); armQ.multiply(targetQ.copy(bindWorld.get(limbs[i])!).invert())
          inherited.copy(restDirections[i + 1]).applyQuaternion(armQ).normalize(); direction.copy(wrist).sub(elbow).normalize()
          delta.setFromUnitVectors(inherited, direction)
          orient(limbs[i + 1], targetQ.copy(delta).multiply(armQ).multiply(bindWorld.get(limbs[i + 1])!))
        }
        update()
        group.userData.gownEnvelope = envelope
      }
    }
    let lowest = Infinity
    for (const { mesh, indices } of support) for (const i of indices) {
      mesh.getVertexPosition(i, foot).applyMatrix4(mesh.matrixWorld)
      lowest = Math.min(lowest, foot.y)
    }
    // Parent is exported with identity axes; vertical translation is in model/world Y.
    pelvis.position.y -= lowest
    update()
    // [DANCE-SWAP] Keep the measured envelope in the same grounded world space as the hands.
    if (bride && group.userData.gownEnvelope) {
      group.userData.gownEnvelope.minY -= lowest; group.userData.gownEnvelope.maxY -= lowest
    }
  }
  return { group, pelvis, spine, head, limbs, ankles, apply, transition, dispose: () => {
    for (const mesh of meshes) mesh.skeleton.dispose()
    group.clear()
  } }
}
