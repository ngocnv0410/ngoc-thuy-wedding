import type { Music } from '../content/types'

export type MusicModeId = 'original' | 'bangbangbang' | 'bad'
export interface MusicMode {
  id: MusicModeId
  label: string
  description: string
  track: Music
}

interface OnlineMusicSources {
  original?: string
  bangbangbang?: string
  bad?: string
}

/** Configured HTTPS recordings may replace bundled files; guest URLs never select a recording. */
export function onlineMusicSource(value: string | undefined, fallback: string): string {
  if (!value?.trim()) return fallback
  try {
    const url = new URL(value.trim())
    if (url.protocol === 'https:' && !url.username && !url.password) return url.href
  } catch { /* Invalid configuration keeps the working local recording. */ }
  return fallback
}

/** Soundtrack choices never change chapter choreography. */
export function getMusicModes(original: Music | undefined, online: OnlineMusicSources = {
  original: import.meta.env?.VITE_MUSIC_ORIGINAL_URL,
  bangbangbang: import.meta.env?.VITE_MUSIC_BANGBANGBANG_URL,
  bad: import.meta.env?.VITE_MUSIC_BAD_URL,
}): MusicMode[] {
  const originalSrc = original && onlineMusicSource(online.original, original.src)
  const originalTrack = original && originalSrc && originalSrc !== original.src ? { ...original, src: originalSrc } : original
  return [
    ...(originalTrack ? [{ id: 'original' as const, label: 'Nguyên bản', description: 'Dịu dàng · Forever in Love', track: originalTrack }] : []),
    { id: 'bangbangbang', label: 'BANG BANG', description: 'BANG BANG BANG · BIGBANG', track: {
      src: onlineMusicSource(online.bangbangbang, 'audio/bang-bang-bang-chorus.mp3'),
      title: 'BANG BANG BANG · Điệp khúc', artist: 'BIGBANG',
    } },
    { id: 'bad', label: 'BAD', description: 'BAD · ATEEZ', track: {
      src: onlineMusicSource(online.bad, 'audio/ateez-bad-chorus.mp3'),
      title: 'BAD · ATEEZ',
    } },
  ]
}

/** Old Nhạc cưới links and unknown values fall back to the original invitation. */
export function musicModeFromSearch(search: string): MusicModeId {
  const value = new URLSearchParams(search).get('music')
  return value === 'bangbangbang' || value === 'bad' ? value : 'original'
}

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
