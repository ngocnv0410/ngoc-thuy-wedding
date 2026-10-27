import { useRef } from 'react'
import { Button } from '../../components/Button'
import { CopyButton } from '../../components/CopyButton'
import { Stationery } from '../../components/decor/Stationery'
import { PendingNote } from '../../components/PendingNote'
import { SceneHeading, SceneShell } from '../../components/SceneShell'
import type { Location, WeddingContent } from '../../content/types'
import { telHref } from '../../lib/format'
import { addressText, directionsUrl } from '../../lib/maps'
import { useSceneMotion } from '../../motion/useMotion'
import styles from './Locations.module.css'

export function Locations({ content }: { content: WeddingContent }) {
  const { locations, events } = content
  const ref = useRef<HTMLElement>(null)
  useSceneMotion(ref, 'locations')

  return (
    <SceneShell ref={ref} id="dia-diem" light="afternoon" labelledBy="locations-title">
      <Stationery seed={13} />
      <SceneHeading id="locations-title" eyebrow="Địa điểm tổ chức">
        Nơi ngày vui diễn ra
      </SceneHeading>

      {locations.length === 0 ? (
        <PendingNote>địa chỉ nhà gái, nhà trai, nhà hàng kèm link Google Maps.</PendingNote>
      ) : (
        <ol className={styles.cards}>
          {locations.map((location) => (
            <LocationCard key={location.id} location={location}
              times={events.filter((event) => event.locationId === location.id && event.time)} />
          ))}
        </ol>
      )}
    </SceneShell>
  )
}

interface LocationCardProps {
  location: Location
  times: Array<{ id: string; title: string; time?: string }>
}

function LocationCard({ location, times }: LocationCardProps) {
  const headingId = `location-${location.id}`
  return (
    <li className={styles.card} data-location={location.id}
      aria-labelledby={headingId} data-anim="location">
      <p className={styles.label}><span aria-hidden="true" />{location.label}<span aria-hidden="true" /></p>
      <span className={styles.venuePin} aria-hidden="true"><RouteIcon /></span>
      <h3 id={headingId} className={styles.name}>{location.name}</h3>
      <div className={styles.rule} aria-hidden="true"><span>♡</span></div>
      <address className={styles.address}>{location.address}</address>
      {times.length > 0 && (
        <ul className={styles.times}>
          {times.map((event) => (
            <li key={event.id}><span className={styles.time}>{event.time}</span> {event.title}</li>
          ))}
        </ul>
      )}
      {location.note && <p className={styles.note}>{location.note}</p>}
      <div className={styles.actions}>
        <a className={styles.directions} href={directionsUrl(location)} target="_blank" rel="noopener"
          aria-label={`Chỉ đường đến ${location.label}`}>
          <RouteIcon /><span>Chỉ đường</span><span className={styles.arrow} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M6 18 18 6M6 6h12v12" /></svg></span>
        </a>
        <CopyButton value={addressText(location)} label="Sao chép địa chỉ" successMessage="Đã sao chép địa chỉ" />
        {location.phone && (
          <Button variant="link" href={telHref(location.phone)}>Gọi {location.phone}</Button>
        )}
      </div>
    </li>
  )
}

function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" focusable="false">
      <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  )
}
