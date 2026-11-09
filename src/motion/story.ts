import { gsap } from '../lib/gsap'
import { blink, bow, rig } from './chibi'
import { visibleLoops } from './visibleLoops'

/** A finite phrase with a rest between repeats; never tied to React clock updates. */
export function storyMotion(root: HTMLElement) {
  const hosts = [...root.querySelectorAll<HTMLElement>('[data-chibi]')]
  if (!hosts.length) return
  rig(hosts)
  const kind = root.dataset.story
  const rest = hosts.map((el) => Object.fromEntries(['arm-l', 'arm-r', 'head-r', 'face-x', 'eo', 'ec', 'eh', 'heart', 'heart-pulse', 'heart-bloom'].map((key) => [`--${key}`, el.style.getPropertyValue(`--pose-${key}`)])))
  const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.5, defaults: { ease: 'sine.inOut' } })
  tl.add(blink(hosts), 0.2)
  if (kind === 'greeting' || kind === 'thanks') tl.add(bow(hosts, 0.7), 0.7)
  if (kind === 'map') {
    tl.to(hosts, { '--head-r': '-7deg', '--face-x': '-3px', duration: 0.7 }, 0.6)
  }
  const letterAt = kind === 'thanks' ? 2.1 : 1.2
  if (kind === 'letter' || kind === 'thanks') {
    hosts.forEach((el, i) => {
      const hand = el.dataset.chibi === 'groom' ? (hosts.length > 1 ? '--arm-l' : '--arm-r') : '--arm-l'
      tl.to(el, { [hand]: '92deg', '--head-r': '-5deg', duration: 0.7 }, letterAt)
        .to(el, { ...rest[i], duration: 0.65 }, letterAt + 1.3)
    })
  }
  hosts.forEach((el, i) => {
    const at = (kind === 'letter' || kind === 'thanks' ? letterAt + 2.4 : 1.8) + i * 1.4
    // A held prop stays in the inner/default hand; gesture with the free hand.
    const held = kind === 'map' || kind === 'calendar' || kind === 'countdown' || kind === 'letter' || kind === 'thanks'
    const free = el.dataset.chibi === 'groom' ? (hosts.length > 1 ? '--arm-r' : '--arm-l') : '--arm-r'
    const arm = held ? free : el.dataset.chibi === 'groom' ? '--arm-l' : '--arm-r'
    const point = kind === 'calendar' || kind === 'countdown' || kind === 'album' || kind === 'map'
    tl.to(el, { '--head-r': `${i % 2 ? -6 : 6}deg`, '--face-x': point ? '4px' : '0px', [arm]: point ? '85deg' : '126deg', duration: 0.6 }, at)
      .to(el, { [arm]: point ? '76deg' : '108deg', duration: 0.3, repeat: 3, yoyo: true }, at + 0.6)
      .to(el, { ...rest[i], duration: 0.65 }, at + 1.9)
  })
  if (kind === 'welcome' || kind === 'album') {
    const at = tl.duration() + 0.4
    hosts.forEach((el, i) => tl.to(el, { '--head-r': `${i ? -7 : 7}deg`, '--face-x': `${i ? -4 : 4}px`, duration: 0.6 }, at - 0.3))
    tl.to(hosts, { '--heart': '1', '--eo': '0', '--eh': '1', duration: 0.9 }, at)
      .to(hosts, { '--heart-pulse': '1', duration: 0.35, repeat: 3, yoyo: true }, at + 0.9)
      .to(hosts, { '--heart-bloom': '1.4', duration: 1.8 }, at + 1)
    hosts.forEach((el, i) => tl.to(el, { ...rest[i], duration: 0.8 }, at + 3))
  }
  const bob = gsap.to(hosts, { '--body-y': '-3px', duration: 1.4, stagger: 0.25, yoyo: true, repeat: -1, paused: true, ease: 'sine.inOut' })
  visibleLoops(root, [tl, bob])
}
