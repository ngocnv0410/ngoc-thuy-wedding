import { describe, expect, it } from 'vitest'
import { selectMusic } from './music-source'

const original = { src: 'audio/forever-in-love-kenny-g.mp3', title: 'Forever in Love' }
describe('invitation soundtrack', () => {
  it('preserves the original track for ordinary links and unknown options', () => {
    for (const search of ['', '?v=abc', '?music=other', '?music=', '?music=original']) expect(selectMusic(original, search)).toBe(original)
  })
  it('selects the project MP3 at 15 seconds only for music=youtube', () => {
    expect(selectMusic(original, '?v=abc&music=youtube')).toMatchObject({ src: 'audio/youtube-hGu7BVQy5G0.mp3', startSeconds: 15 })
  })
})

it('keeps dance metadata only on the matching track', () => {
  expect(selectMusic(original, '?music=bangbangbang')).toMatchObject({
    src: 'audio/bang-bang-bang-chorus.mp3', dance: 'bang-bang-bang',
  })
  for (const search of ['', '?music=original', '?music=youtube']) {
    expect(selectMusic(original, search)?.dance).toBeUndefined()
  }
})
