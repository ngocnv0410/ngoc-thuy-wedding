import { describe, expect, it } from 'vitest'
import { lunarYearName, solarIsoToLunar } from '../lib/lunar'
import { wedding } from './wedding'

/** Kiểm tra dữ liệu thật trước mỗi lần build: sai một ngày cũng không được phép lên trang. */
describe('wedding.ts', () => {
  it.each(wedding.days.map((day) => [day.title, day] as const))('ngày âm của %s khớp ngày dương', (_, day) => {
    const computed = solarIsoToLunar(day.solar)
    expect({ ...day.lunar, leap: day.lunar.leap ?? false, yearName: undefined }).toEqual({
      ...computed,
      yearName: undefined,
    })
    expect(day.lunar.yearName).toBe(lunarYearName(computed.year))
  })

  it('có đúng một ngày chính', () => {
    expect(wedding.days.filter((day) => day.primary)).toHaveLength(1)
  })

  it('id ngày, sự kiện, địa điểm, tài khoản không trùng', () => {
    for (const list of [wedding.days, wedding.events, wedding.locations, wedding.accounts, wedding.gallery]) {
      const ids = list.map((item) => item.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('sự kiện tham chiếu ngày và địa điểm có thật', () => {
    const dayIds = new Set(wedding.days.map((day) => day.id))
    const locationIds = new Set(wedding.locations.map((location) => location.id))
    for (const event of wedding.events) {
      expect(dayIds.has(event.dayId), event.id).toBe(true)
      if (event.locationId) expect(locationIds.has(event.locationId), event.id).toBe(true)
      if (event.time) expect(event.time).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/)
      if (event.endTime) expect(event.endTime > (event.time ?? ''), event.id).toBe(true)
    }
  })

  it('ngày dương đúng định dạng YYYY-MM-DD', () => {
    for (const day of wedding.days) {
      expect(day.solar).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(day.solar))).toBe(false)
    }
  })

  it('số tài khoản chỉ gồm chữ số, tên chủ TK in hoa', () => {
    for (const account of wedding.accounts) {
      expect(account.accountNumber).toMatch(/^\d+$/)
      expect(account.accountName).toBe(account.accountName.toLocaleUpperCase('vi'))
    }
  })

  it('tài khoản: bên tổ chức hợp lệ, ảnh QR theo id', () => {
    for (const account of wedding.accounts) {
      expect(['bride', 'groom', 'both']).toContain(account.side)
      expect(account.qrImage).toBe(`/qr/${account.id}.png`)
      expect(account.bin).toMatch(/^\d{6}$/)
    }
  })

  it('địa điểm có link Google Maps hoặc toạ độ', () => {
    for (const location of wedding.locations) {
      expect(Boolean(location.mapsUrl || location.coords || location.placeId), location.id).toBe(true)
      if (location.mapsUrl) expect(location.mapsUrl).toMatch(/^https:\/\/(maps\.app\.goo\.gl|www\.google\.com\/maps)\//)
    }
  })
})
