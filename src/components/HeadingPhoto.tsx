import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { HeadingPhotoContent } from '../content/types'
import { BotanicalCorner } from './decor/BotanicalCorner'
import { ResponsivePicture } from './ResponsivePicture'
import { useVisibleMotion } from '../motion/useVisibleMotion'
import { loadMotion, prefersMotion } from '../motion/useMotion'
import styles from './HeadingPhoto.module.css'

/** Optional heading portrait; failed/missing photos do not leave an empty panel. */
export function HeadingPhoto({ photo, children }: { photo?: HeadingPhotoContent; children?: ReactNode }) {
  // Reset error state if a later content update selects a different picture.
  return photo ? <PhotoFrame key={photo.image.img.src} photo={photo}>{children}</PhotoFrame> : null
}

function PhotoFrame({ photo, children }: { photo: HeadingPhotoContent; children?: ReactNode }) {
  const [failed, setFailed] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)
  const { ref, active } = useVisibleMotion(nodeRef)
  useEffect(() => {
    const img = ref.current?.querySelector('img[data-anim="heading-image"]')
    if (!(img instanceof HTMLImageElement)) return
    const failure = () => {
      setFailed(true)
    }
    img.addEventListener('error', failure)
    if (img.complete && !img.naturalWidth) failure()
    return () => img.removeEventListener('error', failure)
  }, [ref])
  useEffect(() => {
    if (!failed || !prefersMotion()) return
    let cancelled = false
    const frame = requestAnimationFrame(() => loadMotion().then(runtime => { if (!cancelled) runtime.refreshLayout() }).catch(() => {}))
    return () => { cancelled = true; cancelAnimationFrame(frame) }
  }, [failed])
  if (failed) return null
  return <div ref={ref} className={styles.wrap} data-heading-photo
    data-heading-style={photo.style ?? 'double'} data-ambient-active={active}>
    <div className={styles.frame}>
      <div className={styles.media}>
        <ResponsivePicture image={photo.image} alt={photo.alt} sizes="(min-width: 1024px) 440px, (min-width: 360px) 320px, 88vw"
          className={styles.image} style={{ objectPosition: photo.focus ?? '50% 50%' }} data-anim="heading-image" />
      </div>
      {photo.sample && <span className={styles.badge}>Ảnh mẫu</span>}
    </div>
    <BotanicalCorner corner="bottom-right" variant="photo" />
    {children && <span className={styles.accent}>{children}</span>}
  </div>
}
