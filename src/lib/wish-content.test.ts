import { describe, expect, it } from 'vitest'
import { normalizeWish, validateWish, wishErrorMessage } from './wish-content'

describe('wedding wish input', () => {
  it('normalizes Vietnamese text and trims the edges without removing message line breaks', () => {
    expect(normalizeWish({ name: '  Thu\u0309y  ', message: '  Chúc mừng!\nHạnh phúc nhé 💛  ' }))
      .toEqual({ name: 'Thủy', message: 'Chúc mừng!\nHạnh phúc nhé 💛' })
  })
  it.each([
    { name: '   ', message: 'Happy wedding' },
    { name: '\u00a0\u200b', message: 'Happy wedding' },
    { name: 'A', message: '\u2003\u200d' },
    { name: 'A', message: '\n\t' },
    { name: 'a'.repeat(61), message: 'Happy wedding' },
    { name: 'A', message: 'a'.repeat(601) },
  ])('rejects empty or oversized content: %j', (draft) => {
    expect(validateWish(draft)).toBeTypeOf('string')
  })
  it('accepts boundary lengths and treats markup as plain text', () => {
    expect(validateWish({ name: 'a'.repeat(60), message: 'a'.repeat(600) })).toBeUndefined()
    expect(normalizeWish({ name: '<b>A</b>', message: '<script>alert(1)</script>' }).message).toBe('<script>alert(1)</script>')
  })
  it('gives a retry message for offline failures without claiming the wish was saved', () => {
    expect(wishErrorMessage({ code: 'guestbook/offline' })).toContain('ô nhập')
    expect(wishErrorMessage({ code: 'auth/network-request-failed' })).toContain('ô nhập')
    expect(wishErrorMessage({ code: 'permission-denied' })).toContain('Chưa gửi được')
  })
})
