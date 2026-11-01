import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { resolve } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ApprovedChibiFigure } from './ApprovedChibiFigure'
import { brideDressPlacement, neckPlacement } from './approvedRigLayout'
import { faceArt } from './faceArt'
import { GROUND } from './chibiArt'

describe('connected wedding character layers', () => {
  it('uses continuous bridal arms without reintroducing skin from the standing portrait', () => {
    const html = renderToStaticMarkup(createElement('svg', null, createElement(ApprovedChibiFigure, { who: 'bride' })))
    expect(html).not.toContain('bride-stand.webp')
    expect(html.match(/bride-dress-layer.webp/g)).toHaveLength(2)
    expect(html.match(/bride-veil-layer.webp/g)).toHaveLength(1)
    expect(html.match(/data-part="arm-[lr]"/g)).toHaveLength(2)
    expect(html).not.toContain('data-joint-cap')
  })
  it('overlaps the groom chin and collar with a real neck layer', () => {
    const chin = faceArt.groom.y + faceArt.groom.height
    expect(neckPlacement.y).toBeLessThan(chin - 3)
    expect(neckPlacement.y + neckPlacement.height).toBeGreaterThan(107)
    const html = renderToStaticMarkup(createElement('svg', null, createElement(ApprovedChibiFigure, { who: 'groom' })))
    expect(html).toContain('data-part="neck"')
    expect(html.indexOf('data-part="neck"')).toBeLessThan(html.indexOf('data-part="head"'))
  })
  it('grounds the bridal hem at the same y coordinate as the groom feet', () => {
    expect(brideDressPlacement.y + brideDressPlacement.height).toBe(GROUND - 1)
  })
  it('removes the standing portrait arm shadows from both sides of the groom abdomen', async () => {
    const portrait = (await sharp(resolve('src/assets/chibi/approved/groom-stand.webp')).png().toBuffer()).toString('base64')
    const html = renderToStaticMarkup(createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 480, height: 800, viewBox: '0 0 120 200' }, createElement(ApprovedChibiFigure, { who: 'groom' })))
      .replace(/href="[^\"]*groom-stand\.webp"/g, `href="data:image/png;base64,${portrait}"`)
    const { data, info } = await sharp(Buffer.from(html)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    for (const x of [42, 78]) for (let y = 120; y <= 140; y++) {
      const index = (y * 4 * info.width + x * 4) * 4
      expect(data[index], `coat shadow at ${x},${y}`).toBeGreaterThan(110)
      expect(data[index + 3]).toBeGreaterThan(240)
    }
  })
  for (const kind of ['dress', 'veil']) it(`keeps skin and ghost arms out of the static ${kind} asset`, async () => {
    const { data, info } = await sharp(resolve('src/assets/chibi/approved', `bride-${kind}-layer.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    let skin = 0, opaque = 0
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b, a] = data.subarray(i, i + 4)
      if (a < 160) continue
      opaque++
      if (r > 180 && r / g > 1.12 && g / b > 1.06) skin++
    }
    expect(opaque).toBeGreaterThan(info.width * info.height * .1)
    expect(skin / opaque).toBeLessThan(.001)
  })
})
