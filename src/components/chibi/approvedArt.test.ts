import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Chibi, ChibiFigure } from './Chibi'
import { PropArt } from './ChibiProp'

describe('approved artwork with the original animation rig', () => {
  it('keeps independent joints, expressions and held objects instead of a flat pose', () => {
    const carry = renderToStaticMarkup(createElement(Chibi, { who: 'bride', pose: 'carry', held: createElement(PropArt, { kind: 'envelope' }) }))
    expect(carry).toContain('bride-dress-layer.webp')
    expect(carry).toContain('data-seamless-arms')
    expect(carry).toContain('data-part="arm-l"')
    expect(carry).toContain('data-part="arm-r"')
    expect(carry).toContain('data-part="head"')
    expect(carry).toContain('data-part="eyes-closed"')
    expect(carry).toContain('data-part="eyes-happy"')
    expect(carry).toContain('data-part="skirt"')
    expect(carry).toContain('data-part="veil"')
    expect(carry).toContain('--pose-arm-l:70deg')
    expect(carry).toContain('data-chibi-style="approved"')
    expect(carry).toContain('<rect') // Actual envelope remains attached to the hand.
  })
  it('supports embedding the same animated rig and map inside another SVG', () => {
    const figure = renderToStaticMarkup(createElement('svg', null, createElement(ChibiFigure, { who: 'groom', held: createElement(PropArt, { kind: 'map' }) })))
    expect(figure).toContain('groom-stand.webp')
    expect(figure).toContain('data-part="leg-l"')
    expect(figure).toContain('data-part="leg-r"')
    expect(figure).toContain('<image')
    expect(figure).toContain('<path')
  })
  it('uses painted eye states and keeps raised bridal hands above the head layer', () => {
    const bride = renderToStaticMarkup(createElement('svg', null, createElement(ChibiFigure, { who: 'bride', held: createElement(PropArt, { kind: 'envelope' }) })))
    expect(bride).toContain('bride-open-face.webp')
    expect(bride).toContain('bride-closed-face.webp')
    expect(bride).toContain('bride-happy-face.webp')
    expect(bride).toContain('data-seamless-arms')
    expect(bride).toContain('data-surface="skin"')
    expect(bride).toContain('data-held="l"')
    expect(bride).not.toContain('data-joint-cap')
    expect(bride.indexOf('data-part="arm-r"')).toBeGreaterThan(bride.indexOf('data-part="head"'))
  })

})
