// [DANCE-SWAP] Offline capture of the real GLB adapter; no browser/controller changes or app dependency.
import fs from 'node:fs'
import path from 'node:path'
import { createServer } from 'vite'
import { Bone, Texture, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
const out = process.env.DANCE_BAKE_OUT || '/workspace/scratch/smooth-dance'
fs.mkdirSync(out, { recursive: true })
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { createRiggedCharacter } = await server.ssrLoadModule('/src/components/dance3d/glbCharacter.ts')
  const { sampleMotion } = await server.ssrLoadModule('/src/components/dance3d/motion.ts')
  const templates = []
  for (const name of ['groom', 'bride']) {
    const bytes = fs.readFileSync(`public/models/wedding/${name}-rigged.glb`), loader = new GLTFLoader()
    loader.register(() => ({ name: 'EXT_texture_webp', loadTexture: async () => new Texture() }))
    templates.push((await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene)
  }
  for (const [name, file] of [['bad','badInPlaceMotion'], ['bang','bangSourceMotion']]) {
    const clip = JSON.parse(fs.readFileSync(`src/components/dance3d/${file}.json`, 'utf8'))
    for (let sex = 0; sex < 2; sex++) {
      const actor = createRiggedCharacter(templates[sex], sex === 1, process.env.DANCE_BAKE_MARGIN ? Number(process.env.DANCE_BAKE_MARGIN) : 0)
      const bones = []; actor.group.traverse(node => { if (node instanceof Bone) bones.push(node) })
      const rest = bones.flatMap(bone => [...bone.quaternion.toArray(), bone.scale.y])
      const frames = [], wrists = [], corrections = [], point = new Vector3()
      const fps = clip.fps * Number(process.env.DANCE_AUDIT_RATE || 1)
      const count = process.env.DANCE_AUDIT_RATE ? Math.ceil(clip.duration * fps) + 1 : clip.frames.length
      for (let frame = 0; frame < count; frame++) {
        // Spread removes sampler metadata for source capture; DANCE_AUDIT explicitly reads the current baked track.
        const pose = sampleMotion(clip, Math.min(frame / fps, clip.duration), [])
        actor.apply(process.env.DANCE_AUDIT ? pose : [...pose])
        corrections.push(actor.group.userData.contactCorrections)
        frames.push(bones.flatMap(bone => [...bone.quaternion.toArray(), bone.scale.y]))
        wrists.push(['handL','handR'].flatMap(n => actor.group.getObjectByName(n).getWorldPosition(point).toArray()))
      }
      const output = { _comment:'// [DANCE-SWAP]', fps, duration:clip.duration, signature:actor.group.userData.bakeSignature, bones:bones.map(b=>b.name), frames, wrists, corrections, rest }
      fs.writeFileSync(path.join(out, `${name}-${sex === 1 ? 'bride':'groom'}-raw.json`), JSON.stringify(output))
      actor.dispose(); process.stdout.write(`captured ${name} ${sex}\n`)
    }
  }
} finally { await server.close() }
