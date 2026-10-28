import type { Music } from '../content/types'

/** An allowlisted variant, rather than accepting arbitrary audio URLs from the query. */
export function usesAlternateMusic(search: string): boolean {
  return new URLSearchParams(search).get('music') === 'youtube'
}

export function selectMusic(defaultTrack: Music | undefined, search: string): Music | undefined {
  if (!usesAlternateMusic(search)) return defaultTrack
  return {
    src: 'audio/youtube-hGu7BVQy5G0.mp3',
    title: 'Nhạc cưới',
    sourceUrl: 'https://www.youtube.com/watch?v=hGu7BVQy5G0&t=15s',
    startSeconds: 15,
  }
}
