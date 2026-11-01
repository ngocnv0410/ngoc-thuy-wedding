import groomStand from '../../assets/chibi/approved/groom-stand.webp'
import brideStand from '../../assets/chibi/approved/bride-stand.webp'
import type { ChibiWho } from './chibiPose'

/** Every pose is animated from the same two cached, jointed illustrations. */
export function approvedChibiArt(who: ChibiWho): string {
  return who === 'bride' ? brideStand : groomStand
}
