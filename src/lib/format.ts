import type { Couple, LunarDate, Person, WeddingDay } from '../content/types'

const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

export interface SolarParts {
  day: number
  month: number
  year: number
}

export function solarParts(iso: string): SolarParts {
  const [year, month, day] = iso.split('-').map(Number)
  return { day, month, year }
}

const pad = (value: number) => String(value).padStart(2, '0')

/** `2026-12-24` → "Thứ Năm". */
export function weekday(iso: string): string {
  const { day, month, year } = solarParts(iso)
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
}

/** `2026-12-24` → "24.12.2026". */
export function dottedDate(iso: string): string {
  const { day, month, year } = solarParts(iso)
  return `${pad(day)}.${pad(month)}.${year}`
}

/** "Ngày 16 tháng 11 năm Bính Ngọ" (thêm "nhuận" khi là tháng nhuận). */
export function lunarText(lunar: LunarDate): string {
  return `Ngày ${lunar.day} tháng ${lunar.month}${lunar.leap ? ' nhuận' : ''} năm ${lunar.yearName}`
}

/** Hai người theo thứ tự hiển thị trên bìa. */
export function orderedCouple(couple: Couple): [Person, Person] {
  return couple.order === 'groom-first' ? [couple.groom, couple.bride] : [couple.bride, couple.groom]
}

export function primaryDay(days: WeddingDay[]): WeddingDay {
  return days.find((day) => day.primary) ?? days[days.length - 1]
}

/**
 * Lưới tháng bắt đầu từ Thứ Hai (cách in lịch quen thuộc ở Việt Nam).
 * Ô ngoài tháng là `null`.
 */
export function monthGrid(year: number, month: number): Array<Array<number | null>> {
  const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cells: Array<number | null> = Array.from({ length: firstWeekday }, () => null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: Array<Array<number | null>> = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export const WEEKDAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

/** Chuẩn hoá số điện thoại cho `tel:`. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}
