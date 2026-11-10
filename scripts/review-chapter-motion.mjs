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
      const fixed = snapshots.map(sample => sample.map(({ arms: _arms, ...pose }) => pose))
      assert(fixed.every(sample => JSON.stringify(sample) === JSON.stringify(fixed[0])), `${kind}: no body bounce or leg changes`)
      assert(snapshots.some(sample => sample.some((actor, i) => actor.arms !== snapshots[0][i].arms)), `${kind}: gesture actually animates`)
      await page.screenshot({ path: `${directory}/${kind}-${width}.png` })
    }
    assert.deepEqual(danceRequests, [], 'original mode does not load dance sprites')
    for (const [mode, dance] of [['bangbangbang', 'bang-bang-bang'], ['bad', 'ateez-bad']]) {
      await page.goto(`${base}?music=${mode}`, { waitUntil: 'networkidle' })
      await page.locator(`#bia [data-dance-2d="${dance}"][data-ready="true"]`).waitFor()
      assert.equal(await page.locator('#thong-tin [data-story="calendar"]').count(), 1)
    }

    await page.getByRole('button', { name: 'Bật nhạc nền' }).click()
    await page.getByRole('button', { name: 'Chọn chế độ thiệp' }).click()
    for (const [label, dance] of [['BAD', 'ateez-bad'], ['BANG BANG', 'bang-bang-bang']]) {
      await page.getByRole('radio', { name: label, exact: true }).check()
      const canvas = `#bia [data-dance-2d="${dance}"][data-ready="true"] canvas`
      await page.waitForFunction(selector => Number(document.querySelector(selector)?.dataset.frame) > 0, canvas)
      const frame = await page.locator(canvas).getAttribute('data-frame')
      await page.waitForFunction(({ selector, frame }) => {
        const next = document.querySelector(selector)?.dataset.frame
        return next !== undefined && next !== frame
      }, { selector: canvas, frame })
    }
    await page.getByRole('radio', { name: 'Nguyên bản' }).check()
    await page.locator('#bia [data-story="welcome"]').waitFor()
    assert.equal(await page.locator('[data-dance-2d]').count(), 0)
    assert.deepEqual(errors, [])
    console.log(`${width}px: chapter gestures, dance links, and mode switches during playback OK`)
    await page.close()
  }
} finally { await browser.close() }
