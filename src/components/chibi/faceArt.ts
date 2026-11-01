import groomOpen from '../../assets/chibi/approved/groom-open-face.webp'
import groomClosed from '../../assets/chibi/approved/groom-closed-face.webp'
import groomHappy from '../../assets/chibi/approved/groom-happy-face.webp'
import brideOpen from '../../assets/chibi/approved/bride-open-face.webp'
import brideClosed from '../../assets/chibi/approved/bride-closed-face.webp'
import brideHappy from '../../assets/chibi/approved/bride-happy-face.webp'

export const faceArt = {
  // Let the painted chin overlap the collar instead of exposing the cut edge.
  groom: { open: groomOpen, closed: groomClosed, happy: groomHappy, x: 15, y: 10, width: 89, height: 94 },
  bride: { open: brideOpen, closed: brideClosed, happy: brideHappy, x: 19, y: 16, width: 82, height: 81 },
}
