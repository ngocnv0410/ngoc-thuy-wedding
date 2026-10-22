import { describe, expect, it } from 'vitest'
import { lunarYearName, solarIsoToLunar } from './lunar'

describe('solarToLunar (lịch Việt, UTC+7)', () => {
  it.each([
    ['2023-01-22', { day: 1, month: 1, year: 2023, leap: false }],
    ['2024-02-10', { day: 1, month: 1, year: 2024, leap: false }],
    ['2025-01-29', { day: 1, month: 1, year: 2025, leap: false }],
    ['2026-02-17', { day: 1, month: 1, year: 2026, leap: false }],
  ])('Tết Nguyên Đán %s', (solar, lunar) => {
    expect(solarIsoToLunar(solar)).toEqual(lunar)
  })

  it('Tết 1985 của Việt Nam sớm hơn Trung Quốc một tháng', () => {
    expect(solarIsoToLunar('1985-01-21')).toEqual({ day: 1, month: 1, year: 1985, leap: false })
  })

  it('nhận diện tháng nhuận (2/2023 nhuận)', () => {
    expect(solarIsoToLunar('2023-03-22')).toEqual({ day: 1, month: 2, year: 2023, leap: true })
  })

  it('ngày cuối năm âm thuộc năm âm trước', () => {
    expect(solarIsoToLunar('2026-02-16')).toMatchObject({ month: 12, year: 2025 })
  })
})

describe('lunarYearName', () => {
  it.each([
    [2024, 'Giáp Thìn'],
    [2025, 'Ất Tỵ'],
    [2026, 'Bính Ngọ'],
    [2027, 'Đinh Mùi'],
  ])('%i → %s', (year, name) => {
    expect(lunarYearName(year)).toBe(name)
  })
})
