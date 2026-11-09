import { useRef } from 'react'
import { useSceneMotion } from '../../motion/useMotion'
import { Chibi, ChibiCouple } from './Chibi'
import { PropArt } from './ChibiProp'
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
    {who ? <Chibi who={who} size={size} pose={prop ? 'carry' : 'stand'} held={prop && <PropArt kind={prop} />} />
      : prop ? <span className={styles.pair}>
        <Chibi who="groom" size={size} pose="carry" hand="l" held={<PropArt kind={prop} />} />
        <Chibi who="bride" size={size} pose="stand" />
      </span> : <ChibiCouple size={size} pose={kind === 'welcome' ? 'hold' : 'stand'} />}
  </span>
}
