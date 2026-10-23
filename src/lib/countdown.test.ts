import { describe, expect, it } from 'vitest'
import { countdownTo, weddingDayStart } from './countdown'

describe('wedding countdown', () => {
  const target = weddingDayStart('2026-12-24')

  it('starts the wedding date at midnight in Vietnam', () => {
    expect(new Date(target).toISOString()).toBe('2026-12-23T17:00:00.000Z')
    expect(countdownTo(target, Date.parse('2026-12-23T00:00:00+07:00'))).toEqual({
      days: 1, hours: 0, minutes: 0, seconds: 0, reached: false,
    })
  })

  it('breaks down days, hours, minutes and seconds', () => {
    expect(countdownTo(target, target - 2 * 86400000 - 3 * 3600000 - 4 * 60000 - 5000)).toEqual({
      days: 2, hours: 3, minutes: 4, seconds: 5, reached: false,
    })
  })

  it('rolls over correctly at a day boundary', () => {
    expect(countdownTo(target, target - 86400000 + 1000)).toEqual({
      days: 0, hours: 23, minutes: 59, seconds: 59, reached: false,
    })
  })

  it('does not reach zero before the last second has elapsed', () => {
    expect(countdownTo(target, target - 1)).toEqual({
      days: 0, hours: 0, minutes: 0, seconds: 1, reached: false,
    })
  })

  it.each([0, 1, 86400000])('stays at zero %i ms after the target', (elapsed) => {
    expect(countdownTo(target, target + elapsed)).toEqual({
      days: 0, hours: 0, minutes: 0, seconds: 0, reached: true,
    })
  })
})
