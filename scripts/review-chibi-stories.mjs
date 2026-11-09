/** Optional browser regression. Run the local dev server with VITE_FIREBASE_API_KEY=local-visual-fixture.
 * Uses a browser-intercepted guestbook service; no Firebase messages are sent.
 * npm install --no-save --package-lock=false playwright
 * CHROMIUM_PATH=/usr/bin/chromium node scripts/review-chibi-stories.mjs
 */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: process.env.CHROMIUM_NO_SANDBOX === '1' ? ['--no-sandbox'] : [] })
const base = process.env.WEDDING_BASE || 'http://localhost:5173/'
const directory = process.env.REVIEW_DIR || 'output/chibi-stories'
await mkdir(directory, { recursive: true })
try {
  for (const width of [390, 1440]) for (const state of ['loading', 'ready', 'existing', 'sent', 'error']) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    const wish = { id: 'local-only', name: 'Khách kiểm tra', message: 'Lời chúc giả lập chỉ trong trình duyệt.', createdAt: 1794200000000 }
    await page.route('**/src/lib/wishes.ts*', route => route.fulfill({ contentType: 'application/javascript', body: `
      const wish = ${JSON.stringify(wish)};
      export function watchWishes(cb, error) { ${state === 'loading' ? '' : state === 'error' ? 'error(new Error("local fixture"))' : `cb(${state === 'existing' ? '[wish]' : '[]'}, false)`}; return () => {} }
      export function watchGuestWish(cb, error) { ${state === 'loading' ? '' : state === 'error' ? 'error(new Error("local fixture"))' : `cb(${state === 'existing' ? 'wish' : 'null'})`}; return () => {} }
      export async function sendWish(draft) { return { alreadySent: false, wish: { ...wish, ...draft } } }
    ` }))
    await page.goto(`${base}#loi-chuc`, { waitUntil: 'networkidle' })
    await page.locator('#loi-chuc').scrollIntoViewIfNeeded()
    if (state === 'sent') {
      await page.getByLabel('Tên của bạn').fill(wish.name)
      await page.getByLabel('Lời chúc', { exact: true }).fill(wish.message)
      await page.getByRole('button', { name: 'Gửi lời chúc', exact: true }).click()
      await page.getByRole('heading', { name: 'Đã gửi lời chúc', exact: true }).waitFor()
    } else if (state === 'existing') await page.getByRole('heading', { name: 'Bạn đã gửi lời chúc rồi', exact: true }).waitFor()
    else if (state === 'ready') await page.getByLabel('Tên của bạn').waitFor()
    else if (state === 'loading') await page.getByText('Đang kiểm tra lời chúc của bạn…', { exact: true }).waitFor()
    else await page.getByRole('button', { name: 'Thử lại kết nối' }).waitFor()
    const scene = page.locator('#loi-chuc')
    assert.equal(await scene.locator('[data-story]').count(), 1, `${state}: exactly one stage`)
    assert.equal(await scene.locator('[data-chibi]').count(), 1, `${state}: exactly one character`)
    const stage = scene.locator('[data-story]')
    await stage.scrollIntoViewIfNeeded()
    await page.waitForTimeout(950)
    const paths = () => stage.locator('path[data-arm]').evaluateAll(nodes => nodes.map(node => node.getAttribute('d')).join('|'))
    const before = await paths()
    await page.waitForTimeout(1900)
    assert.notEqual(await paths(), before, `${state}: articulated arm geometry changes`)
    await page.screenshot({ path: `${directory}/${state}-${width}.png` })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    assert.equal(overflow, false, 'no horizontal page overflow')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForTimeout(100)
    const reduced = await paths()
    await page.waitForTimeout(250)
    assert.equal(await paths(), reduced, 'reduced motion is static')
    assert.equal(await stage.locator('[data-anim="story-letter"]').isVisible(), false, 'flight hidden in reduced motion')
    assert.deepEqual(errors, [])
    console.log(`${state} ${width}px: one character, arm motion, reduced motion, overflow OK`)
    await page.close()
  }
} finally { await browser.close() }
