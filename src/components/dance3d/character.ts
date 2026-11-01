import {
  Bone, BufferGeometry, CylinderGeometry, DoubleSide, Group, LatheGeometry, Mesh,
  MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, Quaternion, SphereGeometry,
  TorusGeometry, Vector2, Vector3, type Material, type Object3D,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { approvedHeadSize, type CharacterArt } from './approvedArt'

export interface WeddingCharacter {
  group: Group; pelvis: Bone; spine: Bone; head: Bone; limbs: Bone[]; ankles: Bone[]
  skirt?: Mesh; apply: (pose: number[]) => void; dispose: () => void
}
const DOWN = new Vector3(0, -1, 0)
export const CHIBI_BONES = { upperArm: .18, forearm: .17, thigh: .20, shin: .19, neck: .44 } as const

/** The approved portrait is a painted surface on a rounded, articulated 3D head, never a billboard. */
export function approvedHeadGeometry(bride: boolean): PlaneGeometry {
  const { width, height } = approvedHeadSize(bride)
  const geometry = new PlaneGeometry(width, height, 48, 48)
  geometry.translate(0, height / 2 - .025, 0)
  const positions = geometry.getAttribute('position')
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i)
    const volume = .10 + .28 * Math.sqrt(Math.max(0, 1 - (x / .52) ** 2 - ((y - .46) / .58) ** 2))
    const nose = .035 * Math.exp(-((x / .045) ** 2) - ((y - .17) / .06) ** 2)
    positions.setZ(i, volume + nose)
  }
  geometry.computeVertexNormals()
  return geometry
}

