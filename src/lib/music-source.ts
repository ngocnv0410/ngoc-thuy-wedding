import type { Music } from '../content/types'

/** An allowlisted variant, rather than accepting arbitrary audio URLs from the query. */
export function usesAlternateMusic(search: string): boolean {
  return new URLSearchParams(search).get('music') === 'youtube'
}

export function selectMusic(defaultTrack: Music | undefined, search: string): Music | undefined {
  if (new URLSearchParams(search).get('music') === 'original') return {
    src: 'audio/forever-in-love-kenny-g.mp3', title: 'Forever in Love', artist: 'Kenny G',
    artistUrl: 'https://www.kennyg.com/', sourceUrl: 'https://www.nhaccuatui.com/song/0zgSpVtFWT',
  }
  if (!usesAlternateMusic(search)) return defaultTrack
  return {
    src: 'audio/youtube-hGu7BVQy5G0.mp3',
    title: 'Nhạc cưới',
    sourceUrl: 'https://www.youtube.com/watch?v=hGu7BVQy5G0&t=15s',
    startSeconds: 15,
  }
}
