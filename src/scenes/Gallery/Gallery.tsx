import { useMemo, useRef } from 'react'
import { Stationery } from '../../components/decor/Stationery'
import { PendingNote } from '../../components/PendingNote'
import { ResponsivePicture } from '../../components/ResponsivePicture'
import { SceneShell } from '../../components/SceneShell'
import type { Photo, WeddingContent } from '../../content/types'
import { useSceneMotion } from '../../motion/useMotion'
import styles from './Gallery.module.css'
import { openLightbox } from './lightbox'
import { VideoBlock } from './VideoBlock'

/** One continuous photo album; source groups do not create visible chapters. */
export function Gallery({ content }: { content: WeddingContent }) {
  const { gallery, video } = content
  const ref = useRef<HTMLElement>(null)
  useSceneMotion(ref, 'gallery')
  const photos = useMemo(
    () => gallery.flatMap((group) => group.items.filter((item): item is Photo => item.role !== 'quote')),
    [gallery],
  )

  function open(index: number) {
    const buttons = ref.current?.querySelectorAll<HTMLElement>('[data-photo-index]')
    if (!buttons) return
    const items = photos.map((photo, i) => ({ photo, element: buttons[i] }))
    openLightbox(items, index).catch(() => {
      window.open(photos[index].image.img.src, '_blank', 'noopener')
    })
  }

  return (
    <SceneShell ref={ref} id="album" light="golden" labelledBy="gallery-title" className={styles.scene}>
      <Stationery seed={21} />
      <header className={styles.heading}>
        <h2 id="gallery-title">Album ảnh</h2>
        {photos.length > 0 && <span className={styles.count}>{photos.length} ảnh</span>}
      </header>
      {photos.length === 0 && !video && <PendingNote>ảnh cưới và video.</PendingNote>}
      {photos.length > 0 && (
        <div className={styles.album}>
          {gallery.some((group) => group.sample) && <p className={`sample-note ${styles.sampleNote}`}>Ảnh minh họa mẫu</p>}
          <ul className={styles.grid} aria-label={`Album ảnh cưới, ${photos.length} ảnh`}>
            {photos.map((photo, index) => (
              <li key={index} data-anim="album-photo">
                <button
                  type="button"
                  className={styles.frame}
                  data-photo-index={index}
                  aria-label={`Xem ảnh lớn: ${photo.alt}`}
                  onClick={() => open(index)}
                >
                  <ResponsivePicture image={photo.image} alt={photo.alt} sizes="(min-width: 1120px) 150px, (min-width: 1024px) 14vw, (min-width: 600px) 21vw, 28vw" className={styles.photo} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {video && <VideoBlock video={video} />}
    </SceneShell>
  )
}
