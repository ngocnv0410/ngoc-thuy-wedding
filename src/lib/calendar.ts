import type { Location, Time, WeddingDay, WeddingEvent } from '../content/types'

/** Việt Nam dùng UTC+7 cố định, không có giờ mùa hè. */
const VN_OFFSET_HOURS = 7
/** Thời lượng mặc định khi sự kiện không có giờ kết thúc. */
const DEFAULT_DURATION_HOURS = 2

export interface CalendarEntry {
  event: WeddingEvent
  day: WeddingDay
  location?: Location
}

/** Ngày `YYYY-MM-DD` + giờ VN `HH:mm` → thời điểm tuyệt đối. */
export function parseLocal(date: string, time: Time): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(`${date}T${time}`)
  if (!match) {
    throw new Error(`Ngày giờ không đúng định dạng YYYY-MM-DD + HH:mm: "${date} ${time}"`)
  }
  const [, y, mo, d, h, mi] = match.map(Number)
  return new Date(Date.UTC(y, mo - 1, d, h - VN_OFFSET_HOURS, mi))
}

function formatUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** `2026-12-24` → `20261224`. */
function compactDate(date: string): string {
  return date.replace(/-/g, '')
}

function nextDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
}

/** `2026-12-24` + `17:30` (giờ VN) → `20261224T103000Z`. */
export function toUtcStamp(date: string, time: Time): string {
  return formatUtc(parseLocal(date, time))
}

interface Range {
  allDay: boolean
  start: string
  end: string
}

/** Có giờ → khoảng UTC; chưa có giờ → sự kiện cả ngày. */
function range({ event, day }: CalendarEntry): Range {
  if (!event.time) {
    return { allDay: true, start: compactDate(day.solar), end: compactDate(nextDate(day.solar)) }
  }
  const start = parseLocal(day.solar, event.time)
  const end = event.endTime
    ? parseLocal(day.solar, event.endTime)
    : new Date(start.getTime() + DEFAULT_DURATION_HOURS * 3600_000)
  return { allDay: false, start: formatUtc(start), end: formatUtc(end) }
}

function locationText(location?: Location): string {
  return location ? `${location.name}, ${location.address}` : ''
}

/** Link "Thêm vào Google Calendar" cho một sự kiện. */
export function googleCalendarUrl(entry: CalendarEntry, details = ''): string {
  const { start, end } = range(entry)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: entry.event.title,
    dates: `${start}/${end}`,
    ctz: 'Asia/Ho_Chi_Minh',
  })
  const where = locationText(entry.location)
  if (where) params.set('location', where)
  if (details) params.set('details', details)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** Escape theo RFC 5545 §3.3.11. */
function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/**
 * Gập dòng ở 75 octet (RFC 5545 §3.1), không cắt giữa ký tự UTF-8 nhiều byte —
 * quan trọng với tiếng Việt có dấu.
 */
function foldLine(line: string): string {
  const encoder = new TextEncoder()
  const parts: string[] = []
  let current = ''
  let bytes = 0
  for (const char of line) {
    const size = encoder.encode(char).length
    const limit = parts.length === 0 ? 75 : 74 // dòng tiếp theo bắt đầu bằng 1 dấu cách
    if (bytes + size > limit) {
      parts.push(current)
      current = ''
      bytes = 0
    }
    current += char
    bytes += size
  }
  parts.push(current)
  return parts.join('\r\n ')
}

/** Nội dung file `.ics` cho một hoặc nhiều sự kiện. `now` truyền vào để test ổn định. */
export function buildIcs(entries: CalendarEntry[], now: Date = new Date(), uidDomain = 'thiep-cuoi'): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Thiep cuoi//VI', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']
  for (const entry of entries) {
    const { event, location } = entry
    const { allDay, start, end } = range(entry)
    const prop = allDay ? ';VALUE=DATE' : ''
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@${uidDomain}`,
      `DTSTAMP:${formatUtc(now)}`,
      `DTSTART${prop}:${start}`,
      `DTEND${prop}:${end}`,
      `SUMMARY:${escapeText(event.title)}`,
    )
    const where = locationText(location)
    if (where) lines.push(`LOCATION:${escapeText(where)}`)
    if (event.note) lines.push(`DESCRIPTION:${escapeText(event.note)}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
