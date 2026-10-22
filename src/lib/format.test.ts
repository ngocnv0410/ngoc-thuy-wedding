import { describe, expect, it } from 'vitest'
import { dottedDate, lunarText, monthGrid, telHref, weekday } from './format'

describe('format', () => {
  it('thứ trong tuần', () => {
    expect(weekday('2026-12-23')).toBe('Thứ Tư')
    expect(weekday('2026-12-24')).toBe('Thứ Năm')
    expect(weekday('2026-12-27')).toBe('Chủ Nhật')
  })

  it('ngày dạng chấm', () => {
    expect(dottedDate('2026-12-04')).toBe('04.12.2026')
  })

  it('ngày âm có/không nhuận', () => {
    expect(lunarText({ day: 16, month: 11, year: 2026, yearName: 'Bính Ngọ' })).toBe('Ngày 16 tháng 11 năm Bính Ngọ')
    expect(lunarText({ day: 1, month: 2, year: 2023, leap: true, yearName: 'Quý Mão' })).toBe(
      'Ngày 1 tháng 2 nhuận năm Quý Mão',
    )
  })

  it('lưới tháng 12/2026 bắt đầu Thứ Ba, tuần bắt đầu Thứ Hai', () => {
    const grid = monthGrid(2026, 12)
    expect(grid[0]).toEqual([null, 1, 2, 3, 4, 5, 6])
    expect(grid.flat().filter(Boolean)).toHaveLength(31)
    expect(grid.every((week) => week.length === 7)).toBe(true)
  })

  it('tel: chỉ giữ chữ số và dấu +', () => {
    expect(telHref('0912 345.678')).toBe('tel:0912345678')
    expect(telHref('+84 912 345 678')).toBe('tel:+84912345678')
  })
})
