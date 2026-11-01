import groomStand from '../../assets/chibi/approved/groom-stand.webp'
import brideStand from '../../assets/chibi/approved/bride-stand.webp'
import groomCarry from '../../assets/chibi/approved/groom-carry.webp'
import brideCarry from '../../assets/chibi/approved/bride-carry.webp'
import groomHeart from '../../assets/chibi/approved/groom-heart.webp'
import brideHeart from '../../assets/chibi/approved/bride-heart.webp'
import groomHead from '../../assets/chibi/approved/groom-head.webp'
import brideHead from '../../assets/chibi/approved/bride-head.webp'
import type { ChibiPose, ChibiWho } from './chibiPose'

const art = {
  groom: { stand: groomStand, carry: groomCarry, heart: groomHeart, head: groomHead },
  bride: { stand: brideStand, carry: brideCarry, heart: brideHeart, head: brideHead },
}
export function approvedChibiArt(who: ChibiWho, pose: ChibiPose = 'stand', headOnly = false): string {
  return art[who][headOnly ? 'head' : pose === 'carry' ? 'carry' : pose === 'heart' ? 'heart' : 'stand']
}
