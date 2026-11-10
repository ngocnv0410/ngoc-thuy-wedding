/** Optional browser check; uses the production preview and never sends a guestbook message. */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: process.env.CHROMIUM_NO_SANDBOX === '1' ? ['--no-sandbox'] : [] })
const base = process.env.WEDDING_BASE || 'http://localhost:4174/'
const directory = process.env.REVIEW_DIR || 'output/chapter-motion'
await mkdir(directory, { recursive: true })
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const errors = [], danceRequests = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => { if (/\/dance\//.test(request.url())) danceRequests.push(request.url()) })
    await page.addInitScript(() => sessionStorage.setItem('thiep-da-mo', '1'))
    await page.goto(base, { waitUntil: 'networkidle' })
    for (const [id, expected] of [['bia', 'welcome'], ['thong-tin', 'calendar'], ['dia-diem', 'map']]) {
      assert.equal(await page.locator(`#${id} [data-story]`).first().getAttribute('data-story'), expected)
    }
    assert.equal(await page.locator('#album [data-story]').count(), 0, 'album has no chapter characters')
    assert.equal(await page.locator('#album [data-film], #album [id^=chapter-]').count(), 0, 'album has no chapters or film track')
    assert.equal(await page.locator('[data-story="gift"]').count(), 2)
    for (const kind of ['welcome', 'calendar', 'map', 'gift']) {
      const stage = page.locator(`[data-story="${kind}"]`).first()
      await stage.scrollIntoViewIfNeeded()
      await page.waitForTimeout(900)
      const snapshots = []
      for (let i = 0; i < 16; i++) {
        snapshots.push(await stage.locator('[data-chibi]').evaluateAll(nodes => nodes.map(node => ({
          transform: getComputedStyle(node).transform,
          body: node.style.getPropertyValue('--body-y'),
          legs: [node.style.getPropertyValue('--leg-l'), node.style.getPropertyValue('--leg-r')],
          arms: [...node.querySelectorAll('path[data-arm]')].map(path => path.getAttribute('d')).join('|'),
        }))))
        await page.waitForTimeout(250)
      }
      const fixed = snapshots.map(sample => sample.map(({ arms, ...pose }) => pose))
      assert(fixed.every(sample => JSON.stringify(sample) === JSON.stringify(fixed[0])), `${kind}: no body bounce or leg changes`)
      assert(snapshots.some(sample => sample.some((actor, i) => actor.arms !== snapshots[0][i].arms)), `${kind}: gesture actually animates`)
      await page.screenshot({ path: `${directory}/${kind}-${width}.png` })
    }
    // Existing soundtrack URLs keep their audio, but never mount dancing sprites.
    for (const mode of ['bangbangbang', 'bad']) {
      await page.goto(`${base}?music=${mode}`, { waitUntil: 'networkidle' })
      assert.equal(await page.locator('#bia [data-story="welcome"]').count(), 1)
      assert.equal(await page.locator('[data-dance-2d]').count(), 0)
      assert.equal(await page.locator('[data-dance]').count(), 0)
    }
    assert.deepEqual(danceRequests, [])
    assert.deepEqual(errors, [])
    console.log(`${width}px: chapter-specific gestures, fixed feet, old audio URLs, no sprite requests OK`)
    await page.close()
  }
} finally { await browser.close() }
