import { SRGBColorSpace, TextureLoader, type Texture } from 'three'
import groomHead from '../../assets/chibi/approved/groom-head.webp'
import brideHead from '../../assets/chibi/approved/bride-head.webp'
import gown from '../../assets/chibi/approved/bride-gown.webp'

export interface CharacterArt { groom: Texture; bride: Texture; gown?: Texture }
let prepared: CharacterArt | undefined
let loading: Promise<CharacterArt> | undefined
export function preloadCharacterArt(): Promise<CharacterArt> {
  return loading ??= Promise.all([groomHead, brideHead, gown].map(url => new TextureLoader().loadAsync(url).then(texture => {
    texture.colorSpace = SRGBColorSpace; texture.anisotropy = 2; return texture
  }))).then(([groom, bride, gown]) => {
    return prepared = { groom, bride, gown }
  }).catch(error => { loading = undefined; throw error })
}
export function characterArt(): CharacterArt {
  if (!prepared) throw Error('Character artwork is not ready')
  return prepared
}
