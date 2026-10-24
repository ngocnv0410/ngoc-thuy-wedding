import { useRef } from 'react'
import { Button } from '../../components/Button'
import { CopyButton } from '../../components/CopyButton'
import { Chibi } from '../../components/chibi/Chibi'
import { PropArt } from '../../components/chibi/ChibiProp'
import { Stationery } from '../../components/decor/Stationery'
import { PendingNote } from '../../components/PendingNote'
import { SceneHeading, SceneShell } from '../../components/SceneShell'
import type { Location, WeddingContent } from '../../content/types'
import { telHref } from '../../lib/format'
import { addressText, directionsUrl } from '../../lib/maps'
import { useSceneMotion } from '../../motion/useMotion'
import { useVisibleMotion } from '../../motion/useVisibleMotion'
import styles from './Locations.module.css'

export function Locations({ content }: { content: WeddingContent }) {
  const { locations, events } = content
  const ref = useRef<HTMLElement>(null)
  useSceneMotion(ref, 'locations')

  return (
    <SceneShell ref={ref} id="dia-diem" light="afternoon" labelledBy="locations-title">
      <Stationery seed={13} sprigs={[
        { corner: 'top-right', seed: 52 },
        { corner: 'bottom-left', variant: 'sprig', seed: 61 },
      ]} />
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
  const ref = useRef<HTMLLIElement>(null)
  const { active } = useVisibleMotion(ref)
  return (
    <li ref={ref} className={styles.card} data-location={location.id} data-ambient-active={active}
      aria-labelledby={headingId} data-anim="location">
      <p className={styles.label}><span aria-hidden="true" />{location.label}<span aria-hidden="true" /></p>
      <VenueArt side={location.side} />
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

/** Decorative stationery illustration; actual directions use the supplied Maps links. */
function VenueArt({ side }: { side: Location['side'] }) {
  const hosts: Array<'groom' | 'bride'> = side === 'both' ? ['groom', 'bride'] : [side === 'bride' ? 'bride' : 'groom']
  return (
    <div className={styles.illustration} aria-hidden="true">
      <svg className={styles.backdrop} viewBox="0 0 240 170" fill="none" focusable="false">
        <path className={styles.arch} d="M48 149V79a72 72 0 0 1 144 0v70M55 149V79a65 65 0 0 1 130 0v70" />
        <path className={styles.ground} d="M24 151q96 14 192 0M42 157q78 8 156 0" />
        <g className={styles.botanical}>
          <path d="M35 149q-15-28-9-48M34 140q10-20 6-34M204 149q15-28 9-48M205 140q-10-20-6-34" />
          <path d="M28 120q-12-1-11-11q11 1 11 11ZM31 132q10-2 9-10q-10 0-9 10ZM211 120q12-1 11-11q-11 1-11 11ZM208 132q-10-2-9-10q10 0 9 10Z" />
          <circle cx="26" cy="101" r="3" /><circle cx="40" cy="106" r="3" />
          <circle cx="213" cy="101" r="3" /><circle cx="199" cy="106" r="3" />
        </g>
      </svg>
      <span className={styles.pinSeal}><RouteIcon /></span>
      <div className={styles.hosts}>
        {hosts.map((who) => (
          <Chibi key={who} who={who} pose="carry" hand={who === 'groom' ? 'l' : 'r'}
            look="front" held={<PropArt kind={who === 'groom' ? 'map' : 'heart'} />}
            anim="venue-host" />
        ))}
      </div>
      <span className={`${styles.sparkle} ${styles.sparkleLeft}`}>✧</span>
      <span className={`${styles.sparkle} ${styles.sparkleRight}`}>✧</span>
    </div>
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
