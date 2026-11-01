import { gsap, ScrollTrigger } from '../../lib/gsap'
import { blink, bow, rig } from '../../motion/chibi'

const STANDING = { '--arm-l': '6deg', '--arm-r': '6deg', '--eo': '1', '--eh': '0', '--heart': '0', '--heart-pulse': '0', '--heart-bloom': '0', '--head-r': '0deg', '--face-x': '0px' }
const HEART = { '--arm-l': '6deg', '--arm-r': '6deg', '--eo': '0', '--eh': '1', '--heart': '1' }

/** A complete farewell repeats while visible: bow, wave, look at each other, share a heart. */
export function closingMotion(root: HTMLElement) {
  const closing = root.querySelector('[data-anim="closing"]')
  const stage = root.querySelector('[data-anim="closing-stage"]')
  const groom = root.querySelector('[data-anim="bye-groom"]')
  const bride = root.querySelector('[data-anim="bye-bride"]')
  if (!closing || !stage || !groom || !bride) return
  const pair = [groom, bride]
  rig(pair)
  gsap.set(pair, STANDING)

  gsap.timeline({ defaults: { ease: 'power2.out' }, scrollTrigger: { trigger: closing, start: 'top 88%', once: true } })
    .from(stage, { autoAlpha: 0, y: 18, duration: 0.9 })
    .from(closing.querySelectorAll('[data-anim="closing-text"] > *'), { autoAlpha: 0, y: 10, duration: 0.7, stagger: 0.12 }, 0.35)

  const breathe = gsap.to(pair, { '--body-y': '-3px', duration: 1.5, stagger: 0.35, yoyo: true, repeat: -1, ease: 'sine.inOut', paused: true })
  const veil = gsap.to(bride, { '--veil': '3deg', '--skirt': '1.5deg', duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut', paused: true })
  const story = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.8, defaults: { ease: 'sine.inOut' } })
    .add(blink(pair), 0.2)
    .add(bow(pair, 0.8), 0.8)
    // Wave with the outer hands, keeping the two silhouettes easy to read.
    .to(groom, { '--arm-l': '128deg', '--head-r': '-5deg', '--eo': '0', '--eh': '1', duration: 0.65 }, 2.2)
    .to(groom, { '--arm-l': '112deg', duration: 0.32, repeat: 3, yoyo: true }, 2.85)
    .to(groom, { '--arm-l': '6deg', '--head-r': '0deg', duration: 0.55 }, 4.2)
    .to(bride, { '--arm-r': '128deg', '--head-r': '5deg', '--eo': '0', '--eh': '1', duration: 0.65 }, 3.8)
    .to(bride, { '--arm-r': '112deg', duration: 0.32, repeat: 3, yoyo: true }, 4.45)
    .to(bride, { '--arm-r': '6deg', '--head-r': '0deg', duration: 0.55 }, 5.8)
    .to(groom, { '--head-r': '7deg', '--face-x': '4px', duration: 0.6 }, 6.6)
    .to(bride, { '--head-r': '-7deg', '--face-x': '-4px', duration: 0.6 }, 6.6)
    .to(pair, { ...HEART, duration: 0.95 }, 7.4)
    .to(pair, { '--heart-pulse': '1', duration: 0.34, repeat: 3, yoyo: true }, 8.35)
    .to(pair, { '--heart-bloom': '1.4', duration: 2.3, ease: 'none' }, 8.4)
    .to(pair, { '--head-r': '0deg', '--face-x': '0px', duration: 0.6 }, 9.8)
    .to(pair, { ...STANDING, duration: 0.85 }, 11.2)

  const sync = (watcher: ScrollTrigger) => {
    const active = watcher.isActive && !document.hidden
    for (const loop of [breathe, veil, story]) {
      if (active) loop.play()
      else loop.pause()
    }
  }
  const watcher = ScrollTrigger.create({ trigger: stage, start: 'top bottom', end: 'bottom top', onToggle: sync, onRefresh: sync })
  sync(watcher)
  gsap.context(() => {
    const onVisibility = () => sync(watcher)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  })
}
