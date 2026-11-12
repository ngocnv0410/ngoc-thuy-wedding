/** Optional Playwright review; use the dev fixture API key to include the guestbook. No writes. */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
const base = process.env.WEDDING_BASE || 'http://localhost:5180/'
const directory = process.env.REVIEW_DIR || 'output/heading-characters'
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: process.env.CHROMIUM_NO_SANDBOX === '1' ? ['--no-sandbox'] : [] })
const headings = [['details-title', 'calendar'], ['locations-title', 'map'], ['gallery-title', 'album'], ['wishes-title', 'letter'], ['gift-title', 'thanks']]
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    const errors = []; page.on('pageerror', e => errors.push(e.message))
    await page.addInitScript(() => sessionStorage.setItem('thiep-da-mo', '1'))
    await page.goto(base, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    assert.equal(await page.locator('[data-heading-character]').count(), 5)
    assert.equal(await page.locator('[data-section-title]').count(), 5)
    assert.equal(await page.locator('[data-section-title] .split-line').count(), 0, 'headings are never masked by text reveals')
    for (const [id, kind] of headings) {
      const title = page.locator(`#${id}`)
      const container = title.locator('xpath=ancestor::*[@data-heading-photo or @data-heading-fallback or self::header][1]')
      const actor = container.locator('[data-heading-character]')
      await actor.scrollIntoViewIfNeeded(); await page.waitForTimeout(300)
      const typography = await title.evaluate(e => { const s = getComputedStyle(e); return { size: parseFloat(s.fontSize), weight: Number(s.fontWeight), opacity: s.opacity, visibility: s.visibility, height: e.getBoundingClientRect().height, line: parseFloat(s.lineHeight), width: e.clientWidth, content: e.scrollWidth } })
      assert(typography.size >= 30 && typography.weight >= 600, `${id}: prominent typography`)
      assert.equal(typography.opacity, '1'); assert.equal(typography.visibility, 'visible')
      assert(typography.height <= typography.line * 1.2 && typography.content <= typography.width + 1, `${id}: one unclipped line`)
      assert.equal(await actor.count(), 1)
      assert.equal(await actor.locator('[data-story]').getAttribute('data-story'), kind)
      const sizes = await actor.locator('[data-chibi]').evaluateAll(nodes => nodes.map(e => getComputedStyle(e).getPropertyValue('--chibi-h').trim()))
      assert(sizes.every(size => size === '58px'), `${id}: consistent character height`)
      const t = await title.boundingBox(), a = await actor.boundingBox()
      assert(!(t.x < a.x + a.width && t.x + t.width > a.x && t.y < a.y + a.height && t.y + t.height > a.y), `${width} ${id}: character must not cover title`)
      await container.screenshot({ path: `${directory}/${id}-${width}.png` })
    }
    assert.equal(await page.locator('#loi-chuc [data-story]').count(), 1, 'guestbook actor is not duplicated')
    assert.equal(await page.locator('#album [data-photo-index]').count(), 6)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    assert.deepEqual(errors, [])
    console.log(`${width}px: all five headings have matching corner characters, no title overlap/duplicates/overflow`)
    await page.close()
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } })
  await page.addInitScript(() => sessionStorage.setItem('thiep-da-mo', '1'))
  await page.goto(base, { waitUntil: 'networkidle' })
  assert.equal(await page.locator('[data-section-title] .split-line').count(), 0, 'motion never masks headings')
  assert(await page.locator('[data-section-title]').evaluateAll(nodes => nodes.every(e => { const s = getComputedStyle(e); return s.opacity === '1' && s.visibility === 'visible' })), 'all titles are readable before entering the viewport')
  for (const [id] of headings) {
    const container = page.locator(`#${id}`).locator('xpath=ancestor::*[@data-heading-photo or @data-heading-fallback or self::header][1]')
    const stage = container.locator('[data-story]')
    await stage.scrollIntoViewIfNeeded(); await page.waitForTimeout(900)
    const poses = [], arms = []
    for (let i = 0; i < 14; i++) {
      poses.push(await stage.locator('[data-chibi]').evaluateAll(nodes => nodes.map(e => [getComputedStyle(e).transform, e.style.getPropertyValue('--body-y'), e.style.getPropertyValue('--leg-l'), e.style.getPropertyValue('--leg-r')])))
      arms.push(await stage.locator('path[data-arm]').evaluateAll(nodes => nodes.map(e => e.getAttribute('d')).join('|')))
      await page.waitForTimeout(350)
    }
    assert(poses.every(pose => JSON.stringify(pose) === JSON.stringify(poses[0])), `${id}: no bouncing or leg changes`)
    assert(arms.some(arm => arm !== arms[0]), `${id}: gesture animates`)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForFunction(() => document.documentElement.dataset.motion !== 'on')
    await page.waitForTimeout(300)
    const snapshot = () => stage.locator('path[data-arm]').evaluateAll(nodes => nodes.map(e => e.getAttribute('d')).join('|'))
    const before = await snapshot(); await page.waitForTimeout(300)
    assert(await snapshot() === before, `${id}: reduced motion is static`)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    console.log(`${id}: gesture animates without bouncing, reduced motion stays static`)
  }
  await page.close()
} finally { await browser.close() }
