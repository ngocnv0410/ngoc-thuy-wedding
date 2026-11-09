/** Build six original stationery compositions using the approved, unchanged character layers. */
import { readFile, mkdir } from 'node:fs/promises'
import sharp from 'sharp'
const out = new URL('../src/assets/gallery-samples/', import.meta.url)
await mkdir(out, { recursive: true })
const raster = async (name) => `data:image/png;base64,${(await sharp(await readFile(new URL(`../src/assets/chibi/approved/${name}.webp`, import.meta.url))).png().toBuffer()).toString('base64')}`
const groom = await raster('groom-stand'), bride = await raster('bride-stand')
const pair = `<ellipse cx="480" cy="1015" rx="280" ry="24" fill="#b5a184" opacity=".15"/><image xlink:href="${groom}" x="185" y="370" width="315" height="640"/><image xlink:href="${bride}" x="470" y="370" width="315" height="640"/>`
const blossom = (x,y,r=1) => `<g transform="translate(${x} ${y}) scale(${r})">${[0,72,144,216,288].map(a=>`<ellipse rx="16" ry="30" cy="-18" fill="#e4bdb4" transform="rotate(${a})"/>`).join('')}<circle r="9" fill="#b69c67"/></g>`
const sprig = (x,y,flip=1) => `<g transform="translate(${x} ${y}) scale(${flip} 1)" stroke="#809079" stroke-width="5" fill="#a4ae91"><path d="M0 240Q90 100 60 0" fill="none"/>${[30,80,130,180].map((v,i)=>`<ellipse cx="${i%2?55:22}" cy="${v}" rx="16" ry="38" transform="rotate(${i%2?35:-40} ${i%2?55:22} ${v})"/>`).join('')}</g>`
const ring = `<ellipse cx="410" cy="620" rx="115" ry="145" fill="none" stroke="#be9956" stroke-width="18" transform="rotate(-20 410 620)"/><ellipse cx="555" cy="620" rx="115" ry="145" fill="none" stroke="#d1b374" stroke-width="18" transform="rotate(20 555 620)"/><path d="M507 458l48-46 48 46-48 50Z" fill="#fffdf5" stroke="#be9956" stroke-width="5"/>`
const scenes = [
 ['garden','#edf1e6', `${sprig(85,570)}${sprig(875,550,-1)}<path d="M180 1010V410a300 300 0 0 1 600 0v600" fill="none" stroke="#b5bb9d" stroke-width="3"/>${pair}${blossom(160,970)}${blossom(820,1000,.7)}`],
 ['letter','#f5e6e0', `<path d="M140 950Q480 760 830 1000" fill="none" stroke="#dbc1b4" stroke-width="90" opacity=".4"/><g transform="rotate(-9 480 640)"><rect x="180" y="440" width="600" height="390" rx="10" fill="#fff9ee" stroke="#b79d78" stroke-width="3"/><path d="M180 440l300 245 300-245M180 830l210-200m390 200L570 630" fill="none" stroke="#d1bda2" stroke-width="3"/><circle cx="480" cy="650" r="45" fill="#b98376"/><path d="M460 646q-5-25 20-9 25-16 20 9l-20 22Z" fill="#f8e8cf"/></g>${sprig(130,240)}${blossom(760,870)}`],
 ['flowers','#f0eadc', `<path d="M480 900Q250 580 290 360M480 900Q650 580 660 320M480 900V350" fill="none" stroke="#89977f" stroke-width="12"/>${[ [290,360,1.6],[660,320,1.5],[480,350,2],[360,510,1.8],[610,500,1.9],[470,580,1.8]].map(([x,y,r])=>blossom(x,y,r)).join('')}<path d="M360 760q120 50 240 0l-30 270-90-50-90 50Z" fill="#e9d6c0"/><path d="M360 790q120 50 240 0" stroke="#bd9e77" stroke-width="12" fill="none"/>${sprig(160,650)}${sprig(800,650,-1)}`],
 ['arch','#f5ebdc', `<path d="M140 1020V390a340 340 0 0 1 680 0v630" fill="none" stroke="#b6a278" stroke-width="8"/>${pair}${blossom(150,340,1.3)}${blossom(210,205,1.2)}${blossom(320,100,1.1)}${blossom(800,340,1.3)}${sprig(120,740)}${sprig(850,720,-1)}`],
 ['rings','#efe5da', `<path d="M-80 950Q450 200 1040 900" fill="none" stroke="#fff8ef" stroke-width="180"/><path d="M-80 920Q450 170 1040 870" fill="none" stroke="#e5d3bc" stroke-width="3"/>${ring}${sprig(150,800)}${blossom(760,360,1.4)}${blossom(810,430,.7)}`],
 ['moon','#e1e6e5', `<circle cx="490" cy="300" r="160" fill="#fff4d6" opacity=".85"/>${Array.from({length:18},(_,i)=>`<circle cx="${60+(i*173)%840}" cy="${80+(i*127)%670}" r="${i%3+2}" fill="#fff9e8"/>`).join('')}<path d="M0 1010Q480 850 960 1010V1200H0Z" fill="#c0cab7"/>${pair}${sprig(80,850)}${sprig(870,850,-1)}`],
]
for (const [name,bg,art] of scenes) {
 const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="960" height="1200" viewBox="0 0 960 1200"><rect width="960" height="1200" fill="${bg}"/><rect x="32" y="32" width="896" height="1136" rx="440" fill="none" stroke="#ac9671" opacity=".35"/>${art}</svg>`
 await sharp(Buffer.from(svg)).webp({quality:88}).toFile(new URL(`${name}.webp`,out).pathname)
}
