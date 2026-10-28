import { usesAlternateMusic } from './music-source'
import { copyText } from './clipboard'

export interface InvitationShareData { title: string; text: string; url: string }
export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'manual'

/** Share the whole invitation; never copy a guest's query parameters or current chapter. */
export function invitationShareUrl(currentUrl: string, basePath: string, preferredUrl?: string): string {
  const fallback = new URL(basePath, currentUrl)
  fallback.search = ''; fallback.hash = ''
  const finish = (url: URL) => {
    if (usesAlternateMusic(new URL(currentUrl).search)) url.searchParams.set('music', 'youtube')
    return url.href
  }
  if (!preferredUrl) return finish(fallback)
  try {
    const target = new URL(preferredUrl, currentUrl)
    if (!['http:', 'https:'].includes(target.protocol)) return finish(fallback)
    const version = target.searchParams.get('v')
    target.search = ''; target.hash = ''
    if (version) target.searchParams.set('v', version)
    return finish(target)
  } catch { return finish(fallback) }
}

export async function shareInvitation(data: InvitationShareData): Promise<ShareResult> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(data)
      return 'shared'
    } catch (error) {
      // Closing the system sheet must not unexpectedly write to the clipboard.
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return 'cancelled'
    }
  }
  return await copyText(data.url) ? 'copied' : 'manual'
}
