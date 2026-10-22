import { describe, expect, it } from 'vitest'
import { groupDigits } from './clipboard'

describe('groupDigits', () => {
  it.each([
    ['0123456789', '0123 4567 89'],
    ['12345678', '1234 5678'],
    ['0123 4567 89', '0123 4567 89'],
    ['123', '123'],
  ])('%s → %s', (input, output) => {
    expect(groupDigits(input)).toBe(output)
  })
})
