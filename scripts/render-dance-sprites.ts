/** Offline renderer: image layers and articulated silhouettes, no 3D runtime. */
import sharp from 'sharp'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { createDanceSampler } from '../src/components/chibi/danceSampler.ts'

const root = new URL('../', import.meta.url)
const asset = async (name: string) => `data:image/png;base64,${(await sharp(await readFile(new URL(name === 'bride-dress-layer' ? 'src/assets/chibi/dance/bride-dress.png' : `src/assets/chibi/approved/${name}.webp`, root))).resize({width:320,withoutEnlargement:true}).png().toBuffer()).toString('base64')}`
const art = Object.fromEntries(await Promise.all(['bride-open-face','groom-open-face','bride-dress-layer','bride-veil-layer','groom-stand'].map(async n => [n, await asset(n)])))
const image = (name: string, x: number, y: number, w: number, h: number) => `<image xlink:href="${art[name]}" x="${x}" y="${y}" width="${w}" height="${h}"/>`
function figure(p: Record<string,string>, bride: boolean) {
  const n = (key: string) => parseFloat(p[`--${key}`] || '0')
  const limb = (side: string, leg = false) => {
    const upper = n(`${leg?'leg':'arm'}-${side}`), lower = n(`${leg?'knee':'elbow'}-${side}`)
    const a = n(`${leg?'leg':'arm'}-upper-${side}-length`) * (leg ? 1 : .66)
    const b = n(`${leg?'leg':'arm'}-lower-${side}-length`) * (leg ? 1 : .66)
    const x = leg ? (side==='l'?53:67) : (side==='l'?43:77), y=leg?150:108
    const width = leg?12:bride?6.5:10
    const fill=bride?'url(#skin)':'url(#suit)'
    const radians = lower * Math.PI / 180
    const dx = -Math.sin(radians), dy = Math.cos(radians)
    const wristX = dx*b, wristY = a+dy*b
    const radius = Math.min(4, a*.2, b*.2)
    // One rounded silhouette through the joint, with a short curved elbow/knee.
    const line = `M0 0L0 ${a-radius}Q0 ${a} ${dx*radius} ${a+dy*radius}L${wristX} ${wristY}`
    const end = leg
      ? `<g transform="translate(${wristX} ${wristY}) rotate(${-upper})"><path d="M-5-3Q-1-5 4-2L8 0Q10 4 6 4H-6Q-8 1-5-3Z" fill="${bride?'#fff7ed':'#50382c'}"/><path d="M-5 3H7" stroke="${bride?'#e3d4c3':'#34271f'}" stroke-width="1.2"/></g>`
      : `<g transform="translate(${wristX} ${wristY}) rotate(${lower})">${bride?'':'<path d="M-4-3H4V0H-4Z" fill="#fff8ed"/>'}<path d="M-2.8-1Q-4 1-3 4L-1 6Q1 7 3 5L3.5 1Q5.8 0 4-2Q3-3 2 0L2-1Z" fill="url(#skin)"/><path d="M-.8 2L-.3 4M1 2L1.3 4" stroke="#d5a58b" stroke-width=".45" stroke-linecap="round"/></g>`
    return `<g transform="translate(${x} ${y}) rotate(${upper})"><path d="${line}" fill="none" stroke="${fill}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/><path d="${line}" transform="translate(-1.4 0)" fill="none" stroke="${bride?'#fff5e8':'#e5d2bd'}" opacity=".22" stroke-width="1" stroke-linecap="round"/>${end}</g>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="256" height="384" viewBox="-30 -30 180 270"><defs><linearGradient id="skin" gradientUnits="userSpaceOnUse" x1="-5" x2="5"><stop stop-color="#eabda5"/><stop offset=".45" stop-color="#ffe6d4"/><stop offset="1" stop-color="#efc5ac"/></linearGradient><linearGradient id="suit" gradientUnits="userSpaceOnUse" x1="-7" x2="7"><stop stop-color="#70574b"/><stop offset=".45" stop-color="#a18a7b"/><stop offset="1" stop-color="#7e6658"/></linearGradient><clipPath id="skirt"><rect x="0" y="125" width="120" height="80"/></clipPath><clipPath id="bodice"><rect x="0" y="95" width="120" height="31"/></clipPath><clipPath id="coat"><path d="M45 101L54 98H66L76 104L79 151Q60 155 41 151Z"/></clipPath></defs><ellipse cx="60" cy="195" rx="38" ry="5" fill="#765647" opacity=".12"/><g transform="translate(${n('lean-x')} ${n('body-y')})"><g transform="rotate(${n('hip-r')} 60 150)">${limb('l',true)}${limb('r',true)}${bride?`<g transform="rotate(${n('skirt')} 60 125)"><g clip-path="url(#skirt)">${image('bride-dress-layer',4,99,112,95)}</g></g>`:''}<g transform="rotate(${n('upper-r')} 60 150)">${bride?`<g transform="rotate(${n('veil')} 60 92)"><path d="M43 88Q60 93 77 88L110 160Q60 180 10 160Z" fill="#fffdf8" opacity=".3"/></g>`:''}<path d="M54 93H66V115H54Z" fill="url(#skin)"/>${bride?`<g clip-path="url(#bodice)">${image('bride-dress-layer',4,99,112,95)}</g>`:`<g clip-path="url(#coat)">${image('groom-stand',0,0,120,200)}</g>`}${limb('l')}${limb('r')}<g transform="rotate(${n('head-r')} 60 98)">${bride?image('bride-open-face',19,16,82,81):image('groom-open-face',15,10,89,94)}</g></g></g></g></svg>`
}
for (const [id, file, duration] of [['ateez-bad','badReferenceDance.json',27.4],['bang-bang-bang','referenceDance.json',28.444444]] as const) {
  const reference = JSON.parse(await readFile(new URL(`src/components/chibi/${file}`, root),'utf8'))
  const sample = createDanceSampler(reference)
  const dir = new URL(`public/dance/${id}/`, root); await mkdir(dir,{recursive:true})
  const clip = { fps:15, duration, frameCount:Math.ceil(duration*15), width:256,height:384,columns:4,perAtlas:16,actors:{bride:[] as string[],groom:[] as string[]} }
  for (const who of ['bride','groom'] as const) {
    for(let start=0;start<clip.frameCount;start+=16) {
      const cells=[]
      for(let i=0;i<16 && start+i<clip.frameCount;i++) cells.push({input:await sharp(Buffer.from(figure(sample((start+i)/15),who==='bride'))).png().toBuffer(),left:i%4*256,top:Math.floor(i/4)*384})
      const name=`${who}-${start/16}.webp`
      await sharp({create:{width:1024,height:1536,channels:4,background:'#00000000'}}).composite(cells).webp({quality:85,alphaQuality:100}).toFile(new URL(name,dir).pathname)
      clip.actors[who].push(name)
    }
  }
  await writeFile(new URL('manifest.json',dir),JSON.stringify(clip))
  console.log(`${id}: ${clip.frameCount} frames per actor`)
}
