import { gsap, ScrollTrigger } from '../../lib/gsap'
import { blink, rig } from '../../motion/chibi'

/** A repeating little scene: breathe, wave, glance at each other and share a heart. */
export function countdownMotion(root: HTMLElement) {
  const stage = root.querySelector('[data-anim="countdown-stage"]')
  const groom = root.querySelector('[data-anim="countdown-groom"]')
  const bride = root.querySelector('[data-anim="countdown-bride"]')
  if (!stage || !groom || !bride) return
  const pair = [groom, bride]
  rig(pair)
  gsap.from(root.querySelector('[data-anim="countdown-card"]'), {
    y: 24, autoAlpha: 0, duration: 1, ease: 'power2.out',
    scrollTrigger: { trigger: root, start: 'top 85%', once: true },
  })
  const breathe = gsap.to(pair, {
    '--body-y': '-3px', duration: 1.6, stagger: 0.4, yoyo: true, repeat: -1, ease: 'sine.inOut', paused: true,
  })
  const story = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.5, defaults: { ease: 'sine.inOut' } })
    .add(blink(groom), 0.6)
    .add(blink(bride), 1)
    // Outer hand waves; the calendar and heart remain in their inner hands.
    .to(groom, { '--arm-l': '125deg', '--head-r': '-5deg', duration: 0.5 }, 1.8)
    .to(groom, { '--arm-l': '108deg', duration: 0.2, repeat: 3, yoyo: true }, 2.3)
    .to(groom, { '--arm-l': '6deg', '--head-r': '0deg', duration: 0.6 }, 3.2)
    .to(bride, { '--arm-r': '125deg', '--head-r': '5deg', duration: 0.5 }, 3.8)
    .to(bride, { '--arm-r': '108deg', duration: 0.2, repeat: 3, yoyo: true }, 4.3)
    .to(bride, { '--arm-r': '6deg', '--head-r': '0deg', duration: 0.6 }, 5.2)
    .to(groom, { '--head-r': '7deg', '--face-x': '4px', duration: 0.7 }, 6)
    .to(bride, { '--head-r': '-7deg', '--face-x': '-4px', '--arm-l': '82deg', '--veil': '-3deg', '--skirt': '-2deg', duration: 0.7 }, 6)
    .to(pair, { '--eo': '0', '--eh': '1', duration: 0.2 }, 6.8)
    .to(pair, { '--head-r': '0deg', '--eo': '1', '--eh': '0', duration: 0.6 }, 8.2)
    .to(bride, { '--arm-l': '70deg', '--veil': '0deg', '--skirt': '0deg', duration: 0.6 }, 8.2)

  const sync = (watcher: ScrollTrigger) => {
    const active = watcher.isActive && !document.hidden
    for (const loop of [breathe, story]) {
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
