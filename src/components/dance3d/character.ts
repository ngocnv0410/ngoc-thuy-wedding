import {
  BackSide, Bone, BufferGeometry, CylinderGeometry, DataTexture, DoubleSide, ExtrudeGeometry,
  Group, LatheGeometry, Line, LineBasicMaterial, LineLoop, Mesh, MeshBasicMaterial, MeshToonMaterial,
  NearestFilter, Quaternion, RedFormat, SphereGeometry, TorusGeometry, Vector2, Vector3,
  type Material, type Object3D,
} from 'three'
import { BRIDE, GROOM } from '../chibi/chibiArt'
import { chibiShapes } from './svgShapes'

export interface WeddingCharacter {
  group: Group; pelvis: Bone; spine: Bone; head: Bone; limbs: Bone[]; ankles: Bone[]
  skirt?: Mesh; apply: (pose: number[]) => void; dispose: () => void
}
const DOWN = new Vector3(0, -1, 0)
// Original artwork is 120 × 200: large head, a short jacket/bodice and short legs.
export const CHIBI_BONES = { upperArm: .18, forearm: .17, thigh: .20, shin: .19, neck: .44 } as const

export function createWeddingCharacter(bride: boolean): WeddingCharacter {
  const group = new Group(); group.name = bride ? 'bride-3d' : 'groom-3d'
  const geometries: BufferGeometry[] = [], materials: Material[] = []
  const keep = <T extends BufferGeometry>(item: T): T => { geometries.push(item); return item }
  const ball = keep(new SphereGeometry(1, 24, 18)), tube = keep(new CylinderGeometry(1, 1, 1, 16))
  const gradient = new DataTexture(new Uint8Array([165, 205, 235, 255]), 4, 1, RedFormat)
  gradient.minFilter = NearestFilter; gradient.magFilter = NearestFilter; gradient.needsUpdate = true
  const toon = (color: string) => {
    const material = new MeshToonMaterial({ color, gradientMap: gradient }); materials.push(material); return material
  }
  const basic = (color: string) => { const m = new MeshBasicMaterial({ color }); materials.push(m); return m }
  const skin = toon('#f7e1cc'), hair = toon(bride ? '#48352c' : '#3e3029')
  const cloth = toon('#fffaf3'), suit = toon('#6e5a4b'), shoes = toon('#3b2c22'), gold = toon('#c6a66b')
  cloth.emissive.set('#fffaf3'); cloth.emissiveIntensity = .15
  const hairSurface = (x: number, y: number) => .03 + .28 * Math.sqrt(Math.max(0, 1 - (x / .435) ** 2 - ((y - .52) / .445) ** 2))
  const iris = basic('#8a5a34'), pupil = basic('#3b2c22'), white = basic('#fffaf3'), blush = basic('#e9b4a6')
  const outline = new MeshBasicMaterial({ color: '#3b2c22', side: BackSide }); materials.push(outline)
  const ink = new LineBasicMaterial({ color: '#49382c' }), foldInk = new LineBasicMaterial({ color: '#c6b89e' })
  materials.push(ink, foldInk)
  function mesh(parent: Object3D, geometry: BufferGeometry, material: Material, pos: number[], scale = [1, 1, 1], name?: string) {
    const item = new Mesh(geometry, material); item.position.fromArray(pos); item.scale.fromArray(scale)
    if (name) item.name = name
    parent.add(item); return item
  }
  const sphere = (parent: Object3D, material: Material, pos: number[], scale: number[], name?: string) => mesh(parent, ball, material, pos, scale, name)
  const trace = (parent: Object3D, path: string, ox: number, oy: number, z: number, material = ink, closed = false, roundedHead = false) => {
    for (const shape of chibiShapes(path, ox, oy)) {
      const points = shape.getPoints(32).map(p => new Vector3(p.x, p.y, roundedHead ? hairSurface(p.x, p.y) + .008 : z))
      const geometry = keep(new BufferGeometry().setFromPoints(points))
      parent.add(closed ? new LineLoop(geometry, material) : new Line(geometry, material))
    }
  }
  const relief = (parent: Object3D, path: string, ox: number, oy: number, z: number, depth: number, material: Material, name?: string, roundedHead = false) => {
    const geometry = keep(new ExtrudeGeometry(chibiShapes(path, ox, oy), {
      depth, bevelEnabled: true, bevelThickness: .008, bevelSize: .007, bevelSegments: 3, curveSegments: 16, steps: 1,
    }))
    if (roundedHead) {
      const positions = geometry.getAttribute('position')
      for (let i = 0; i < positions.count; i++) {
        positions.setZ(i, hairSurface(positions.getX(i), positions.getY(i)) - z - depth - .008 + positions.getZ(i))
      }
      geometry.computeVertexNormals()
    }
    const item = mesh(parent, geometry, material, [0, 0, z], [1, 1, 1], name)
    trace(parent, path, ox, oy, z + depth + .009, ink, true, roundedHead)
    return item
  }
  const bone = (parent: Object3D, name: string, pos: number[]) => {
    const joint = new Bone(); joint.name = name; joint.position.fromArray(pos); parent.add(joint); return joint
  }
  const pelvis = bone(group, 'pelvis', [0, .45, 0]), spine = bone(pelvis, 'spine', [0, 0, 0])
  const head = bone(spine, 'head', [0, CHIBI_BONES.neck, 0])
  mesh(spine, tube, skin, [0, .45, 0], [.05, .14, .05])
  // The face, front hair, side curls and tuft retain the existing SVG's exact front proportions.
  sphere(head, outline, [0, .38, .03], [.407, .377, .247])
  sphere(head, skin, [0, .38, .03], [.40, .37, .24], 'original-chibi-face')
  sphere(head, hair, [0, .52, -.11], [.415, .435, .25])
  if (bride) {
    relief(head, BRIDE.hairBack, 60, 106, -.21, .10, hair, 'original-bridal-hair-back')
    sphere(head, hair, [.20, -.025, -.19], [.14, .13, .12], 'low-nape-bun')
  } else {
    for (const side of [-1, 1]) sphere(head, skin, [side * .39, .33, .02], [.05, .07, .045])
  }
  relief(head, bride ? BRIDE.hair : GROOM.hair, 60, 106, .185, .07, hair, 'original-chibi-hair', true)
  if (bride) {
    relief(head, BRIDE.lockL, 60, 106, .19, .06, hair, undefined, true)
    relief(head, BRIDE.lockR, 60, 106, .19, .06, hair, undefined, true)
    trace(head, BRIDE.strands, 60, 106, .272, foldInk, false, true)
  } else {
    relief(head, GROOM.tuft, 60, 106, .045, .10, hair, 'original-groom-tuft', true)
    trace(head, GROOM.strands, 60, 106, .272, foldInk, false, true)
  }
  for (const side of [-1, 1]) {
    const x = side * .15
    sphere(head, iris, [x, .32, .257], [.075, .09, .014])
    sphere(head, pupil, [x, .30, .271], [.042, .055, .010])
    sphere(head, white, [x - .026, .355, .283], [.024, .025, .008])
    sphere(head, white, [x + .026, .275, .281], [.010, .011, .006])
    sphere(head, blush, [side * .25, .19, .194], [.060, .032, .007])
    const svgX = 60 + side * 15
    trace(head, `M${svgX - 8.5} 71Q${svgX} 62 ${svgX + 8.5} 71`, 60, 106, .283)
    trace(head, `M${svgX - 6} 59Q${svgX} 56 ${svgX + 6} 59`, 60, 106, .257)
  }
  trace(head, 'M60 82q1.2 1.4-0.2 2.4', 60, 106, .278)
  trace(head, 'M55.5 90Q60 93.6 64.5 90', 60, 106, .241)
  let skirt: Mesh | undefined, veil: Mesh | undefined
  if (bride) {
    relief(spine, BRIDE.shoulders, 60, 150, -.04, .10, skin)
    relief(spine, BRIDE.bodice, 60, 150, -.04, .14, cloth, 'original-bridal-bodice')
    trace(spine, BRIDE.straps, 60, 150, .115)
    const profile = [[.38, -.55], [.34, -.47], [.24, -.28], [.17, -.11], [.14, 0]].map(([r, y]) => new Vector2(r, y))
    skirt = mesh(group, keep(new LatheGeometry(profile, 32)), cloth, [0, .55, 0], [1, 1, .70], 'full-length-bridal-skirt')
    for (const ratio of [-.4, 0, .4]) {
      const points = profile.map(([x, y]) => new Vector3(x * ratio, y, Math.sqrt(x * x * (1 - ratio * ratio)) * .70 + .007))
      skirt.add(new Line(keep(new BufferGeometry().setFromPoints(points)), foldInk))
    }
    const hem = mesh(skirt, keep(new TorusGeometry(.375, .004, 6, 40)), cloth, [0, -.548, 0], [1, .70, 1])
    hem.rotation.x = Math.PI / 2
    const veilMat = new MeshToonMaterial({ color: '#fffaf3', transparent: true, opacity: .23, side: DoubleSide, depthWrite: false })
    materials.push(veilMat)
    veil = mesh(head, keep(new ExtrudeGeometry(chibiShapes(BRIDE.veil, 60, 95), { depth: .006, bevelEnabled: false, curveSegments: 18 })), veilMat, [0, .11, -.29])
    // Small pearl/blossom pin against the side of the hair, matching the original; no crown.
    trace(head, 'M25 49C26 41 32 32 42 29', 60, 106, .285, foldInk, false, true)
    for (const [x, y, size] of [[28, 43, .026], [34, 35, .021], [41, 30, .016]]) {
      for (let petal = 0; petal < 5; petal++) {
        const a = petal * Math.PI * 2 / 5
        sphere(head, cloth, [(x - 60) / 100 + Math.cos(a) * size, (106 - y) / 100 + Math.sin(a) * size, hairSurface((x - 60) / 100, (106 - y) / 100) + .018], [size * .65, size * .65, .009])
      }
      sphere(head, gold, [(x - 60) / 100, (106 - y) / 100, hairSurface((x - 60) / 100, (106 - y) / 100) + .027], [.009, .009, .009])
    }
  } else {
    relief(spine, GROOM.jacket, 60, 150, -.09, .18, suit, 'original-groom-jacket')
    relief(spine, GROOM.shirt, 60, 150, .103, .01, cloth)
    relief(spine, GROOM.tie, 60, 150, .121, .012, cloth)
    trace(spine, GROOM.lapels, 60, 150, .116)
    for (const y of [.13, .06]) sphere(spine, gold, [0, y, .108], [.013, .013, .009])
    sphere(spine, cloth, [.12, .30, .113], [.030, .025, .018])
  }
  const limbs: Bone[] = [], ankles: Bone[] = []
  for (const [name, x] of [['L', -.15], ['R', .15]] as const) {
    const upper = bone(spine, `upperArm${name}`, [x, .36, 0])
    const lower = bone(upper, `forearm${name}`, [0, -CHIBI_BONES.upperArm, 0])
    sphere(upper, bride ? skin : suit, [0, -.09, 0], [bride ? .032 : .047, .105, .042])
    sphere(lower, bride ? skin : suit, [0, -.075, 0], [bride ? .028 : .040, .09, .037])
    sphere(upper, bride ? skin : suit, [0, 0, 0], [.045, .045, .043])
    sphere(lower, bride ? skin : suit, [0, 0, 0], [.036, .036, .035])
    if (!bride) mesh(lower, tube, cloth, [0, -.144, 0], [.041, .026, .038])
    sphere(lower, skin, [0, -.185, .006], [bride ? .040 : .045, .048, .033])
    sphere(lower, skin, [-.030, -.174, .020], [.014, .025, .014])
    limbs.push(upper, lower)
  }
  for (const [name, x] of [['L', -.07], ['R', .07]] as const) {
    const upper = bone(pelvis, `thigh${name}`, [x, 0, 0])
    const lower = bone(upper, `shin${name}`, [0, -CHIBI_BONES.thigh, 0])
    const ankle = bone(lower, `ankle${name}`, [0, -CHIBI_BONES.shin, 0])
    sphere(upper, bride ? skin : suit, [0, -.10, 0], [.050, .115, .050])
    sphere(lower, bride ? skin : suit, [0, -.095, 0], [.045, .110, .045])
    sphere(ankle, bride ? cloth : shoes, [0, -.026, .035], [.059, .036, .088])
    limbs.push(upper, lower); ankles.push(ankle)
  }
  const worldQ = new Quaternion(), parentQ = new Quaternion(), direction = new Vector3(), foot = new Vector3()
  const orient = (joint: Bone, target: Quaternion) => {
    joint.parent!.getWorldQuaternion(parentQ); joint.quaternion.copy(parentQ.invert().multiply(target))
    joint.updateWorldMatrix(false, true)
  }
  const apply = (pose: number[]) => {
    pelvis.position.set(pose[0], 0, 0); pelvis.quaternion.fromArray(pose, 1).normalize(); group.updateMatrixWorld(true)
    orient(spine, worldQ.fromArray(pose, 5).normalize()); orient(head, worldQ.fromArray(pose, 9).normalize())
    for (let i = 0; i < limbs.length; i++) orient(limbs[i], worldQ.setFromUnitVectors(DOWN, direction.fromArray(pose, 13 + i * 3).normalize()))
    let lowest = Infinity
    for (const ankle of ankles) { ankle.getWorldPosition(foot); lowest = Math.min(lowest, foot.y) }
    pelvis.position.y = .067 - lowest; group.updateMatrixWorld(true)
    if (skirt) {
      const height = Math.max(.26, Math.min(.62, pelvis.position.y + .09))
      skirt.scale.y = height / .55
      skirt.position.set(pelvis.position.x, pelvis.position.y + .11, 0)
      skirt.rotation.y = Math.atan2(2 * (pelvis.quaternion.w * pelvis.quaternion.y + pelvis.quaternion.x * pelvis.quaternion.z), 1 - 2 * (pelvis.quaternion.y ** 2 + pelvis.quaternion.x ** 2))
    }
    if (veil) veil.scale.y = Math.max(.45, Math.min(1, (pelvis.position.y + .50) / .98))
  }
  return { group, pelvis, spine, head, limbs, ankles, skirt, apply, dispose: () => {
    geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose()); gradient.dispose()
  } }
}
