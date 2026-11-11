import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { HeadingPhotoContent } from '../content/types'
import { HeadingPhoto } from './HeadingPhoto'

const photo: HeadingPhotoContent = {
  image: { sources: { webp: '/wedding.webp 480w' }, img: { src: '/wedding.webp', w: 480, h: 600 } },
  alt: 'Ngọc và Thủy bên nhau', focus: '50% 35%', sample: true,
}

describe('optional heading photography', () => {
  it('renders no empty frame when a section has no configured photo', () => {
    expect(renderToStaticMarkup(createElement(HeadingPhoto, {}))).toBe('')
  })
  it('preserves the real heading when no background photo is configured', () => {
    const heading = createElement('h2', { id: 'section-title' }, 'Địa điểm lễ cưới')
    const markup = renderToStaticMarkup(createElement(HeadingPhoto, { heading }))
    expect(markup).toBe('<h2 id="section-title">Địa điểm lễ cưới</h2>')
    expect(markup).not.toContain('data-heading-photo')
  })
  it('renders one accessible heading inside the photo banner', () => {
    const heading = createElement('h2', { id: 'section-title' }, 'Địa điểm lễ cưới')
    const markup = renderToStaticMarkup(createElement(HeadingPhoto, { photo, heading }))
    expect(markup).toContain('data-heading-overlay="true"')
    expect(markup.match(/id="section-title"/g)).toHaveLength(1)
    expect(markup.indexOf('data-heading-photo')).toBeLessThan(markup.indexOf('id="section-title"'))
  })
  it('keeps sample labeling, accessible alt text and the configured face crop', () => {
    const markup = renderToStaticMarkup(createElement(HeadingPhoto, { photo }))
    expect(markup).toContain('Ảnh mẫu')
    expect(markup).toContain('Ngọc và Thủy bên nhau')
    expect(markup).toContain('object-position:50% 35%')
    expect(markup).not.toContain('<figcaption')
  })
  it('removes the temporary badge for a real photo without losing its image', () => {
    const markup = renderToStaticMarkup(createElement(HeadingPhoto, { photo: { ...photo, sample: false } }))
    expect(markup).not.toContain('Ảnh mẫu')
    expect(markup).toContain('/wedding.webp')
  })
})
