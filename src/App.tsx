import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { AudioToggle } from './components/AudioToggle'
import { ChapterNav, type Chapter } from './components/ChapterNav'
import { LightLayer } from './components/LightLayer'
import { ToastProvider } from './components/ToastProvider'
import { wedding } from './content/wedding'
import { music } from './lib/music'
import { prefersMotion, loadMotion } from './motion/useMotion'
import { Details } from './scenes/Details/Details'
import { Countdown } from './scenes/Countdown/Countdown'
import { Gallery } from './scenes/Gallery/Gallery'
import { Gift } from './scenes/Gift/Gift'
import { Hero } from './scenes/Hero/Hero'
import { Locations } from './scenes/Locations/Locations'
import { Opening } from './scenes/Opening/Opening'

// Bản dev hiện cả scene chưa có dữ liệu (kèm ghi chú) để duyệt bố cục; production thì ẩn.
const SHOW_EMPTY = import.meta.env.DEV
const OPENED_KEY = 'thiep-da-mo'

if (wedding.music) music.configure(wedding.music.src)
// Bắt đầu tải chunk motion ngay, song song với lần render đầu.
if (prefersMotion()) loadMotion().catch(() => {})

/** Hiện màn mở cửa trừ khi khách vào thẳng một mục (#dia-diem…) hoặc đã mở trong phiên này. */
function shouldShowOpening(): boolean {
  const hash = window.location.hash
  if (hash && hash !== '#bia') return false
  try {
    return sessionStorage.getItem(OPENED_KEY) !== '1'
  } catch {
    return true
  }
}

function App() {
  const [opening, setOpening] = useState(shouldShowOpening)
  const focusHero = useRef(false)

  useLayoutEffect(() => {
    const root = document.documentElement
    if (opening) root.dataset.opening = 'on'
    else {
      delete root.dataset.opening
      // Focus only after React has removed inert from the invitation.
      if (focusHero.current) {
        document.getElementById('hero-title')?.focus({ preventScroll: true })
        focusHero.current = false
      }
    }
  }, [opening])

  const handleOpened = useCallback(() => {
    focusHero.current = true
    setOpening(false)
    try {
      sessionStorage.setItem(OPENED_KEY, '1')
    } catch {
      // Trình duyệt chặn storage: lần sau sẽ lại hiện màn mở cửa, không sao.
    }
  }, [])

  const replayOpening = useCallback(() => {
    window.scrollTo(0, 0)
    setOpening(true)
  }, [])

  const showLocations = SHOW_EMPTY || wedding.locations.length > 0
  const showGallery = SHOW_EMPTY || wedding.gallery.length > 0 || Boolean(wedding.video)

  const chapters: Chapter[] = [
    { id: 'bia', label: 'Bìa thiệp' },
    { id: 'thong-tin', label: 'Thông tin lễ cưới' },
    { id: 'dem-nguoc', label: 'Đếm ngược ngày cưới' },
    ...(showLocations ? [{ id: 'dia-diem', label: 'Địa điểm' }] : []),
    ...(showGallery ? [{ id: 'album', label: 'Album ảnh' }] : []),
    { id: 'mung-cuoi', label: 'Mừng cưới & lời cảm ơn' },
  ]

  return (
    <ToastProvider>
      <LightLayer />
      {opening && <Opening content={wedding} onDone={handleOpened} />}
      {/* Khi màn mở cửa đang hiện, phần thiệp phía sau không nhận focus/thao tác. */}
      <div className="app-shell" inert={opening}>
        <ChapterNav chapters={chapters} />
        {wedding.music && !opening && <AudioToggle />}
        <main>
          <Hero content={wedding} onReplay={opening ? undefined : replayOpening} />
          <Details content={wedding} />
          <Countdown content={wedding} />
          {showLocations && <Locations content={wedding} />}
          {showGallery && <Gallery content={wedding} />}
          <Gift content={wedding} />
        </main>
      </div>
    </ToastProvider>
  )
}

export default App
