import { useMemo, useRef } from 'react'
import { Stationery } from '../../components/decor/Stationery'
import { PendingNote } from '../../components/PendingNote'
import { ResponsivePicture } from '../../components/ResponsivePicture'
import { SceneHeading, SceneShell } from '../../components/SceneShell'
import type { GalleryChapter, Photo, WeddingContent } from '../../content/types'
import { useSceneMotion } from '../../motion/useMotion'
import styles from './Gallery.module.css'
import { openLightbox } from './lightbox'
import { VideoBlock } from './VideoBlock'

/** `sizes` theo vai trò ảnh — khớp số cột trong Gallery.module.css. */
const SIZES: Record<string, string> = {
  'hero-portrait': '(min-width: 1024px) 45vw, 85vw',
  landscape: '(min-width: 1024px) 80vw, 85vw',
  detail: '(min-width: 1024px) 30vw, 85vw',
  pair: '(min-width: 1024px) 45vw, 85vw',
}

const countPhotos = (chapter: GalleryChapter) => chapter.items.filter((item) => item.role !== 'quote').length

/** Scene 4 — Album: photo journal theo chương; vai trò ảnh quyết định bố cục. */
export function Gallery({ content }: { content: WeddingContent }) {
  const { gallery, video } = content
  const ref = useRef<HTMLElement>(null)
  useSceneMotion(ref, 'gallery')

  // Lightbox duyệt liên tục qua mọi ảnh của mọi chương, theo đúng thứ tự trên trang.
  const photos = useMemo(
    () => gallery.flatMap((chapter) => chapter.items.filter((item): item is Photo => item.role !== 'quote')),
    [gallery],
  )

  function open(index: number) {
    const buttons = ref.current?.querySelectorAll<HTMLElement>('[data-photo-index]')
    if (!buttons) return
    const items = photos.map((photo, i) => ({ photo, element: buttons[i] }))
    openLightbox(items, index).catch(() => {
      // Không tải được PhotoSwipe: mở ảnh gốc ở tab mới thay vì không phản hồi.
      window.open(photos[index].image.img.src, '_blank', 'noopener')
    })
  }

  // Vị trí ảnh đầu tiên của mỗi chương trên toàn album.
  const chapterStarts = useMemo(
    () => gallery.map((_, i) => gallery.slice(0, i).reduce((sum, chapter) => sum + countPhotos(chapter), 0)),
    [gallery],
  )

  return (
    <SceneShell ref={ref} id="album" light="golden" labelledBy="gallery-title">
      <Stationery
        seed={21}
        sprigs={[]}
      />
      <SceneHeading id="gallery-title" eyebrow="Album ảnh cưới">
        Những khoảnh khắc
      </SceneHeading>

      {gallery.length === 0 && !video && <PendingNote>ảnh cưới (chia chương, ghi vai trò từng ảnh) và video.</PendingNote>}

      {gallery.map((chapter, index) => (
        <Chapter
          key={chapter.id}
          chapter={chapter}
          index={index}
          film={index === 1}
          firstPhoto={chapterStarts[index]}
          onOpen={open}
        />
      ))}

      {video && <VideoBlock video={video} />}
    </SceneShell>
  )
}

interface ChapterProps {
  chapter: GalleryChapter
  index: number
  /** Chương được dàn thành dải phim cuộn ngang trên desktop (khi bật motion). */
  film: boolean
  /** Vị trí của ảnh đầu tiên trong chương trên toàn album (cho lightbox). */
  firstPhoto: number
  onOpen: (photoIndex: number) => void
}

function Chapter({ chapter, index, film, firstPhoto, onOpen }: ChapterProps) {
  const headingId = `chapter-${chapter.id}`
  const photoCount = countPhotos(chapter)
  // Chỉ số ảnh trên toàn album cho từng mục (trích dẫn không tính).
  const photoIndexes = chapter.items.map(
    (_, i) => firstPhoto + chapter.items.slice(0, i).filter((item) => item.role !== 'quote').length,
  )

  return (
    <section className={styles.chapter} aria-labelledby={headingId} data-film={film}>
      <header className={styles.chapterHead} data-anim="chapter-head">
        <span className={styles.chapterIndex}>Chương {String(index + 1).padStart(2, '0')}</span>
        <h3 id={headingId} className={styles.chapterTitle}>
          {chapter.title}
        </h3>
        {chapter.caption && <p className={styles.chapterCaption}>{chapter.caption}</p>}
      </header>
      <ul className={styles.track} data-anim="track" aria-label={`${chapter.title}, ${photoCount} ảnh — vuốt ngang để xem`}>
        {chapter.items.map((item, itemIndex) => {
          if (item.role === 'quote') {
            return (
              <li key={itemIndex} className={styles.quote} data-role="quote">
                <blockquote>{item.text}</blockquote>
              </li>
            )
          }
          const current = photoIndexes[itemIndex]
          return (
            <li key={itemIndex} className={styles.item} data-role={item.role}>
              <figure>
                <button
                  type="button"
                  className={styles.frame}
                  data-photo-index={current}
                  aria-label={`Xem ảnh lớn: ${item.alt}`}
                  onClick={() => onOpen(current)}
                >
                  <ResponsivePicture image={item.image} alt={item.alt} sizes={SIZES[item.role]} className={styles.photo} />
                </button>
                {item.caption && <figcaption>{item.caption}</figcaption>}
              </figure>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
