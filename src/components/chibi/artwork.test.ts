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
  it('reserves the standing bride image for exactly two animated arms', () => {
    const html = renderToStaticMarkup(createElement(ApprovedChibiFigure, { who: 'bride' }))
    expect(html.match(/bride-stand.webp/g)).toHaveLength(2)
    expect(html.match(/bride-dress-layer.webp/g)).toHaveLength(2)
    expect(html.match(/bride-veil-layer.webp/g)).toHaveLength(1)
    expect(html.match(/data-part="arm-[lr]"/g)).toHaveLength(2)
  })
  it('overlaps the groom chin and collar with a real neck layer', () => {
    const chin = faceArt.groom.y + faceArt.groom.height
    expect(neckPlacement.y).toBeLessThan(chin - 3)
    expect(neckPlacement.y + neckPlacement.height).toBeGreaterThan(107)
    const html = renderToStaticMarkup(createElement(ApprovedChibiFigure, { who: 'groom' }))
    expect(html).toContain('data-part="neck"')
    expect(html.indexOf('data-part="neck"')).toBeLessThan(html.indexOf('data-part="head"'))
  })
  it('grounds the bridal hem at the same y coordinate as the groom feet', () => {
    expect(brideDressPlacement.y + brideDressPlacement.height).toBe(GROUND - 1)
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
