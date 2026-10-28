import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { copyText } from './clipboard'
import { invitationShareUrl, shareInvitation } from './invitation-share'

vi.mock('./clipboard', () => ({ copyText: vi.fn() }))
const data = { title: 'Ngọc & Thủy · Thiệp cưới', text: 'Thiệp mời cưới Ngọc & Thủy', url: 'https://wedding.example/?v=abc' }

beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal('navigator', {}) })
afterEach(() => vi.unstubAllGlobals())

describe('invitation sharing', () => {
  it('shares the full page without a guest query or current chapter', () => {
    expect(invitationShareUrl('https://wedding.example/?guest=private#loi-chuc', '/')).toBe('https://wedding.example/')
    expect(invitationShareUrl('https://user.github.io/wedding/?guest=private#dia-diem', '/wedding/')).toBe('https://user.github.io/wedding/')
  })
  it('uses the canonical preview version and removes other query parameters', () => {
    expect(invitationShareUrl('https://local.example/#bia', '/', 'https://wedding.example/?v=abc&utm_source=test#loi-chuc'))
      .toBe('https://wedding.example/?v=abc')
  })
  it('keeps the selected soundtrack and preview version without forwarding private query data', () => {
    expect(invitationShareUrl('https://wedding.example/?music=youtube&guest=private#dia-diem', '/', 'https://wedding.example/?v=abc'))
      .toBe('https://wedding.example/?v=abc&music=youtube')
    expect(invitationShareUrl('https://wedding.example/?music=youtube', '/'))
      .toBe('https://wedding.example/?music=youtube')
    expect(invitationShareUrl('https://wedding.example/?music=unknown&guest=private', '/'))
      .toBe('https://wedding.example/')
  })
  it('rejects a non-web preferred URL', () => {
    expect(invitationShareUrl('https://wedding.example/#bia', '/', 'javascript:alert(1)')).toBe('https://wedding.example/')
  })
  it('opens native sharing without changing the clipboard', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })
    expect(await shareInvitation(data)).toBe('shared')
    expect(share).toHaveBeenCalledWith(data)
    expect(copyText).not.toHaveBeenCalled()
  })
  it('does not copy anything when the guest cancels native sharing', async () => {
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue({ name: 'AbortError' }) })
    expect(await shareInvitation(data)).toBe('cancelled')
    expect(copyText).not.toHaveBeenCalled()
  })
  it('copies the URL when native sharing is unavailable or denied', async () => {
    vi.mocked(copyText).mockResolvedValue(true)
    expect(await shareInvitation(data)).toBe('copied')
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue({ name: 'NotAllowedError' }) })
    expect(await shareInvitation(data)).toBe('copied')
    expect(copyText).toHaveBeenLastCalledWith(data.url)
  })
  it('requests a selectable manual link when both browser sharing and copying fail', async () => {
    vi.mocked(copyText).mockResolvedValue(false)
    expect(await shareInvitation(data)).toBe('manual')
  })
})
