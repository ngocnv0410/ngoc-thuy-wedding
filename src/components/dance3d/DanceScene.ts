import {
  ACESFilmicToneMapping, AmbientLight, CircleGeometry, DirectionalLight, HemisphereLight, Mesh, MeshBasicMaterial,
  OrthographicCamera, Scene, SRGBColorSpace, WebGLRenderer,
} from 'three'
import { music } from '../../lib/music'
import { createWeddingCharacter } from './character'
import { characterArt } from './approvedArt'
export { preloadCharacterArt } from './approvedArt'
import { sampleMotion, type MotionClip } from './motion'

export interface DanceSceneApi { setClip: (clip: MotionClip) => void; dispose: () => void }

export function createDanceScene(host: HTMLElement, options: {
  layout: 'couple' | 'hosts'; brideFirst: boolean; onFail: () => void
}): DanceSceneApi {
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = .95
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25))
  renderer.domElement.dataset.renderer = 'wedding-threejs'
  host.append(renderer.domElement)
  const scene = new Scene()
  const camera = new OrthographicCamera(-1.3, 1.3, 2.15, -.12, .1, 30)
  camera.position.set(0, 1.20, 8)
  camera.lookAt(0, 1.12, 0)
  scene.add(new HemisphereLight('#ffffff', '#eee8e4', 1.25), new AmbientLight('#ffffff', .45))
  const key = new DirectionalLight('#ffffff', 1.8); key.position.set(-3, 5, 6); scene.add(key)
  const rim = new DirectionalLight('#ffffff', .6); rim.position.set(3, 3, -3); scene.add(rim)
  const fill = new DirectionalLight('#f5f7ff', .5); fill.position.set(3, 2, 4); scene.add(fill)
  const actors = [createWeddingCharacter(options.brideFirst, characterArt()), createWeddingCharacter(!options.brideFirst, characterArt())]
  const shadowGeometry = new CircleGeometry(.32, 24)
  const shadowMaterial = new MeshBasicMaterial({ color: '#6f5140', transparent: true, opacity: .13, depthWrite: false })
  const shadows = actors.map(() => {
    const shadow = new Mesh(shadowGeometry, shadowMaterial)
    shadow.rotation.x = -Math.PI / 2; shadow.scale.y = .55; shadow.position.y = .006
    scene.add(shadow); return shadow
  })
  actors.forEach(actor => scene.add(actor.group))
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  let clip: MotionClip | undefined, frame = 0, lastDraw = -Infinity, disposed = false, visible = true, dirty = true
  const pose: number[] = []
  let framesDrawn = 0
  const active = () => visible && !document.hidden && !host.closest('[inert]')
  const draw = () => {
    if (!clip || !active() || disposed) return
    try {
      sampleMotion(clip, reduced.matches ? 0 : music.currentTime, pose)
      for (const actor of actors) actor.apply(pose)
      renderer.render(scene, camera)
      host.dataset.frames = String(++framesDrawn)
      host.dataset.mediaTime = String(reduced.matches ? 0 : music.currentTime)
    } catch { options.onFail() }
  }
  const step = (timestamp: number) => {
    frame = 0
    if (disposed || !active()) return
    if (dirty || timestamp - lastDraw >= 1000 / 30) { draw(); dirty = false; lastDraw = timestamp }
    if (!disposed && !reduced.matches && music.advancing) frame = requestAnimationFrame(step)
  }
  const wake = () => {
    dirty = true
    if (!disposed && !frame && active()) frame = requestAnimationFrame(step)
  }
  const resize = () => {
    const { width, height } = host.getBoundingClientRect()
    if (!width || !height || disposed) return
    renderer.setSize(Math.round(width), Math.round(height), false)
    const aspect = width / height
    const viewHeight = options.layout === 'hosts' ? 2.14 : Math.max(2.18, 2.35 / aspect)
    const viewWidth = viewHeight * aspect
    camera.left = -viewWidth / 2; camera.right = viewWidth / 2
    camera.top = viewHeight / 2; camera.bottom = -viewHeight / 2
    camera.position.set(0, viewHeight / 2 + .02, 8)
    camera.lookAt(0, viewHeight / 2 - .06, 0)
    camera.updateProjectionMatrix()
    const separation = options.layout === 'hosts' ? viewWidth * .36 : .49
    actors[0].group.position.x = -separation; actors[1].group.position.x = separation
    shadows[0].position.x = -separation; shadows[1].position.x = separation
    wake()
  }
  const lost = (event: Event) => { event.preventDefault(); options.onFail() }
  renderer.domElement.addEventListener('webglcontextlost', lost)
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host)
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake() })
  observer.observe(host)
  const openingObserver = new MutationObserver(wake)
  openingObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-opening'] })
  const unsubscribe = music.subscribe(wake)
  document.addEventListener('visibilitychange', wake)
  reduced.addEventListener('change', wake)
  resize()
  return {
    setClip(next) { clip = next; dirty = true; draw(); wake() },
    dispose() {
      if (disposed) return
      disposed = true
      cancelAnimationFrame(frame)
      unsubscribe(); resizeObserver.disconnect(); observer.disconnect(); openingObserver.disconnect()
      document.removeEventListener('visibilitychange', wake); reduced.removeEventListener('change', wake)
      renderer.domElement.removeEventListener('webglcontextlost', lost)
      actors.forEach(actor => actor.dispose())
      shadowGeometry.dispose(); shadowMaterial.dispose()
      renderer.dispose()
      if (!renderer.getContext().isContextLost()) renderer.forceContextLoss()
      renderer.domElement.remove()
    },
  }
}