export function createWeddingCharacter(bride: boolean, art?: CharacterArt): WeddingCharacter {
  const group = new Group(); group.name = bride ? 'bride-3d' : 'groom-3d'
  const geometries: BufferGeometry[] = [], materials: Material[] = []
  const keep = <T extends BufferGeometry>(item: T): T => { geometries.push(item); return item }
  const ball = keep(new SphereGeometry(1, 24, 18)), tube = keep(new CylinderGeometry(1, 1, 1, 16))
  const material = (color: string, roughness = .8, glow = 0) => {
    const result = new MeshStandardMaterial({ color, roughness, emissive: color, emissiveIntensity: glow })
    materials.push(result); return result
  }
  const skin = new MeshBasicMaterial({ color: '#fae3d7', toneMapped: false }); materials.push(skin)
  const hair = material('#705342', .72, .04)
  const cloth = material('#ffffff', .86, .25), suit = material('#7d6658', .86, .02)
  const gownWhite = new MeshBasicMaterial({ color: '#fffefd', toneMapped: false }); materials.push(gownWhite)
  const lapel = material('#a38c7c', .9, .02), shoes = material('#705347', .45, .03)
  const gold = material('#d6bb8c', .55, .08)
  const faceMaterial = new MeshBasicMaterial({ map: art?.[bride ? 'bride' : 'groom'], color: '#ffffff', alphaTest: .32, side: DoubleSide, toneMapped: false })
  materials.push(faceMaterial)
  function mesh(parent: Object3D, geometry: BufferGeometry, mat: Material | Material[], pos: number[], scale = [1, 1, 1], name?: string) {
    const item = new Mesh(geometry, mat); item.position.fromArray(pos); item.scale.fromArray(scale)
    if (name) item.name = name
    parent.add(item); return item
  }
  const sphere = (parent: Object3D, mat: Material | Material[], pos: number[], scale: number[], name?: string) => mesh(parent, ball, mat, pos, scale, name)
  const rounded = (parent: Object3D, mat: Material | Material[], pos: number[], size: number[], radius = .02) => mesh(parent,
    keep(new RoundedBoxGeometry(size[0], size[1], size[2], 3, radius)), mat, pos)
  const bone = (parent: Object3D, name: string, pos: number[]) => {
    const result = new Bone(); result.name = name; result.position.fromArray(pos); parent.add(result); return result
  }
  const pelvis = bone(group, 'pelvis', [0, .45, 0]), spine = bone(pelvis, 'spine', [0, 0, 0])
  const head = bone(spine, 'head', [0, CHIBI_BONES.neck, 0])
  mesh(spine, tube, skin, [0, .45, 0], [.045, .14, .045])
  const backHair = art?.hair ? new MeshBasicMaterial({ map: art.hair, toneMapped: false }) : hair
  if (backHair !== hair) materials.push(backHair)
  sphere(head, backHair, [0, .50, -.07], [.35, .355, .15], 'approved-hair-volume')
  if (bride) sphere(head, backHair, [.255, .065, -.18], [.14, .13, .13], 'low-nape-bun')
  const portrait = mesh(head, keep(approvedHeadGeometry(bride)), faceMaterial, [0, 0, 0], [1, 1, 1], 'approved-portrait-head')
  portrait.userData.design = 'approved-2026-11-01'
  let skirt: Mesh | undefined, veil: Mesh | undefined
  if (bride) {
    sphere(spine, skin, [0, .36, 0], [.16, .07, .105])
    rounded(spine, gownWhite, [0, .225, .015], [.285, .27, .18], .045)
    for (const side of [-1, 1]) {
      const strap = rounded(spine, gownWhite, [side * .12, .36, .086], [.025, .12, .015], .006)
      strap.rotation.z = -side * .10
    }
    const profile = [[.52, -.55], [.46, -.48], [.33, -.30], [.18, -.12], [.12, 0]].map(([r, y]) => new Vector2(r, y))
    const gown = keep(new LatheGeometry(profile, 48))
    const vertices = gown.getAttribute('position')
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i)
      const pleat = 1 + .018 * Math.sin(Math.atan2(z, x) * 16) * Math.min(1, -y / .3)
      vertices.setXYZ(i, x * pleat, y, z * pleat)
    }
    gown.computeVertexNormals()
    skirt = mesh(group, gown, gownWhite, [0, .55, 0], [1, 1, .78], 'approved-white-gown')
    if (art?.gown) {
      const printed = keep(gown.clone()), uv = printed.getAttribute('uv'), p = printed.getAttribute('position'), normals = printed.getAttribute('normal')
      for (let i = 0; i < p.count; i++) {
        uv.setXY(i, (p.getX(i) / .52 + 1) / 2, (p.getY(i) + .55) / .55)
        p.setXYZ(i, p.getX(i) + normals.getX(i) * .002, p.getY(i) + normals.getY(i) * .002, p.getZ(i) + normals.getZ(i) * .002)
      }
      const source = printed.index!, front: number[] = []
      for (let i = 0; i < source.count; i += 3) {
        const a = source.getX(i), b = source.getX(i + 1), c = source.getX(i + 2)
        if (p.getZ(a) + p.getZ(b) + p.getZ(c) >= 0) front.push(a, b, c)
      }
      printed.setIndex(front)
      const fabric = new MeshBasicMaterial({ map: art.gown, alphaTest: .15, toneMapped: false }); materials.push(fabric)
      mesh(skirt, printed, fabric, [0, 0, 0])
    }
    const hem = mesh(skirt, keep(new TorusGeometry(.515, .003, 6, 48)), gownWhite, [0, -.548, 0], [1, .78, 1])
    hem.rotation.x = Math.PI / 2
    const veilMaterial = new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .23, side: DoubleSide, depthWrite: false })
    materials.push(veilMaterial)
    const veilShape = keep(new PlaneGeometry(1, 1, 16, 18)), v = veilShape.getAttribute('position')
    for (let i = 0; i < v.count; i++) {
      const x = v.getX(i), y = v.getY(i), progress = .5 - y
      v.setXYZ(i, x * (.45 + .55 * progress), -progress, -.24 - .06 * Math.cos(x * 12) * progress)
    }
    veilShape.computeVertexNormals()
    veil = mesh(group, veilShape, veilMaterial, [0, .95, 0], [1, 1, 1], 'approved-white-veil')
  } else {
    const jacket = rounded(spine, suit, [0, .205, 0], [.44, .48, .235], .035)
    if (art?.coat) {
      const front = new MeshBasicMaterial({ map: art.coat, alphaTest: .15, toneMapped: false }); materials.push(front)
      jacket.material = [suit, suit, suit, suit, front, suit]
    }
    jacket.name = 'approved-taupe-jacket'
    if (!art?.coat) {
    rounded(spine, cloth, [0, .32, .12], [.12, .19, .014], .012)
    for (const side of [-1, 1]) {
      const collar = rounded(spine, cloth, [side * .042, .385, .137], [.07, .065, .016], .010)
      collar.rotation.z = side * .35
      const edge = rounded(spine, lapel, [side * .092, .30, .134], [.075, .23, .019], .013)
      edge.rotation.z = -side * .24
      sphere(spine, cloth, [side * .032, .37, .156], [.040, .022, .022])
      rounded(spine, lapel, [side * .113, .09, .132], [.065, .012, .009], .004)
    }
    sphere(spine, cloth, [0, .37, .170], [.014, .022, .010])
    for (const y of [.16, .065]) sphere(spine, lapel, [0, y, .132], [.014, .014, .010])
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 2 / 5
      sphere(spine, cloth, [.13 + .022 * Math.cos(angle), .32 + .022 * Math.sin(angle), .153], [.018, .018, .010])
    }
    sphere(spine, gold, [.13, .32, .166], [.009, .009, .008])
    }
  }
  const limbs: Bone[] = [], ankles: Bone[] = []
  for (const [name, sign] of [['L', -1], ['R', 1]] as const) {
    const upper = bone(spine, `upperArm${name}`, [sign * (bride ? .18 : .235), .36, 0]), lower = bone(upper, `forearm${name}`, [0, -CHIBI_BONES.upperArm, 0])
    sphere(upper, bride ? skin : suit, [0, -.09, 0], [bride ? .038 : .052, .105, .045])
    sphere(lower, bride ? skin : suit, [0, -.075, 0], [bride ? .033 : .045, .09, .040])
    sphere(upper, bride ? skin : suit, [0, 0, 0], [.048, .048, .044])
    sphere(lower, bride ? skin : suit, [0, 0, 0], [.040, .040, .037])
    if (!bride) mesh(lower, tube, cloth, [0, -.145, 0], [.045, .025, .041])
    sphere(lower, skin, [0, -.185, .006], [.044, .049, .034])
    sphere(lower, skin, [-.030, -.17, .023], [.014, .027, .014])
    limbs.push(upper, lower)
  }
  for (const [name, x] of [['L', -.115], ['R', .115]] as const) {
    const upper = bone(pelvis, `thigh${name}`, [x, 0, 0]), lower = bone(upper, `shin${name}`, [0, -CHIBI_BONES.thigh, 0])
    const ankle = bone(lower, `ankle${name}`, [0, -CHIBI_BONES.shin, 0])
    if (bride) {
      sphere(upper, skin, [0, -.10, 0], [.05, .115, .05]); sphere(lower, skin, [0, -.095, 0], [.045, .11, .045])
    } else {
      mesh(upper, tube, suit, [0, -.10, 0], [.075, .22, .070])
      mesh(lower, tube, suit, [0, -.095, 0], [.071, .21, .067])
      sphere(lower, suit, [0, 0, 0], [.074, .035, .070])
    }
    sphere(ankle, bride ? cloth : shoes, [0, -.026, .035], [.075, .036, .105])
    limbs.push(upper, lower); ankles.push(ankle)
  }
  const worldQ = new Quaternion(), parentQ = new Quaternion(), direction = new Vector3(), foot = new Vector3()
  const orient = (joint: Bone, target: Quaternion) => {
    joint.parent!.getWorldQuaternion(parentQ); joint.quaternion.copy(parentQ.invert().multiply(target)); joint.updateWorldMatrix(false, true)
  }
  const apply = (pose: number[]) => {
    pelvis.position.set(pose[0], 0, 0); pelvis.quaternion.fromArray(pose, 1).normalize(); group.updateMatrixWorld(true)
    orient(spine, worldQ.fromArray(pose, 5).normalize()); orient(head, worldQ.fromArray(pose, 9).normalize())
    for (let i = 0; i < limbs.length; i++) orient(limbs[i], worldQ.setFromUnitVectors(DOWN, direction.fromArray(pose, 13 + i * 3).normalize()))
    let lowest = Infinity
    for (const ankle of ankles) { ankle.getWorldPosition(foot); lowest = Math.min(lowest, foot.y) }
    pelvis.position.y = .067 - lowest; group.updateMatrixWorld(true)
    if (skirt) {
      skirt.scale.y = Math.max(.26, Math.min(.62, pelvis.position.y + .09)) / .55
      skirt.position.set(pelvis.position.x, pelvis.position.y + .11, 0)
      skirt.rotation.y = Math.atan2(2 * (pelvis.quaternion.w * pelvis.quaternion.y + pelvis.quaternion.x * pelvis.quaternion.z), 1 - 2 * (pelvis.quaternion.y ** 2 + pelvis.quaternion.x ** 2))
    }
    if (veil) { veil.position.set(pelvis.position.x, pelvis.position.y + .50, 0); veil.scale.y = Math.max(.45, Math.min(1, pelvis.position.y + .46)) }
  }
  return { group, pelvis, spine, head, limbs, ankles, skirt, apply, dispose: () => {
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose())
  } }
}
