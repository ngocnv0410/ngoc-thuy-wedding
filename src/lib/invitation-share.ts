import { copyText } from './clipboard'

export interface InvitationShareData { title: string; text: string; url: string }
export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'manual'

/** Share the whole invitation; never copy a guest's query parameters or current chapter. */
export function invitationShareUrl(currentUrl: string, basePath: string, preferredUrl?: string): string {
  const fallback = new URL(basePath, currentUrl)
  fallback.search = ''; fallback.hash = ''
  if (!preferredUrl) return fallback.href
  try {
    const target = new URL(preferredUrl, currentUrl)
    if (!['http:', 'https:'].includes(target.protocol)) return fallback.href
    const version = target.searchParams.get('v')
    target.search = ''; target.hash = ''
    if (version) target.searchParams.set('v', version)
    return target.href
  } catch { return fallback.href }
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
