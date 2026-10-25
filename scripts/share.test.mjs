import { describe, expect, it } from 'vitest'
import { share, shareImageVersion, shareMetaTags, versionedShareImage } from './share.ts'

describe('social preview metadata', () => {
  it('publishes an absolute versioned JPEG for Open Graph and Twitter before JavaScript runs', () => {
    const version = shareImageVersion(new Uint8Array([1, 2, 3]))
    const html = shareMetaTags('https://wedding.example/', version)
    const image = `https://wedding.example${versionedShareImage(version)}`
    expect(html).toContain(`property="og:image" content="${image}"`)
    expect(html).toContain(`property="og:image:secure_url" content="${image}"`)
    expect(html).toContain('property="og:image:type" content="image/jpeg"')
    expect(html).toContain('property="og:image:width" content="1200"')
    expect(html).toContain('property="og:image:height" content="630"')
    expect(html).toContain(`name="twitter:image" content="${image}"`)
    expect(html).toContain(`property="og:url" content="https://wedding.example/?v=${version}"`)
  })
  it('keeps a GitHub project subpath in absolute image URLs', () => {
    expect(shareMetaTags('https://user.github.io/wedding/', 'abc'))
      .toContain('content="https://user.github.io/wedding/social/wedding-abc.jpg"')
  })
  it('keeps the legacy image URL when no version is supplied', () => {
    expect(shareMetaTags('https://wedding.example')).toContain(`content="https://wedding.example${share.image}"`)
  })
  it('changes the cache version only when the image bytes change', () => {
    expect(shareImageVersion(new Uint8Array([1, 2]))).toBe(shareImageVersion(new Uint8Array([1, 2])))
    expect(shareImageVersion(new Uint8Array([1, 2]))).not.toBe(shareImageVersion(new Uint8Array([2, 1])))
  })
})
