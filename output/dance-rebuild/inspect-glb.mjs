import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'

const file = path.resolve(process.argv[2])
const bytes = fs.readFileSync(file)
if (bytes.toString('ascii', 0, 4) !== 'glTF' || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) throw new Error('Invalid GLB header')
let gltf, binary
for (let offset = 12; offset < bytes.length;) {
  const length = bytes.readUInt32LE(offset), type = bytes.readUInt32LE(offset + 4)
  const chunk = bytes.subarray(offset + 8, offset + 8 + length)
  if (type === 0x4e4f534a) gltf = JSON.parse(chunk.toString('utf8'))
  if (type === 0x004e4942) binary = chunk
  offset += 8 + length
}
if (!gltf || !binary) throw new Error('Missing GLB chunks')
const meshes = (gltf.meshes ?? []).map(mesh => ({ name: mesh.name, primitives: mesh.primitives.map(primitive => {
  const positions = gltf.accessors[primitive.attributes.POSITION]
  const count = primitive.indices === undefined ? positions.count : gltf.accessors[primitive.indices].count
  return { vertices: positions.count, triangles: (primitive.mode ?? 4) === 4 ? count / 3 : null, material: primitive.material, attributes: Object.keys(primitive.attributes), min: positions.min, max: positions.max }
}) }))
const images = []
for (const image of gltf.images ?? []) {
  const view = gltf.bufferViews[image.bufferView]
  const metadata = await sharp(binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)).metadata()
  images.push({ mimeType: image.mimeType, width: metadata.width, height: metadata.height, bytes: view.byteLength })
}
const report = {
  file, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), generator: gltf.asset.generator,
  meshCount: meshes.length, meshes, triangles: meshes.flatMap(m => m.primitives).reduce((n, p) => n + (p.triangles ?? 0), 0),
  skinCount: gltf.skins?.length ?? 0, animationCount: gltf.animations?.length ?? 0,
  materials: (gltf.materials ?? []).map(m => ({ name: m.name, pbr: m.pbrMetallicRoughness, normalTexture: m.normalTexture, alphaMode: m.alphaMode, doubleSided: m.doubleSided })),
  images, extensionsUsed: gltf.extensionsUsed ?? [], acceptedForProduction: false,
}
fs.writeFileSync(path.join(path.dirname(file), 'glb-inspection.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
