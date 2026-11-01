// Optional visual regression runner; see docs/approved-character-design.md.
import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';import sharp from 'sharp';
const base=process.env.WEDDING_BASE||'http://localhost:4173';const dir=process.env.REVIEW_DIR||'/tmp/wedding-character-review';fs.mkdirSync(dir,{recursive:true});
const launch={...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),headless:true,args:[...(process.env.CHROMIUM_NO_SANDBOX?['--no-sandbox']:[]),'--use-angle=swiftshader','--enable-unsafe-swiftshader']};if(base.startsWith('https:'))launch.proxy={server:process.env.HTTPS_PROXY};
const b=await chromium.launch(launch);const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,recordVideo:{dir,size:{width:390,height:844}}});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
try{
await p.goto(base+'/');await p.getByRole('button',{name:'Mở thiệp',exact:true}).waitFor();
const css=await p.locator('link[rel=stylesheet]').first().getAttribute('href');const html=await p.locator('#opening [data-chibi]').evaluateAll(es=>es.map(e=>e.outerHTML));
assert.equal(html.length,2);assert.ok(html.find(s=>s.includes('bride-dress-layer')));
await p.getByRole('button',{name:'Mở thiệp',exact:true}).click();await p.getByRole('dialog').waitFor({state:'detached'});await p.waitForTimeout(1000);await p.screenshot({path:dir+'/cover.png'});
await p.evaluate(()=>scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(400);
await p.waitForFunction(()=>parseFloat(getComputedStyle(document.querySelector('[data-anim="bye-groom"]')).getPropertyValue('--arm-l'))>115,null,{timeout:20000});await p.screenshot({path:dir+'/groom-wave.png'});
await p.waitForFunction(()=>parseFloat(getComputedStyle(document.querySelector('[data-anim="bye-bride"]')).getPropertyValue('--arm-r'))>115,null,{timeout:20000});await p.screenshot({path:dir+'/bride-wave.png'});
await p.waitForFunction(()=>getComputedStyle(document.querySelector('[data-anim="bye-bride"] [data-part="heart"]')).opacity==='1',null,{timeout:15000});await p.screenshot({path:dir+'/heart.png'});
assert.deepEqual(errors,[]);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await c.close();
const proof=await b.newPage({viewport:{width:600,height:470}});const results={base,errors,poses:{}};
for(const pose of ['rest','hold','wave','tilt','bow','heart']){
 await proof.setContent(`<base href="${base}/"><link rel="stylesheet" href="${css}"><style>html,body{margin:0;background:transparent!important}.pair{display:flex;justify-content:center;padding-top:15px;gap:12px}.pair>[data-chibi]{position:static!important;display:inline-block!important;width:240px!important;height:400px!important;opacity:1!important;visibility:visible!important;transform:none!important}.pair svg{overflow:visible}</style><div class="pair">${html.join('')}</div>`);
 await proof.locator('[data-chibi]').evaluateAll((es,pose)=>{es.forEach(e=>{for(const key of [...e.style])if(key.startsWith('--')&&!key.startsWith('--pose-'))e.style.removeProperty(key);const groom=e.dataset.chibi==='groom';for(const [k,v]of Object.entries({'--body-y':'0px','--upper-y':pose==='bow'?'7px':'0px','--upper-sy':pose==='bow'?'.93':'1','--upper-r':'0deg','--head-y':pose==='bow'?'5px':'0px','--head-r':pose==='tilt'?(groom?'8deg':'-8deg'):'0deg','--face-x':'0px','--eo':pose==='rest'?'1':'0','--ec':pose==='bow'?'1':'0','--eh':['heart','wave','hold'].includes(pose)?'1':'0','--arm-l':pose==='heart'?'-30deg':pose==='hold'&&!groom?'50deg':'6deg','--arm-r':pose==='wave'?'130deg':pose==='heart'?'-30deg':pose==='hold'&&groom?'50deg':'6deg','--heart':pose==='heart'?'1':'0'}))e.style.setProperty(k,v)})},pose);
 await proof.waitForTimeout(300);
 const bounds={};
 for(const who of ['groom','bride']){
 const loc=proof.locator(`[data-chibi="${who}"] > svg`);const buf=await loc.screenshot({omitBackground:true});fs.writeFileSync(dir+`/${pose}-${who}.png`,buf);const {data,info}=await sharp(buf).ensureAlpha().raw().toBuffer({resolveWithObject:true});let top=info.height,bottom=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>180){top=Math.min(top,y);bottom=Math.max(bottom,y)}
 bounds[who]={top,bottom};
 if(who==='groom')for(let y=198;y<=214;y++){let opaque=0;for(let x=118;x<=122;x++)if(data[(y*info.width+x)*4+3]>200)opaque++;assert.ok(opaque>=3,`Neck continuity: ${pose} y=${y}`)}
 }
 assert.ok(Math.abs(bounds.groom.bottom-bounds.bride.bottom)<=2,`Shared ground ${pose}: ${JSON.stringify(bounds)}`);
 assert.ok(bounds.bride.top>=bounds.groom.top+10,`Bride height ${pose}: ${JSON.stringify(bounds)}`);
 results.poses[pose]=bounds;
 await proof.addStyleTag({content:'html,body{background:#fffaf2!important}'});await proof.screenshot({path:dir+`/pair-${pose}.png`});
}
// A static bride with arms/head hidden must contain only white fabric, not baked-in skin limbs.
await proof.locator('[data-chibi="groom"]').evaluate(e=>e.remove());await proof.addStyleTag({content:'html,body{background:transparent!important}[data-part="arm-l"],[data-part="arm-r"],[data-part="head"],[data-part="neck"],[data-part="shoulders"],[data-part="upper"]>ellipse,[data-part="heart"]{visibility:hidden!important}'});
const fabric=await proof.locator('[data-chibi="bride"] > svg').screenshot({omitBackground:true});const {data}=await sharp(fabric).ensureAlpha().raw().toBuffer({resolveWithObject:true});let skin=0;for(let i=0;i<data.length;i+=4){const[r,g,bl,a]=data.subarray(i,i+4);if(a>150&&r>180&&r/g>1.12&&g/bl>1.06)skin++}assert.equal(skin,0);results.staticFabricSkinPixels=skin;
fs.writeFileSync(dir+'/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));await proof.close();
}finally{await b.close()}
