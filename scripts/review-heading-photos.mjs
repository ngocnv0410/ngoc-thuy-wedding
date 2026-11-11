/** Optional Playwright review. Production preview at 4178; dev fixtures at 5173. No guestbook writes. */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
const directory = process.env.REVIEW_DIR || 'output/heading-photos'
const base = process.env.WEDDING_BASE || 'http://localhost:4178/'
const devBase = process.env.WEDDING_DEV_BASE || 'http://localhost:5173/'
await mkdir(directory,{recursive:true})
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:process.env.CHROMIUM_NO_SANDBOX === '1' ? ['--no-sandbox'] : []})
for(const width of [320,390,768,1440]) {
 const p=await b.newPage({viewport:{width,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message))
 await p.addInitScript(()=>sessionStorage.setItem('thiep-da-mo','1'))
 await p.goto(base,{waitUntil:'networkidle'})
 assert.equal(await p.locator('[data-heading-photo]').count(),3)
 for(const [id,title] of [['thong-tin','details-title'],['dia-diem','locations-title'],['mung-cuoi','gift-title']]) {
  const section=p.locator(`#${id}`),photo=section.locator('[data-heading-photo]')
  await photo.scrollIntoViewIfNeeded();await p.waitForTimeout(950)
  const metrics=await photo.evaluate((e,title)=>({width:e.clientWidth,height:e.clientHeight,top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,titleTop:document.getElementById(title).getBoundingClientRect().top,titleBottom:document.getElementById(title).getBoundingClientRect().bottom,img:(()=>{const i=e.querySelector('img[data-anim="heading-image"]');return i.complete&&i.naturalWidth>0})()}),title)
  assert(metrics.img,`${id}: photo loaded`)
  assert(metrics.titleTop>=metrics.top && metrics.titleBottom<=metrics.bottom,`${id}: title inside photo banner`)
  assert(metrics.width<=640)
  assert(metrics.height<=240)
  assert.equal(await photo.getByText('Ảnh mẫu',{exact:true}).count(),1)
  await p.screenshot({path:`${directory}/${id}-${width}.png`})
 }
 assert.equal(await p.locator('#album [data-heading-photo], #loi-chuc [data-heading-photo]').count(),0)
 assert.equal(await p.locator('#album [data-photo-index]').count(),6)
 assert(!/09:00|Giờ minh họa/.test(await p.locator('#dia-diem').innerText()))
 const botanical=p.locator('[data-corner] img').first()
 await botanical.scrollIntoViewIfNeeded();await p.waitForFunction(()=>[...document.querySelectorAll('[data-corner] img')].filter(i=>i.complete).every(i=>i.naturalWidth>0))
 assert.equal(await p.locator('img[src*="satin-"]').count(),0)
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
 await p.emulateMedia({reducedMotion:'reduce'})
 assert.equal(await p.locator('[data-heading-photo] img[data-anim="heading-image"]').first().evaluate(e=>getComputedStyle(e).animationName),'none')
 await p.screenshot({path:`${directory}/full-${width}.png`,fullPage:true})
 assert.deepEqual(errors,[])
 console.log(`${width}px: 3 photo-backed headings, overlay title placement, small album, no venue times, no overflow/errors OK`)
 await p.close()
}
// Browser-only fixtures exercise omitted, broken, and real-photo configurations; no Firebase writes.
for(const mode of ['omitted','broken','replacement']) {
 const p=await b.newPage({viewport:{width:390,height:900},reducedMotion:'reduce'})
 const errors=[];p.on('pageerror',e=>errors.push(e.message))
 const config=mode==='omitted'?'{}':mode==='broken'?`{'thong-tin':{image:{sources:{},img:{src:'/missing-heading-photo.webp',w:640,h:960}},alt:'Missing test photo'}}`:`{'thong-tin':{...sampleHeadingPhotos['thong-tin'],sample:false,focus:'50% 30%'}}`
 await p.route('**/src/content/page-content.ts*',r=>r.fulfill({contentType:'application/javascript',body:`import { wedding as saved } from '/src/content/wedding.ts';import { sampleGallery } from '/src/content/sample-gallery.ts';import { sampleHeadingPhotos } from '/src/content/heading-photos.ts';export const wedding={...saved,gallery:sampleGallery,headingPhotos:${config}};`}))
 await p.goto(`${devBase}#thong-tin`,{waitUntil:'networkidle'})
 await p.locator('#thong-tin').scrollIntoViewIfNeeded();await p.waitForTimeout(500)
 if(mode==='omitted'||mode==='broken') assert.equal(await p.locator('[data-heading-photo]').count(),0)
 else {assert.equal(await p.locator('[data-heading-photo]').count(),1);assert.equal(await p.locator('[data-heading-photo]').getByText('Ảnh mẫu',{exact:true}).count(),0)}
 assert(await p.locator('#details-title').isVisible())
 assert.deepEqual(errors,[])
 console.log(`${mode}: configuration fallback OK`)
 await p.close()
}
await b.close()
