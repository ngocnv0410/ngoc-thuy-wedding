import { describe, expect, it } from 'vitest'
import { getMusicModes, musicModeFromSearch, onlineMusicSource, searchWithMusicMode, selectMusic } from './music-source'

const original = { src: 'audio/forever-in-love-kenny-g.mp3', title: 'Forever in Love' }
describe('invitation soundtrack', () => {
  it('falls back to the original for removed Nhạc cưới links and unknown options', () => {
    for (const search of ['', '?v=abc', '?music=other', '?music=', '?music=original', '?music=youtube']) {
      expect(musicModeFromSearch(search)).toBe('original')
      expect(selectMusic(original, search)).toBe(original)
    }
  })

  it('keeps soundtrack selection independent from chapter choreography', () => {
    const modes = getMusicModes(original)
    expect(modes.map((mode) => mode.id)).toEqual(['original', 'bangbangbang', 'bad'])
    for (const mode of modes) expect(selectMusic(original, `?music=${mode.id}`)).toEqual(mode.track)
    expect(selectMusic(original, '?music=bangbangbang')).toMatchObject({
      src: 'audio/bang-bang-bang-chorus.mp3',
    })
    expect(selectMusic(original, '?music=bad')).toMatchObject({
      src: 'audio/ateez-bad-chorus.mp3',
    })
    for (const mode of modes) expect(mode.track.dance).toBeUndefined()
  })

  it('accepts configured HTTPS sources and keeps local fallbacks for invalid sources', () => {
    const remote = 'https://media.example.com/forever.mp3'
    expect(onlineMusicSource(`  ${remote}  `, original.src)).toBe(remote)
    for (const value of [undefined, '', '/audio/other.mp3', 'not a URL', 'http://media.example.com/song.mp3', 'javascript:alert(1)', 'https://user:pass@media.example.com/song.mp3']) {
      expect(onlineMusicSource(value, original.src)).toBe(original.src)
    }
    const modes = getMusicModes(original, { original: remote, bangbangbang: 'https://media.example.com/excerpt.mp3', bad: 'https://media.example.com/bad.mp3' })
    expect(modes[0].track.src).toBe(remote)
    expect(modes[1].track).toMatchObject({ src: 'https://media.example.com/excerpt.mp3' })
    expect(modes[2].track).toMatchObject({ src: 'https://media.example.com/bad.mp3' })
    expect(original.src).toBe('audio/forever-in-love-kenny-g.mp3')
  })

  it('preserves guest and other query parameters when changing mode', () => {
    expect(searchWithMusicMode('?guest=Ngoc&v=abc', 'bangbangbang')).toBe('?guest=Ngoc&v=abc&music=bangbangbang')
    expect(searchWithMusicMode('?guest=Ngoc&music=bangbangbang', 'original')).toBe('?guest=Ngoc')
    expect(musicModeFromSearch('?music=bad')).toBe('bad')
    expect(searchWithMusicMode('?guest=Ngoc&music=bangbangbang', 'bad')).toBe('?guest=Ngoc&music=bad')
    expect(searchWithMusicMode('?music=bad', 'original')).toBe('')
    expect(searchWithMusicMode('?music=youtube', 'original')).toBe('')
    expect(musicModeFromSearch('?music=https://example.com/other.mp3')).toBe('original')
  })
})
