import { growSprigs, gsap, riseIn, ScrollTrigger, washIn } from '../../lib/gsap'
import { animateSceneHeading } from '../../lib/sceneHeading'
import { idle, rig } from '../../motion/chibi'

export function locationsMotion(root: HTMLElement) {
  animateSceneHeading(root)
  washIn(root, root)
  growSprigs(root, root)

  for (const card of root.querySelectorAll<HTMLElement>('[data-anim="location"]')) {
    // Address and directions appear together, with no delayed interaction.
    riseIn(card, card, { y: 20, start: 'top 95%', stagger: 0 })
    const hosts = [...card.querySelectorAll<HTMLElement>('[data-anim="venue-host"]')]
    rig(hosts)
    idle(hosts, card)
    const waves = hosts.map((host, index) => {
      const freeArm = host.dataset.chibi === 'groom' ? '--arm-r' : '--arm-l'
      return gsap.timeline({ paused: true, repeat: -1, repeatDelay: 3.5, delay: index * 0.8 })
        .to(host, { [freeArm]: '125deg', duration: 0.6, ease: 'sine.inOut' })
        .to(host, { [freeArm]: '108deg', duration: 0.22, repeat: 3, yoyo: true, ease: 'sine.inOut' })
        .to(host, { [freeArm]: '6deg', duration: 0.6, ease: 'sine.inOut' })
    })
    const sync = (watcher: ScrollTrigger) => {
      const active = watcher.isActive && !document.hidden
      waves.forEach((wave) => active ? wave.play() : wave.pause())
    }
    const watcher = ScrollTrigger.create({ trigger: card, start: 'top bottom', end: 'bottom top', onToggle: sync, onRefresh: sync })
    sync(watcher)
    gsap.context(() => {
      const onVisibility = () => sync(watcher)
      document.addEventListener('visibilitychange', onVisibility)
      return () => document.removeEventListener('visibilitychange', onVisibility)
    })
  }
}
