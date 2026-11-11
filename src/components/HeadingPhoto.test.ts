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
