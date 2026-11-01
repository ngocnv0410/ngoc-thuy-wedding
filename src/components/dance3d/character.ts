import {
  Bone, BoxGeometry, BufferGeometry, Color, ConeGeometry, CylinderGeometry, Group,
  Mesh, MeshStandardMaterial, Quaternion, SphereGeometry, TorusGeometry, Vector3,
  type Material, type Object3D,
} from 'three'

/** Rigid 3D meshes attached to a humanoid bone hierarchy; no SVG planes or image sprites. */
export interface WeddingCharacter {
  group: Group
  pelvis: Bone
  spine: Bone
  head: Bone
  limbs: Bone[]
  ankles: Bone[]
  skirt?: Mesh
  apply: (pose: number[]) => void
  dispose: () => void
}
const DOWN = new Vector3(0, -1, 0)

export function createWeddingCharacter(bride: boolean): WeddingCharacter {
  const group = new Group()
  group.name = bride ? 'bride-3d' : 'groom-3d'
  const geometries: BufferGeometry[] = [], materials: Material[] = []
  const geometry = <T extends BufferGeometry>(item: T): T => { geometries.push(item); return item }
  const ball = geometry(new SphereGeometry(1, 18, 12))
  const tube = geometry(new CylinderGeometry(1, 1, 1, 12))
  const box = geometry(new BoxGeometry(1, 1, 1))
  const palette = {
    skin: '#f4d3b7', hair: bride ? '#463027' : '#35291f', cloth: '#fff9ed',
    suit: '#6b5546', dark: '#33271f', gold: '#c4a46c', pink: '#df9a92', eye: '#392c25',
  }
  const mat = (color: string, roughness = .65) => {
    const material = new MeshStandardMaterial({ color: new Color(color), roughness })
    materials.push(material); return material
  }
  const skin = mat(palette.skin), hair = mat(palette.hair), cloth = mat(palette.cloth)
  const suit = mat(palette.suit), dark = mat(palette.dark), gold = mat(palette.gold, .35)
  const pink = mat(palette.pink), eye = mat(palette.eye, .3)
  function mesh(parent: Object3D, shape: BufferGeometry, material: Material, position: number[], scale: number[]) {
    const item = new Mesh(shape, material)
    item.position.fromArray(position); item.scale.fromArray(scale); parent.add(item); return item
  }
  const sphere = (parent: Object3D, material: Material, pos: number[], scale: number[]) => mesh(parent, ball, material, pos, scale)
  function bone(parent: Object3D, name: string, pos: number[]) {
    const item = new Bone(); item.name = name; item.position.fromArray(pos); parent.add(item); return item
  }
  const pelvis = bone(group, 'pelvis', [0, .68, 0])
  const spine = bone(pelvis, 'spine', [0, 0, 0])
  const head = bone(spine, 'head', [0, .60, 0])
  // Rounded jacket/bodice, neck and a head with a fully modeled face.
  mesh(spine, geometry(new CylinderGeometry(.20, .15, .49, 18)), bride ? cloth : suit, [0, .27, 0], [1, 1, .70])
  sphere(spine, bride ? skin : suit, [0, .49, 0], [.225, .10, .15])
  mesh(spine, tube, skin, [0, .565, 0], [.065, .13, .065])
  sphere(head, skin, [0, .265, 0], [.285, .32, .245])
  sphere(head, hair, [0, .36, -.045], [.292, .275, .235])
  // A face surface in front of the hair cap, framed by volumetric side locks.
  sphere(head, skin, [0, .25, .065], [.267, .265, .20])
  for (const side of [-1, 1]) {
    sphere(head, skin, [side * .276, .26, 0], [.045, .065, .043])
    sphere(head, eye, [side * .095, .28, .253], [.030, .041, .018])
    sphere(head, cloth, [side * .095 - .007, .294, .268], [.009, .011, .006])
    sphere(head, pink, [side * .162, .205, .225], [.043, .020, .009])
    const bang = sphere(head, hair, [side * .21, .405, .11], [.081, .17, .07])
    bang.rotation.z = side * .38
  }
  sphere(head, skin, [0, .228, .27], [.026, .024, .028])
  const smile = mesh(head, geometry(new TorusGeometry(.047, .007, 6, 16, Math.PI)), eye, [0, .168, .253], [1, .7, 1])
  smile.rotation.z = Math.PI
  let skirt: Mesh | undefined
  if (bride) {
    sphere(head, hair, [0, .45, -.20], [.16, .16, .13])
    const veilMat = new MeshStandardMaterial({ color: '#fffaf4', transparent: true, opacity: .32, roughness: .9, depthWrite: false })
    materials.push(veilMat)
    const veil = mesh(head, geometry(new ConeGeometry(.34, .88, 18, 1, true)), veilMat, [0, -.03, -.20], [1, 1, .35])
    veil.rotation.x = -.12
    for (const side of [-1, 1]) {
      const strap = mesh(spine, box, cloth, [side * .14, .49, .13], [.045, .15, .022])
      strap.rotation.z = -side * .2
    }
    skirt = mesh(group, geometry(new CylinderGeometry(.16, .46, .62, 24)), cloth, [0, -.27, 0], [1, 1, .85])
    const hem = mesh(skirt, geometry(new TorusGeometry(.445, .014, 6, 24)), gold, [0, -.30, 0], [1, .85, 1])
    hem.rotation.x = Math.PI / 2
    // Crown pearls and small gold blossom pins.
    for (let i = 0; i < 7; i++) {
      const angle = (i - 3) * .18
      sphere(head, i % 2 ? gold : cloth, [Math.sin(angle) * .22, .54 - Math.abs(angle) * .065, .12], [.022, .023, .022])
    }
    for (let i = -2; i <= 2; i++) sphere(spine, gold, [i * .025, .525 - (2 - Math.abs(i)) * .008, .138], [.009, .009, .009])
  } else {
    mesh(spine, box, cloth, [0, .37, .143], [.15, .25, .025])
    for (const side of [-1, 1]) {
      const lapel = mesh(spine, box, suit, [side * .103, .35, .155], [.09, .33, .032])
      lapel.rotation.z = side * .28
      sphere(spine, gold, [side * .034, .488, .177], [.039, .021, .022])
    }
    for (let i = 0; i < 3; i++) sphere(spine, gold, [0, .27 - i * .065, .118], [.011, .011, .012])
    sphere(spine, cloth, [-.135, .405, .14], [.038, .028, .022])
    const forelock = sphere(head, hair, [.06, .49, .13], [.18, .085, .09]); forelock.rotation.z = -.2
  }
  const limbs: Bone[] = [], ankles: Bone[] = []
  for (const [name, x] of [['L', -.22], ['R', .22]] as const) {
    const upper = bone(spine, `upperArm${name}`, [x, .46, 0])
    const lower = bone(upper, `forearm${name}`, [0, -.30, 0])
    sphere(upper, bride ? skin : suit, [0, -.15, 0], [bride ? .045 : .060, .17, .055])
    sphere(lower, bride ? skin : suit, [0, -.12, 0], [bride ? .038 : .050, .14, .045])
    sphere(upper, bride ? skin : suit, [0, 0, 0], [.065, .065, .065])
    sphere(lower, bride ? skin : suit, [0, 0, 0], [.050, .050, .050])
    if (!bride) mesh(lower, tube, cloth, [0, -.235, 0], [.051, .033, .048])
    sphere(lower, skin, [0, -.278, .012], [.049, .064, .038])
    sphere(lower, skin, [-.036, -.26, .027], [.018, .035, .018])
    limbs.push(upper, lower)
  }
  for (const [name, x] of [['L', -.115], ['R', .115]] as const) {
    const upper = bone(pelvis, `thigh${name}`, [x, 0, 0])
    const lower = bone(upper, `shin${name}`, [0, -.32, 0])
    const ankle = bone(lower, `ankle${name}`, [0, -.30, 0])
    sphere(upper, bride ? skin : suit, [0, -.16, 0], [.075, .18, .072])
    sphere(lower, bride ? skin : suit, [0, -.15, 0], [.060, .17, .060])
    sphere(ankle, bride ? cloth : dark, [0, -.026, .055], [.075, .040, .13])
    limbs.push(upper, lower); ankles.push(ankle)
  }
  const worldQ = new Quaternion(), parentQ = new Quaternion(), direction = new Vector3(), foot = new Vector3()
  const orient = (joint: Bone, target: Quaternion) => {
    joint.parent!.getWorldQuaternion(parentQ)
    joint.quaternion.copy(parentQ.invert().multiply(target))
    joint.updateWorldMatrix(false, true)
  }
  const apply = (pose: number[]) => {
    pelvis.position.set(pose[0], 0, 0)
    pelvis.quaternion.fromArray(pose, 1).normalize()
    group.updateMatrixWorld(true)
    orient(spine, worldQ.fromArray(pose, 5).normalize())
    orient(head, worldQ.fromArray(pose, 9).normalize())
    for (let i = 0; i < limbs.length; i++) {
      direction.fromArray(pose, 13 + i * 3).normalize()
      orient(limbs[i], worldQ.setFromUnitVectors(DOWN, direction))
    }
    let lowest = Infinity
    for (const ankle of ankles) { ankle.getWorldPosition(foot); lowest = Math.min(lowest, foot.y) }
    pelvis.position.y = .067 - lowest
    group.updateMatrixWorld(true)
    if (skirt) {
      const height = Math.max(.28, Math.min(.62, pelvis.position.y - .035))
      skirt.scale.y = height / .62
      skirt.position.set(pelvis.position.x, pelvis.position.y - height / 2 + .04, 0)
      // Cloth hangs under gravity; follow hip yaw without tilting the hem into the floor.
      skirt.rotation.y = Math.atan2(2 * (pelvis.quaternion.w * pelvis.quaternion.y + pelvis.quaternion.x * pelvis.quaternion.z), 1 - 2 * (pelvis.quaternion.y ** 2 + pelvis.quaternion.x ** 2))
    }
  }
  return { group, pelvis, spine, head, limbs, ankles, skirt, apply, dispose: () => {
    for (const item of geometries) item.dispose()
    for (const item of materials) item.dispose()
  } }
}
