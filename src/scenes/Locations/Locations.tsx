import { useEffect, useRef, useState } from 'react'
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
import { StylizedMap } from './StylizedMap'

/** Scene 3 — Địa điểm. Ưu tiên chính xác và thao tác một tay; animation không bao giờ che địa chỉ. */
export function Locations({ content }: { content: WeddingContent }) {
  const { locations, events } = content
  const [activeId, setActiveId] = useState<string | undefined>(locations[0]?.id)
  const listRef = useRef<HTMLOListElement>(null)
  const ref = useRef<HTMLElement>(null)
  useSceneMotion(ref, 'locations')

  // Thẻ nào đang ở giữa màn hình thì ghim tương ứng trên bản đồ sáng lên.
  useEffect(() => {
    const cards = listRef.current?.querySelectorAll<HTMLElement>('[data-location]')
    if (!cards?.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible) setActiveId((visible.target as HTMLElement).dataset.location)
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    cards.forEach((card) => observer.observe(card))
    return () => observer.disconnect()
  }, [locations])

  return (
    <SceneShell ref={ref} id="dia-diem" light="afternoon" labelledBy="locations-title">
      <Stationery
        seed={13}
        sprigs={[
          { corner: 'top-right', seed: 52 },
          { corner: 'bottom-left', variant: 'sprig', seed: 61 },
        ]}
      />
      <SceneHeading id="locations-title" eyebrow="Địa điểm tổ chức">
        Đường về chung một nhà
      </SceneHeading>

      {locations.length === 0 ? (
        <PendingNote>địa chỉ nhà gái, nhà trai, nhà hàng kèm link Google Maps.</PendingNote>
      ) : (
        <div className={styles.layout}>
          <div className={styles.mapColumn}>
            <StylizedMap locations={locations} activeId={activeId} />
          </div>
          <ol ref={listRef} className={styles.cards}>
            {locations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                active={location.id === activeId}
                times={events.filter((event) => event.locationId === location.id && event.time)}
              />
            ))}
          </ol>
        </div>
      )}
    </SceneShell>
  )
}

interface LocationCardProps {
  location: Location
  active: boolean
  times: Array<{ id: string; title: string; time?: string }>
}

function LocationCard({ location, active, times }: LocationCardProps) {
  const headingId = `location-${location.id}`
  return (
    <li className={styles.card} data-location={location.id} data-active={active} aria-labelledby={headingId} data-anim="location">
      <p className={styles.label}>{location.label}</p>
      <h3 id={headingId} className={styles.name}>
        {location.name}
      </h3>
      <address className={styles.address}>{location.address}</address>
      {times.length > 0 && (
        <ul className={styles.times}>
          {times.map((event) => (
            <li key={event.id}>
              <span className={styles.time}>{event.time}</span> {event.title}
            </li>
          ))}
        </ul>
      )}
      {location.note && <p className={styles.note}>{location.note}</p>}
      <div className={styles.actions}>
        <Button variant="primary" href={directionsUrl(location)} target="_blank" rel="noopener" icon={<RouteIcon />}>
          Chỉ đường
        </Button>
        <CopyButton value={addressText(location)} label="Sao chép địa chỉ" successMessage="Đã sao chép địa chỉ" />
        {location.phone && (
          <Button variant="link" href={telHref(location.phone)}>
            Gọi {location.phone}
          </Button>
        )}
      </div>
    </li>
  )
}

function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  )
}
