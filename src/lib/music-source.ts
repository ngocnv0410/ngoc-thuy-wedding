import type { Music } from '../content/types'

export type MusicModeId = 'original' | 'bangbangbang' | 'youtube'
export interface MusicMode {
  id: MusicModeId
  label: string
  description: string
  track: Music
}

/** Add future invitation modes here, with an approved local recording and optional choreography. */
export function getMusicModes(original: Music | undefined): MusicMode[] {
  return [
    ...(original ? [{ id: 'original' as const, label: 'Original', description: 'Dịu dàng · Forever in Love', track: original }] : []),
    { id: 'bangbangbang', label: 'BANG BANG BANG', description: 'Sôi động · Cùng cô dâu chú rể nhảy', track: {
      src: 'audio/bang-bang-bang-chorus.mp3', title: 'BANG BANG BANG · Điệp khúc', artist: 'BIGBANG', dance: 'bang-bang-bang',
    } },
    { id: 'youtube', label: 'Nhạc cưới', description: 'Một giai điệu khác cho ngày vui', track: {
      src: 'audio/youtube-hGu7BVQy5G0.mp3', title: 'Nhạc cưới', sourceUrl: 'https://www.youtube.com/watch?v=hGu7BVQy5G0&t=15s', startSeconds: 15,
    } },
  ]
}

export function musicModeFromSearch(search: string): MusicModeId {
  const value = new URLSearchParams(search).get('music')
  return value === 'bangbangbang' || value === 'youtube' ? value : 'original'
}

export function usesAlternateMusic(search: string): boolean {
  return musicModeFromSearch(search) === 'youtube'
}

/** Only modes registered above may select a recording; query strings cannot inject audio URLs. */
export function selectMusic(original: Music | undefined, search: string): Music | undefined {
  return getMusicModes(original).find((mode) => mode.id === musicModeFromSearch(search))?.track
}

export function searchWithMusicMode(search: string, mode: MusicModeId): string {
  const params = new URLSearchParams(search)
  if (mode === 'original') params.delete('music')
  else params.set('music', mode)
  const query = params.toString()
  return query ? `?${query}` : ''
}
