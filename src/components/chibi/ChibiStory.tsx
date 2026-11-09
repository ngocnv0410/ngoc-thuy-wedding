import { useRef } from 'react'
import { useSceneMotion } from '../../motion/useMotion'
import { Chibi, ChibiCouple } from './Chibi'
import { ChibiProp, PropArt } from './ChibiProp'
import type { ChibiSize, ChibiWho } from './chibiPose'
import styles from './ChibiStory.module.css'

export type StoryKind = 'welcome' | 'greeting' | 'calendar' | 'countdown' | 'map' | 'album' | 'letter' | 'thanks'

/** Each stage owns its rig; parent scene timelines must not animate these characters. */
export function ChibiStory({ kind, who, size = 'sm', className = '' }: {
  kind: StoryKind; who?: ChibiWho; size?: ChibiSize; className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  useSceneMotion(ref, 'chibi-story')
  const prop = kind === 'map' ? 'map' : kind === 'calendar' || kind === 'countdown' ? 'calendar' : kind === 'letter' || kind === 'thanks' ? 'envelope' : undefined
  return <span ref={ref} className={`${styles.stage} ${className}`} data-story={kind} aria-hidden="true">
    <svg className={styles.flourish} viewBox="0 0 240 180" focusable="false">
      <ellipse data-story-ring cx="120" cy="92" rx="83" ry="69" fill="none" stroke="currentColor" strokeWidth="0.7" />
      {kind === 'map' && <path data-story-route d="M25 146C48 155 57 104 92 116S143 147 172 83 195 52 216 35" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />}
    </svg>
    {Array.from({ length: 7 }, (_, i) => <span key={i} className={styles.spark} data-story-spark>{i % 3 ? '✦' : '♡'}</span>)}
    {(kind === 'letter' || kind === 'thanks') && <ChibiProp kind="envelope" className={styles.flyingLetter} anim="story-letter" />}
    {who ? <Chibi who={who} size={size} pose={prop ? 'carry' : 'stand'} held={prop && <g data-story-held><PropArt kind={prop} /></g>} />
      : prop ? <span className={styles.pair}>
        <Chibi who="groom" size={size} pose="carry" hand="l" held={<g data-story-held><PropArt kind={prop} /></g>} />
        <Chibi who="bride" size={size} pose="stand" />
      </span> : <ChibiCouple size={size} pose={kind === 'welcome' ? 'hold' : 'stand'} />}
  </span>
}
