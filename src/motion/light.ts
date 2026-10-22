import { ScrollTrigger, gsap } from '../lib/gsap'

/** Màu nền trang theo tông ánh sáng của từng scene (khớp SceneShell.module.css). */
const PAGE_BG: Record<string, string> = {
  morning: '#f8f4ec',
  noon: '#f8f4ec',
  afternoon: '#efe8da',
  golden: '#f2ebdc',
  candle: '#302720',
}

/**
 * "Một ngày cưới viết bằng ánh sáng": nền trang chuyển màu mềm giữa các scene và một vệt
 * sáng rất nhẹ đi theo hành trình cuộn — rạng đông góc trái → chính ngọ → nắng chiều → ánh nến.
 * Gọi trong `gsap.matchMedia()` (chỉ khi không reduced-motion); trả về hàm dọn dẹp.
 */
export function startLight(): () => void {
  const root = document.documentElement
  const body = document.body
  const triggers: ScrollTrigger[] = []

  for (const scene of gsap.utils.toArray<HTMLElement>('main > [data-light]')) {
    const color = PAGE_BG[scene.dataset.light ?? 'noon']
    triggers.push(
      ScrollTrigger.create({
        trigger: scene,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (self.isActive) gsap.to(body, { backgroundColor: color, duration: 0.9, ease: 'silk', overwrite: 'auto' })
        },
      }),
    )
  }

  const layer = document.getElementById('light-layer')
  const path = layer
    ? gsap
        .timeline({
          defaults: { ease: 'none' },
          // Kết thúc khi scene ánh nến (nền tối) bắt đầu: từ đó vệt sáng ở mức rất nhẹ, không phủ
          // lớp vàng lên nền espresso làm giảm tương phản chữ.
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            endTrigger: document.querySelector('[data-light="candle"]') ?? root,
            end: document.querySelector('[data-light="candle"]') ? 'top 70%' : 'bottom bottom',
            scrub: 1.2,
          },
        })
        .fromTo(
          layer,
          { '--lx': '12%', '--ly': '6%', '--lo': 0.5, '--lc': 'rgba(255, 244, 222, 1)' },
          { '--lx': '50%', '--ly': '2%', '--lo': 0.35, '--lc': 'rgba(255, 249, 238, 1)' },
        )
        .to(layer, { '--lx': '80%', '--ly': '18%', '--lo': 0.55, '--lc': 'rgba(236, 206, 150, 1)' })
        // Ánh nến trên nền espresso: giữ rất nhẹ để chữ vàng vẫn đủ tương phản.
        .to(layer, { '--lx': '50%', '--ly': '0%', '--lo': 0.14, '--lc': 'rgba(198, 166, 107, 1)' })
    : undefined

  return () => {
    triggers.forEach((trigger) => trigger.kill())
    path?.scrollTrigger?.kill()
    path?.kill()
    gsap.set(body, { clearProps: 'backgroundColor' })
  }
}
