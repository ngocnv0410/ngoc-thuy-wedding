import { gsap } from '../lib/gsap'
import { blink, bow, rig } from './chibi'
import { visibleLoops } from './visibleLoops'

/** Each chapter owns a different gesture. Feet and whole-body position stay fixed. */
export function storyMotion(root: HTMLElement) {
  const hosts = [...root.querySelectorAll<HTMLElement>('[data-chibi]')]
  if (!hosts.length) return
  rig(hosts)
  const [first, second] = hosts
  const kind = root.dataset.story
  const reach = Math.min(1, root.clientWidth / 150)
  const held = root.querySelector('[data-story-held]')
  const letter = root.querySelector('[data-anim="story-letter"]')
  const route = root.querySelector('[data-story-route]')
  const sparks = [...root.querySelectorAll('[data-story-spark]')]
  const poseKeys = ['arm-l', 'arm-r', 'upper-r', 'head-r', 'head-y', 'face-x', 'eo', 'ec', 'eh', 'heart', 'heart-pulse', 'heart-bloom']
  const rest = hosts.map(el => Object.fromEntries(poseKeys.map(key => [`--${key}`, el.style.getPropertyValue(`--pose-${key}`)])))
  const holdingArm = (el: HTMLElement) => `--arm-${el.querySelector('[data-held]')?.getAttribute('data-held') ?? (el.dataset.chibi === 'bride' ? 'l' : 'r')}`
  const freeArm = (el: HTMLElement) => holdingArm(el) === '--arm-l' ? '--arm-r' : '--arm-l'
  const tl = gsap.timeline({ paused: true, delay: 0.8, repeat: -1, repeatDelay: 4, defaults: { ease: 'sine.inOut' } })
  const reset = (at: number) => hosts.forEach((el, i) => tl.to(el, { ...rest[i], duration: 0.8 }, at))
  const glints = (at: number) => sparks.slice(0, 3).forEach((spark, i) => {
    tl.fromTo(spark, { opacity: 0, x: (i - 1) * 28 * reach, y: -15, scale: 0.4 },
      { opacity: 0.8, y: -36, scale: 0.8, duration: 0.6 }, at + i * 0.15)
      .to(spark, { opacity: 0, y: -48, duration: 0.7 }, at + 0.7 + i * 0.15)
  })
  const entrance = gsap.fromTo(hosts, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7, stagger: 0.1, paused: true, ease: 'sine.out' })
  tl.add(blink(hosts), 0.1)

  switch (kind) {
    case 'welcome':
      // Cover: an outer-hand greeting, then a quiet glance and clasped hands.
      tl.to(first, { '--arm-l': '120deg', '--head-r': '-4deg', duration: 0.7 }, 0.6)
        .to(first, { '--arm-l': '108deg', duration: 0.3, repeat: 1, yoyo: true }, 1.3)
        .to(first, { '--arm-l': '6deg', '--head-r': '7deg', '--face-x': '4px', duration: 0.7 }, 2)
      if (second) tl.to(second, { '--head-r': '-9deg', '--face-x': '-4px', '--eo': '0', '--eh': '1', duration: 0.8 }, 2.1)
      glints(2.9)
      reset(4.5)
      break
    case 'calendar': {
      // Wedding details: lift the actual wedding date and circle it, then point to it.
      tl.to(first, { [holdingArm(first)]: '88deg', '--head-r': '-6deg', '--face-x': '-3px', duration: 0.8 }, 0.6)
      const date = root.querySelector('[data-story-day-mark]')
      if (date) tl.fromTo(date, { opacity: 0, strokeDasharray: '51', strokeDashoffset: 51 }, { opacity: 1, strokeDashoffset: 0, duration: 1 }, 1.5)
        .to(date, { opacity: 0, duration: 0.5 }, 4.5)
      if (second) tl.to(second, { '--arm-l': '85deg', '--head-r': '-7deg', '--face-x': '-4px', duration: 0.8 }, 1.8)
        .to(second, { '--head-r': '0deg', '--face-x': '0px', '--eo': '0', '--eh': '1', duration: 0.6 }, 3.2)
      reset(4.7)
      break
    }
    case 'map':
      // Directions: study the map, follow the route, indicate the destination.
      tl.to(first, { '--head-r': '-9deg', '--face-x': '-4px', [holdingArm(first)]: '80deg', duration: 0.8 }, 0.6)
      if (route) tl.fromTo(route, { opacity: 0, strokeDashoffset: 110 }, { opacity: 0.8, strokeDashoffset: 0, duration: 1.5, ease: 'power1.inOut' }, 1.6)
        .to(route, { opacity: 0, duration: 0.7 }, 4.4)
      tl.to(first, { [freeArm(first)]: '96deg', '--head-r': '5deg', '--face-x': '4px', duration: 0.8 }, 2.6)
      reset(5)
      break
    case 'album': {
      // Photo chapter: raise the camera, hold for the portrait, one soft shutter flash.
      const flash = root.querySelector('[data-story-flash]')
      tl.to(first, { [holdingArm(first)]: '112deg', [freeArm(first)]: '58deg', '--head-r': '-4deg', duration: 0.9 }, 0.6)
      if (second) tl.to(second, { '--arm-r': '102deg', '--head-r': '8deg', '--eo': '0', '--eh': '1', duration: 0.8 }, 1.1)
      if (flash) tl.fromTo(flash, { opacity: 0, scale: 0.6 }, { opacity: 0.65, scale: 1, duration: 0.18 }, 2.4)
        .to(flash, { opacity: 0, duration: 0.6 }, 2.58)
      tl.to(first, { [holdingArm(first)]: '70deg', [freeArm(first)]: '6deg', '--head-r': '7deg', '--face-x': '4px', duration: 0.8 }, 3.2)
      reset(4.7)
      break
    }
    case 'promise': {
      // Vows chapter: meet hands around the wedding rings, then acknowledge the promise.
      const rings = root.querySelector('[data-story-rings]')
      tl.to(first, { '--arm-r': '60deg', '--head-r': '7deg', '--face-x': '4px', duration: 1 }, 0.6)
      if (second) tl.to(second, { '--arm-l': '40deg', '--head-r': '-7deg', '--face-x': '-4px', duration: 1 }, 0.8)
      if (rings) tl.fromTo(rings, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.9 }, 1.8)
        .to(rings, { opacity: 0, duration: 0.8 }, 4.6)
      tl.to(hosts, { '--eo': '0', '--eh': '1', duration: 0.5 }, 2.8)
      reset(5.2)
      break
    }
    case 'letter':
      // Guestbook: offer the guest's letter, which travels independently of the standing host.
      tl.to(first, { [holdingArm(first)]: '101deg', '--head-r': '-5deg', duration: 0.8 }, 0.6)
      if (letter && held) tl.set(held, { opacity: 0 }, 1.5)
        .fromTo(letter, { autoAlpha: 0, x: -25 * reach, y: 4, rotation: -15, scale: 0.65 }, { autoAlpha: 1, x: -38 * reach, y: -25, rotation: -24, scale: 1, duration: 0.4 }, 1.5)
        .to(letter, { x: 10 * reach, y: -55, rotation: 8, duration: 0.5 }, 1.9)
        .to(letter, { x: 44 * reach, y: -30, rotation: 25, scale: 0.5, autoAlpha: 0, duration: 0.5 }, 2.4)
        .set(held, { opacity: 1 }, 4.6)
      tl.to(first, { '--head-r': '4deg', '--face-x': '4px', duration: 0.7 }, 2.4)
      glints(2.7)
      reset(4.8)
      break
    case 'thanks':
      // Receipt: hand over heart and bow. No second outgoing letter or repeated invitation.
      tl.to(first, { '--heart': '1', '--eo': '0', '--eh': '1', duration: 0.9 }, 0.7)
        .to(first, { '--heart-pulse': '1', duration: 0.5, repeat: 1, yoyo: true }, 1.6)
        .add(bow(first, 0.9), 2.9)
      reset(4.6)
      break
    case 'gift':
      // Gift card: present the gift box with a grateful nod; keep it in hand.
      tl.to(first, { [holdingArm(first)]: '85deg', [freeArm(first)]: '44deg', '--head-r': '-5deg', duration: 0.9 }, 0.7)
        .to(first, { '--head-r': '5deg', '--eo': '0', '--eh': '1', duration: 0.7 }, 2)
        .to(first, { '--head-r': '0deg', duration: 0.7 }, 3)
      reset(4.5)
      break
  }
  // Keep effects inside the stage; chapter actors never translate, bounce or change leg pose.
  visibleLoops(root, [entrance, tl])
}
