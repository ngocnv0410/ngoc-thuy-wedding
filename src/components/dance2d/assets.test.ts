import { readFileSync, existsSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import type { SpriteClip } from './frames'
for (const id of ['ateez-bad','bang-bang-bang']) describe(`${id} shipped atlas`,()=>{
  it('contains every referenced frame with no missing atlas',()=>{
    const dir=`public/dance/${id}/`
    const clip: SpriteClip=JSON.parse(readFileSync(dir+'manifest.json','utf8'))
    expect(clip.fps).toBe(15)
    expect(clip.frameCount).toBe(Math.ceil(clip.duration*clip.fps))
    for(const actor of ['bride','groom'] as const){
      expect(clip.actors[actor].length).toBe(Math.ceil(clip.frameCount/clip.perAtlas))
      for(const name of clip.actors[actor]) expect(existsSync(dir+name), name).toBe(true)
    }
  })
})
