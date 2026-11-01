import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Chibi, ChibiFigure } from './Chibi'
import { PropArt } from './ChibiProp'

describe('approved 2D character artwork', () => {
  it('uses the approved carry and heart artwork in the existing component API', () => {
    const carry = renderToStaticMarkup(createElement(Chibi, { who: 'bride', pose: 'carry', held: createElement(PropArt, { kind: 'envelope' }) }))
    const heart = renderToStaticMarkup(createElement(Chibi, { who: 'groom', pose: 'heart' }))
    expect(carry).toContain('bride-carry.webp')
    expect(heart).toContain('groom-heart.webp')
    expect(carry).toContain('loading="lazy"')
    expect(carry).toContain('data-chibi-style="approved"')
    expect(carry).not.toContain('<path')
  })
  it('embeds the same approved character inside SVG maps while retaining the held map', () => {
    const figure = renderToStaticMarkup(createElement('svg', null, createElement(ChibiFigure, { who: 'groom', held: createElement(PropArt, { kind: 'map' }) })))
    expect(figure).toContain('groom-stand.webp')
    expect(figure).toContain('<image')
    expect(figure).toContain('data-chibi-style="approved"')
    expect(figure).toContain('<path')
  })
})
