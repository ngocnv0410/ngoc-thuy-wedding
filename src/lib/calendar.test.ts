import { describe, expect, it } from 'vitest'
import type { Location, WeddingDay, WeddingEvent } from '../content/types'
import { buildIcs, googleCalendarUrl, toUtcStamp } from './calendar'

const day: WeddingDay = {
  id: 'ngay-cuoi',
  title: 'Lễ cưới',
  solar: '2026-12-12',
  lunar: { day: 4, month: 11, year: 2026, yearName: 'Bính Ngọ' },
}

const event: WeddingEvent = {
  id: 'tiec-cuoi',
  title: 'Tiệc cưới',
  dayId: 'ngay-cuoi',
  time: '17:30',
  locationId: 'venue',
}

const location: Location = {
  id: 'venue',
  side: 'both',
  label: 'Nhà hàng',
  name: 'Sảnh Ánh Dương; tầng 2',
  address: '12 Đường Mẫu, Phường Thử, Thành phố Hồ Chí Minh, Việt Nam — lối vào cổng số 3 cạnh bãi gửi xe',
}

describe('toUtcStamp', () => {
  it('trừ 7 giờ, kể cả khi lùi sang ngày trước', () => {
    expect(toUtcStamp('2026-12-12', '17:30')).toBe('20261212T103000Z')
    expect(toUtcStamp('2026-12-12', '06:00')).toBe('20261211T230000Z')
  })

  it('báo lỗi khi sai định dạng', () => {
    expect(() => toUtcStamp('12/12/2026', '17:30')).toThrow()
  })
})

describe('googleCalendarUrl', () => {
  it('mặc định kéo dài 2 giờ khi không có giờ kết thúc', () => {
    const url = new URL(googleCalendarUrl({ event, day, location }))
    expect(url.searchParams.get('dates')).toBe('20261212T103000Z/20261212T123000Z')
    expect(url.searchParams.get('ctz')).toBe('Asia/Ho_Chi_Minh')
    expect(url.searchParams.get('text')).toBe('Tiệc cưới')
  })

  it('chưa có giờ → sự kiện cả ngày, qua được cuối tháng', () => {
    const url = new URL(googleCalendarUrl({ event: { ...event, time: undefined }, day: { ...day, solar: '2026-12-31' } }))
    expect(url.searchParams.get('dates')).toBe('20261231/20270101')
    expect(url.searchParams.has('location')).toBe(false)
  })
})

describe('buildIcs', () => {
  const ics = buildIcs([{ event: { ...event, endTime: '21:00' }, day, location }], new Date('2026-10-22T00:00:00Z'))

  it('có cấu trúc VCALENDAR/VEVENT và CRLF', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics).toContain('DTSTART:20261212T103000Z')
    expect(ics).toContain('DTEND:20261212T140000Z')
    expect(ics).toContain('DTSTAMP:20261022T000000Z')
  })

  it('sự kiện cả ngày dùng VALUE=DATE', () => {
    const allDay = buildIcs([{ event: { ...event, time: undefined }, day }])
    expect(allDay).toContain('DTSTART;VALUE=DATE:20261212')
    expect(allDay).toContain('DTEND;VALUE=DATE:20261213')
  })

  it('escape dấu ; và , trong văn bản', () => {
    const unfolded = ics.replace(/\r\n /g, '')
    expect(unfolded).toContain('LOCATION:Sảnh Ánh Dương\\; tầng 2\\, 12 Đường Mẫu\\,')
  })

  it('gập dòng ≤ 75 octet, không cắt giữa ký tự có dấu', () => {
    const encoder = new TextEncoder()
    for (const line of ics.split('\r\n')) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75)
      expect(line).not.toContain('�')
    }
    const unfolded = ics.replace(/\r\n /g, '')
    expect(unfolded).toContain('lối vào cổng số 3 cạnh bãi gửi xe')
  })
})
