import { useRef } from 'react'
import { useSceneMotion } from '../../motion/useMotion'
import { Chibi, ChibiCouple } from './Chibi'
import { ChibiProp, PropArt, type PropKind } from './ChibiProp'
import type { ChibiSize, ChibiWho } from './chibiPose'
import styles from './ChibiStory.module.css'

export type StoryKind = 'welcome' | 'calendar' | 'map' | 'album' | 'promise' | 'gift' | 'letter' | 'thanks'

/** Each stage owns its rig; parent scene timelines must not animate these characters. */
export function ChibiStory({ kind, who, label, size = 'sm', className = '' }: {
  kind: StoryKind; who?: ChibiWho; label?: string; size?: ChibiSize; className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  useSceneMotion(ref, 'chibi-story')
  const props: Partial<Record<StoryKind, PropKind>> = { map: 'map', calendar: 'calendar', album: 'camera', letter: 'envelope', gift: 'gift' }
  const prop = props[kind]
  return <span ref={ref} className={`${styles.stage} ${className}`} data-story={kind} aria-hidden="true">
    {kind === 'map' && <svg className={styles.flourish} viewBox="0 0 240 180" focusable="false">
      <path data-story-route d="M25 146C48 155 57 104 92 116S143 147 172 83 195 52 216 35" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
    </svg>}
    {(kind === 'welcome' || kind === 'letter') && Array.from({ length: 3 }, (_, i) => <span key={i} className={styles.spark} data-story-spark>{i === 1 ? '♡' : '✦'}</span>)}
    {kind === 'letter' && <ChibiProp kind="envelope" className={styles.flyingLetter} anim="story-letter" />}
    {kind === 'album' && <span className={styles.cameraFlash} data-story-flash />}
    {kind === 'promise' && <svg className={styles.rings} data-story-rings viewBox="0 0 48 32" focusable="false">
      <circle cx="17" cy="19" r="10" /><circle cx="31" cy="19" r="10" />
      <path d="m25 5 6-4 6 4-6 6Z" />
    </svg>}
    {who ? <Chibi who={who} size={size} pose={prop ? 'carry' : 'stand'} held={prop && <g data-story-held><PropArt kind={prop} label={label} /></g>} />
      : prop ? <span className={styles.pair}>
        <Chibi who="groom" size={size} pose="carry" hand="l" held={<g data-story-held><PropArt kind={prop} label={label} /></g>} />
        <Chibi who="bride" size={size} pose="stand" />
      </span> : <ChibiCouple size={size} pose={kind === 'welcome' ? 'hold' : 'stand'} />}
  </span>
}
