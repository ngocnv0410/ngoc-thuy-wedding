import { useRef } from 'react'
import { Button } from '../../components/Button'
import { DateBlock } from '../../components/DateBlock'
import { BabysBreath } from '../../components/decor/BabysBreath'
import { MarbleFrame } from '../../components/decor/MarbleFrame'
import { Divider } from '../../components/Ornament'
import { PendingNote } from '../../components/PendingNote'
import { SceneHeading, SceneShell } from '../../components/SceneShell'
import type { Person, WeddingContent, WeddingDay, WeddingEvent } from '../../content/types'
import { buildIcs, googleCalendarUrl, type CalendarEntry } from '../../lib/calendar'
import { orderedCouple, primaryDay } from '../../lib/format'
import styles from './Details.module.css'
import { useSceneMotion } from '../../motion/useMotion'
import { MonthCalendar } from './MonthCalendar'

/**
 * Scene 2 — Thông tin lễ cưới, bố cục như tờ thiệp in (mẫu tham khảo): đối xứng, nhiều khoảng
 * trắng, nền loang cẩm thạch một bên, hoa baby khô ở góc, tên lễ viết tay nhũ vàng.
 */
export function Details({ content }: { content: WeddingContent }) {
  const ref = useRef<HTMLElement>(null)
  useSceneMotion(ref, 'details')
  const { couple, events, locations } = content
  const [first, second] = orderedCouple(couple)
  const days = [...content.days].sort((a, b) => a.solar.localeCompare(b.solar))
  const main = primaryDay(days)

  const entries: CalendarEntry[] = events.flatMap((event) => {
    const day = days.find((item) => item.id === event.dayId)
    if (!day) return []
    return [{ event, day, location: locations.find((location) => location.id === event.locationId) }]
  })
  const mainEntry = entries.find((entry) => entry.day.id === main.id)
  const missingTimes = events.some((event) => !event.time)

  return (
    <SceneShell ref={ref} id="thong-tin" light="noon" labelledBy="details-title" className={styles.scene}>
      <MarbleFrame seed={8} />
      <BabysBreath corner="top-left" seed={31} className={styles.bouquetTop} />
      <BabysBreath corner="bottom-right" seed={44} className={styles.bouquetBottom} />

      <SceneHeading id="details-title" eyebrow="Thông tin lễ cưới">
        Trân trọng báo tin
      </SceneHeading>

      <div className={styles.families} data-anim="families">
        <Family label={first === couple.groom ? 'Nhà trai' : 'Nhà gái'} person={first} />
        <span className={styles.familyRule} aria-hidden="true" data-anim="family-rule" />
        <Family label={second === couple.groom ? 'Nhà trai' : 'Nhà gái'} person={second} />
      </div>

      <div className={styles.announce} data-anim="announce">
        <p className={styles.announceLead}>Lễ thành hôn của con chúng tôi</p>
        <p className={styles.fullNames}>
          <span>{first.fullName}</span>
          <span className={styles.amp} aria-label="và">
            &amp;
          </span>
          <span>{second.fullName}</span>
        </p>
        {content.invitation && <p className={styles.invitation}>{content.invitation}</p>}
      </div>

      <Divider className={styles.divider} />

      <ol className={styles.days} data-count={days.length}>
        {days.map((day) => (
          <DayBlock
            key={day.id}
            day={day}
            primary={day.id === main.id}
            events={events.filter((event) => event.dayId === day.id)}
            locationName={(id) => locations.find((location) => location.id === id)?.name}
          />
        ))}
      </ol>
      {missingTimes && <PendingNote>giờ tổ chức, bên tổ chức (nhà gái/nhà trai) và địa điểm của từng lễ.</PendingNote>}

      <MonthCalendar days={days} primaryId={main.id} />

      {entries.length > 0 && (
        <div className={styles.actions} data-anim="actions">
          <Button variant="primary" onClick={() => downloadIcs(entries)} icon={<CalendarIcon />}>
            Thêm vào lịch
          </Button>
          {mainEntry && (
            <Button variant="link" href={googleCalendarUrl(mainEntry)} target="_blank" rel="noopener">
              Google Calendar
            </Button>
          )}
        </div>
      )}
    </SceneShell>
  )
}

function Family({ label, person }: { label: string; person: Person }) {
  if (!person.father && !person.mother) return null
  return (
    <div className={styles.family} data-anim="family">
      <p className={styles.familyLabel}>{label}</p>
      {person.father && <p className={styles.parent}>Ông {person.father}</p>}
      {person.mother && <p className={styles.parent}>Bà {person.mother}</p>}
    </div>
  )
}

interface DayBlockProps {
  day: WeddingDay
  primary: boolean
  events: WeddingEvent[]
  locationName: (id?: string) => string | undefined
}

function DayBlock({ day, primary, events, locationName }: DayBlockProps) {
  // Chỉ liệt kê sự kiện khi có thêm thông tin ngoài tên lễ (giờ, địa điểm, ghi chú).
  const detailed = events.filter((event) => event.time || event.locationId || event.note || event.title !== day.title)

  return (
    <li className={styles.day} data-primary={primary} data-anim="day">
      <h3 className={styles.dayTitle} data-anim="day-title">
        {day.title}
      </h3>
      <DateBlock day={day} size="md" />
      {detailed.length > 0 && (
        <ul className={styles.events}>
          {detailed.map((event) => (
            <li key={event.id} className={styles.event} data-anim="event">
              {event.time && (
                <span className={styles.time}>
                  {event.time}
                  {event.endTime && ` – ${event.endTime}`}
                </span>
              )}
              <span className={styles.eventBody}>
                <span className={styles.eventTitle}>{event.title}</span>
                {event.side && event.side !== 'both' && (
                  <span className={styles.tag}>{event.side === 'bride' ? 'Nhà gái' : 'Nhà trai'}</span>
                )}
                {event.locationId && (
                  <a className={styles.where} href="#dia-diem">
                    {locationName(event.locationId)}
                  </a>
                )}
                {event.note && <span className={styles.note}>{event.note}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function downloadIcs(entries: CalendarEntry[]) {
  const blob = new Blob([buildIcs(entries)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'thiep-cuoi.ics'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="3.5" y="5" width="17" height="15" rx="1" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  )
}
