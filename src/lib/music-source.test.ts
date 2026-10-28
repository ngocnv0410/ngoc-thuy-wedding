import { describe, expect, it } from 'vitest'
import { selectMusic } from './music-source'

const original = { src: 'audio/forever-in-love-kenny-g.mp3', title: 'Forever in Love' }
describe('invitation soundtrack', () => {
  it('preserves the original track for ordinary links and unknown options', () => {
    for (const search of ['', '?v=abc', '?music=other', '?music=']) expect(selectMusic(original, search)).toBe(original)
  })
  it('selects the project MP3 at 15 seconds only for music=youtube', () => {
    expect(selectMusic(original, '?v=abc&music=youtube')).toMatchObject({ src: 'audio/youtube-hGu7BVQy5G0.mp3', startSeconds: 15 })
  })
})
