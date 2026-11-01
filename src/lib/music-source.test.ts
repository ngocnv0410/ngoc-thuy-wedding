import { describe, expect, it } from 'vitest'
import { getMusicModes, musicModeFromSearch, searchWithMusicMode, selectMusic } from './music-source'

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


it('has a single registry for labels, recordings and matching choreography', () => {
  const modes = getMusicModes(original)
  expect(modes.map((mode) => mode.id)).toEqual(['original', 'bangbangbang', 'youtube'])
  for (const mode of modes) expect(selectMusic(original, `?music=${mode.id}`)).toEqual(mode.track)
  expect(modes.filter((mode) => mode.track.dance).map((mode) => mode.id)).toEqual(['bangbangbang'])
})

it('updates a mode URL while preserving guest and other query parameters', () => {
  expect(searchWithMusicMode('?guest=Ngoc&v=abc', 'bangbangbang')).toBe('?guest=Ngoc&v=abc&music=bangbangbang')
  expect(searchWithMusicMode('?guest=Ngoc&music=bangbangbang', 'original')).toBe('?guest=Ngoc')
  expect(searchWithMusicMode('?music=youtube', 'original')).toBe('')
  expect(musicModeFromSearch('?music=https://example.com/other.mp3')).toBe('original')
})
