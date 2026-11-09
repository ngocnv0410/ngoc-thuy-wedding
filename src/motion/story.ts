import { gsap } from '../lib/gsap'
import { blink, bow, rig } from './chibi'
import { visibleLoops } from './visibleLoops'

/** Authored phrases: anticipation, action, follow-through, then a quiet hold. */
export function storyMotion(root: HTMLElement) {
  const hosts = [...root.querySelectorAll<HTMLElement>('[data-chibi]')]
  if (!hosts.length) return
  rig(hosts)
  const kind = root.dataset.story
  const reach = Math.min(1, root.clientWidth / 150)
  const sparks = [...root.querySelectorAll('[data-story-spark]')]
  const ring = root.querySelector('[data-story-ring]')
  const route = root.querySelector('[data-story-route]')
  const letter = root.querySelector('[data-anim="story-letter"]')
  const held = root.querySelector('[data-story-held]')
  const rest = hosts.map(el => Object.fromEntries(['arm-l', 'arm-r', 'upper-r', 'head-r', 'face-x', 'eo', 'ec', 'eh', 'heart', 'heart-pulse', 'heart-bloom', 'leg-l', 'leg-r', 'skirt'].map(key => [`--${key}`, el.style.getPropertyValue(`--pose-${key}`)])))
  const tl = gsap.timeline({ paused: true, delay: 1.1, repeat: -1, repeatDelay: 3, defaults: { ease: 'sine.inOut' } })

  const burst = (at: number, width = 50) => {
    sparks.forEach((spark, i) => {
      const angle = -Math.PI + i * Math.PI / 6
      tl.fromTo(spark, { x: 0, y: 8, scale: 0.3, opacity: 0, rotation: 0 }, {
        x: Math.cos(angle) * width * reach, y: Math.sin(angle) * 55 * reach - 12,
        scale: i % 2 ? 0.8 : 1.1, opacity: 0.9, rotation: (i - 3) * 14,
        duration: 0.65, ease: 'power3.out',
      }, at + i * 0.035).to(spark, { y: '-=16', opacity: 0, scale: 0.35, duration: 0.75 }, at + 0.7 + i * 0.035)
    })
    if (ring) tl.fromTo(ring, { scale: 0.65, opacity: 0 }, { scale: 1, opacity: 0.5, duration: 0.5 }, at)
      .to(ring, { scale: 1.13, opacity: 0, duration: 0.85 }, at + 0.5)
  }
  const reset = (at: number) => hosts.forEach((el, i) => tl.to(el, { ...rest[i], x: 0, y: 0, rotation: 0, scale: 1, duration: 0.7 }, at))
  const entrance = gsap.timeline({ paused: true })
    .fromTo(hosts, { autoAlpha: 0, y: 18, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.12, ease: 'back.out(1.35)' })

  tl.add(blink(hosts), 0.2)
  if (kind === 'letter' || kind === 'thanks') {
    const host = hosts[0]
    const hand = host.dataset.chibi === 'bride' ? '--arm-l' : '--arm-r'
    const free = hand === '--arm-l' ? '--arm-r' : '--arm-l'
    // Anticipate, present the letter, and send it in a rising arc.
    tl.to(host, { '--upper-r': '-6deg', '--head-r': '7deg', y: 3, duration: 0.4 }, 0.6)
      .to(host, { [hand]: '101deg', '--upper-r': '5deg', '--head-r': '-5deg', y: -6, duration: 0.55, ease: 'back.out(1.4)' }, 1)
    if (letter && held) {
      tl.set(held, { opacity: 0 }, 1.55)
        .fromTo(letter, { autoAlpha: 0, x: -25 * reach, y: 4, rotation: -15, scale: 0.65 }, { autoAlpha: 1, x: -38 * reach, y: -25, rotation: -24, scale: 1, duration: 0.35, ease: 'power2.out' }, 1.55)
        .to(letter, { x: 10 * reach, y: -55, rotation: 8, duration: 0.45, ease: 'sine.inOut' }, 1.9)
        .to(letter, { x: 44 * reach, y: -30, rotation: 25, scale: 0.5, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, 2.35)
        .set(held, { opacity: 1 }, 4.7)
    }
    tl.to(host, { '--eo': '0', '--eh': '1', [free]: '116deg', '--upper-r': '0deg', y: 0, duration: 0.45 }, 2.1)
    burst(2.35, 48)
    if (kind === 'thanks') tl.add(bow(host, 1), 3.2)
    reset(4.8)
  } else if (kind === 'welcome' || kind === 'album' || kind === 'greeting') {
    // Two-step approach, shared glance, then a heart reveal together.
    hosts.forEach((host, i) => {
      const dir = i ? -1 : 1
      tl.to(host, { x: -dir * 10, '--upper-r': `${-dir * 5}deg`, '--leg-l': '-12deg', '--leg-r': '12deg', '--skirt': '-3deg', duration: 0.35 }, 0.6 + i * 0.18)
        .to(host, { x: dir * 5, y: -9, '--upper-r': `${dir * 4}deg`, '--leg-l': '12deg', '--leg-r': '-12deg', '--skirt': '3deg', duration: 0.45, ease: 'power2.out' }, 0.95 + i * 0.18)
        .to(host, { x: 0, y: 0, '--upper-r': '0deg', '--leg-l': '0deg', '--leg-r': '0deg', '--skirt': '0deg', '--head-r': `${dir * 9}deg`, '--face-x': `${dir * 4}px`, duration: 0.5 }, 1.4 + i * 0.18)
    })
    if (kind === 'greeting') tl.add(bow(hosts, 1), 2.2)
    tl.to(hosts, { '--heart': '1', '--eo': '0', '--eh': '1', duration: 0.85 }, 3.2)
      .to(hosts, { '--heart-pulse': '1', duration: 0.3, yoyo: true, repeat: 3 }, 4.05)
      .to(hosts, { '--heart-bloom': '1.4', duration: 1.7 }, 4.05)
    burst(4.1, kind === 'welcome' ? 65 : 46)
    reset(6.1)
  } else {
    const host = hosts[0]
    const free = host.dataset.chibi === 'groom' ? '--arm-l' : '--arm-r'
    tl.to(host, { '--head-r': '-9deg', '--face-x': '-4px', '--upper-r': '-4deg', duration: 0.6 }, 0.6)
      .to(host, { x: 8, y: -5, '--upper-r': '5deg', [free]: '98deg', '--head-r': '5deg', '--face-x': '4px', duration: 0.55, ease: 'back.out(1.6)' }, 1.4)
      .to(host, { y: 0, duration: 0.35 }, 1.95)
    if (route) tl.fromTo(route, { opacity: 0, strokeDashoffset: 110 }, { opacity: 0.7, strokeDashoffset: 0, duration: 1.2, ease: 'power2.out' }, 1.6)
      .to(route, { opacity: 0, duration: 0.7 }, 4)
    burst(2.2, 46)
    reset(4.8)
  }
  // No independent bobbing loop: the full body and hands belong to one choreographed phrase.
  visibleLoops(root, [entrance, tl])
}
