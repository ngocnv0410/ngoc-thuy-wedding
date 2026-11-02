// [DANCE-SWAP] Adapter for the owner's colored/skinned Drive GLBs. The legacy rig remains available.
import { Bone, Euler, Group, MathUtils, Quaternion, SkinnedMesh, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import type { WeddingCharacter } from './character'

// [DANCE-SWAP] Keep async asset loading outside the synchronous scene/actor interface.
let prepared: Group[] | undefined
let loading: Promise<void> | undefined
export function preloadRiggedCharacters(): Promise<void> {
  return loading ??= Promise.all(['groom', 'bride'].map(name => new GLTFLoader()
    .loadAsync(`${import.meta.env.BASE_URL}models/wedding/${name}-rigged.glb`)
    .then(gltf => gltf.scene)))
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
    euler.x = MathUtils.clamp(euler.x, -.25, .30)
    euler.y = MathUtils.clamp(euler.y, -.30, .30)
    orient(head, targetQ.setFromEuler(euler).multiply(bindWorld.get(head)!))
    for (let i = 0; i < limbs.length; i++) {
      direction.fromArray(pose, 13 + i * 3).normalize()
      delta.setFromUnitVectors(restDirections[i], direction)
      orient(limbs[i], targetQ.copy(delta).multiply(bindWorld.get(limbs[i])!))
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
    let lowest = Infinity
    for (const { mesh, indices } of support) for (const i of indices) {
      mesh.getVertexPosition(i, foot).applyMatrix4(mesh.matrixWorld)
      lowest = Math.min(lowest, foot.y)
    }
    // Parent is exported with identity axes; vertical translation is in model/world Y.
    pelvis.position.y -= lowest
    update()
  }
  return { group, pelvis, spine, head, limbs, ankles, apply, transition, dispose: () => {
    for (const mesh of meshes) mesh.skeleton.dispose()
    group.clear()
  } }
}
