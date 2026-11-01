import { MirroredRepeatWrapping, SRGBColorSpace, TextureLoader, type Texture } from 'three'
import groomHead from '../../assets/chibi/approved/groom-head.webp'
import brideHead from '../../assets/chibi/approved/bride-head.webp'
import coat from '../../assets/chibi/approved/groom-coat.webp'
import gown from '../../assets/chibi/approved/bride-gown.webp'
import hairDetail from '../../assets/chibi/approved/hair-detail.webp'
import metadata from '../../assets/chibi/approved/metadata.json'

export interface CharacterArt { groom: Texture; bride: Texture; coat?: Texture; gown?: Texture; hair?: Texture }
let prepared: CharacterArt | undefined
let loading: Promise<CharacterArt> | undefined
export function preloadCharacterArt(): Promise<CharacterArt> {
  return loading ??= Promise.all([groomHead, brideHead, coat, gown, hairDetail].map(url => new TextureLoader().loadAsync(url).then(texture => {
    texture.colorSpace = SRGBColorSpace; texture.anisotropy = 2; return texture
  }))).then(([groom, bride, coat, gown, hair]) => {
    hair.wrapS = MirroredRepeatWrapping; hair.wrapT = MirroredRepeatWrapping; hair.repeat.set(2, 2)
    return prepared = { groom, bride, coat, gown, hair }
  }).catch(error => { loading = undefined; throw error })
}
export function characterArt(): CharacterArt {
  if (!prepared) throw Error('Character artwork is not ready')
  return prepared
}
export function approvedHeadSize(bride: boolean) {
  const source = metadata.heads[bride ? 'bride' : 'groom']
  const unit = 1.03 / Math.max(metadata.heads.groom.height, metadata.heads.bride.height)
  return { width: source.width * unit, height: source.height * unit }
}
