import { describe, it, expect } from 'vitest'
import { frameAt, frameRect, type SpriteClip } from './frames'
const clip: SpriteClip = {fps:15,duration:27.4,frameCount:411,width:256,height:384,columns:4,perAtlas:16,actors:{bride:[],groom:[]}}
describe('media clock sprites',()=>{
  it('clamps the last partial frame and invalid times',()=>{
    expect(frameAt(clip,27.4)).toBe(410)
    expect(frameAt(clip,-1)).toBe(0)
    expect(frameAt(clip,NaN)).toBe(0)
  })
  it('supports seeks and loop resets without accumulated time',()=>{
    expect(frameAt(clip,12)).toBe(180)
    expect(frameAt(clip,2)).toBe(30)
    expect(frameAt(clip,0)).toBe(0)
  })
  it('selects atlas boundaries and cell coordinates',()=>{
    expect(frameRect(clip,15)).toEqual({atlas:0,x:768,y:1152})
    expect(frameRect(clip,16)).toEqual({atlas:1,x:0,y:0})
    expect(frameRect(clip,410)).toEqual({atlas:25,x:512,y:768})
  })
})
