import { Canvas, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BoxGeometry, type Group, MathUtils, type Mesh, MeshBasicMaterial, MeshStandardMaterial, Vector2 } from 'three'
import { holdPaint } from '../../../components/decor/paint'
import { gsap, guard } from '../../../lib/gsap'
import { DOOR_DEPTH, SEAL_R } from './dimensions'
import { fitTexture, sealHalfGeometry } from './geometry'
import { type DoorTextures, doorTextures, glowTexture, loadTextureFonts, sealTexture } from './textures'

export interface Doors3DText {
  first: string
  second: string
  monogram: string
}

export interface OpenCallbacks {
  onReveal: () => void
  onDone: () => void
}

export interface Doors3DApi {
  /** Vẽ lại theo khung hình hiện tại (gọi ngay trước khi hiện lớp 3D). */
  refit: () => void
  /** Dấu sáp "thở" chờ được chạm. */
  startIdle: () => void
  open: (root: HTMLElement, callbacks: OpenCallbacks) => { fastForward: () => void; finish: () => void }
}

export interface Doors3DProps {
  /** Hai cánh cửa 2.5D — bản 3D phủ đúng khung đó (toàn màn hình). */
  stage: HTMLElement
  text: Doors3DText
  onReady: (api: Doors3DApi) => void
  /** Mất WebGL context hoặc lỗi dựng scene: quay về bản 2.5D. */
  onFail: () => void
  /** Khách chạm vào dấu sáp 3D. */
  onOpenRequest: () => void
}

const CAMERA_Z = 5
const FOV = 30
/** Góc mở của mỗi cánh (~96°, quay vào trong). */
const SWING = MathUtils.degToRad(96)
/** Cỡ dấu sáp 2.5D (Opening.module.css: clamp(64px, 18vw, 96px)). */
const sealPixels = (width: number) => Math.min(96, Math.max(64, width * 0.18))

/**
 * Scene 0 (bản 3D) — chỉ tải cho máy đủ mạnh. Cùng hoạ tiết với bản 2.5D nhưng cánh cửa có độ
 * dày, hoa văn nổi thật dưới ánh sáng (normal map), dấu sáp đổ bóng lên cửa; khi mở, hai cánh
 * quay quanh bản lề và camera tiến qua khung cửa.
 */
export default function Doors3D(props: Doors3DProps) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      flat
      shadows="soft"
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: FOV, position: [0, 0, CAMERA_Z], near: 0.1, far: 20 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault()
          props.onFail()
        })
      }}
      aria-hidden="true"
    >
      <Scene {...props} />
    </Canvas>
  )
}

interface Textures {
  left: DoorTextures
  right: DoorTextures
}

function disposeTextures(textures: Textures | null) {
  if (!textures) return
  for (const door of [textures.left, textures.right]) {
    door.map.dispose()
    door.normal.dispose()
  }
}

function Scene({ text, onReady, onOpenRequest }: Doors3DProps) {
  // Đọc trạng thái mới nhất (camera, invalidate) qua get() — các hàm dưới được gọi về sau.
  const get = useThree((state) => state.get)
  const size = useThree((state) => state.size)

  // Kích thước mặt phẳng cửa (z = 0) phủ vừa khít khung hình.
  const viewport = useMemo(() => {
    const h = 2 * CAMERA_Z * Math.tan(MathUtils.degToRad(FOV / 2))
    return { w: (h * size.width) / size.height, h, ppu: size.height / h }
  }, [size.width, size.height])

  const hingeLeft = useRef<Group>(null)
  const hingeRight = useRef<Group>(null)
  const seal = useRef<Group>(null)
  const sealPress = useRef<Group>(null)
  const sealLeft = useRef<Mesh>(null)
  const sealRight = useRef<Mesh>(null)
  const glow = useRef<Mesh>(null)

  // Texture vẽ bằng font của trang: chờ font (đúng subset tiếng Việt) trước khi vẽ. Vẽ lại theo
  // tỉ lệ màn hình (xoay máy) — hoạ tiết luôn "contain" trong cánh như bản 2.5D.
  const [fontsReady, setFontsReady] = useState(false)
  useEffect(() => {
    let cancelled = false
    loadTextureFonts(text.monogram).then(() => !cancelled && setFontsReady(true))
    return () => {
      cancelled = true
    }
  }, [text])

  const [textures, setTextures] = useState<Textures | null>(null)
  const built = useRef<Textures | null>(null)
  useEffect(() => {
    if (!fontsReady) return
    const timer = window.setTimeout(
      () => {
        const scale = Math.min(window.devicePixelRatio || 1, 1.5, 2048 / size.height)
        const w = Math.round((size.width / 2) * scale)
        const h = Math.round(size.height * scale)
        const next = { left: doorTextures('left', w, h), right: doorTextures('right', w, h) }
        disposeTextures(built.current)
        built.current = next
        setTextures(next)
      },
      built.current ? 200 : 0,
    )
    return () => window.clearTimeout(timer)
  }, [fontsReady, size.width, size.height, text])
  useEffect(() => () => disposeTextures(built.current), [])

  const shared = useMemo(
    () => ({
      seal: fitTexture(sealTexture(text.monogram), -SEAL_R, -SEAL_R, SEAL_R * 2, SEAL_R * 2),
      glow: glowTexture(),
      sealLeft: sealHalfGeometry('left'),
      sealRight: sealHalfGeometry('right'),
    }),
    [text.monogram],
  )

  const materials = useMemo(() => {
    if (!textures) return null
    const face = (door: DoorTextures) =>
      new MeshStandardMaterial({ map: door.map, normalMap: door.normal, normalScale: new Vector2(1, 1), roughness: 0.82, metalness: 0 })
    const edge = new MeshStandardMaterial({ color: '#d9c4b3', roughness: 0.9, metalness: 0 })
    return {
      edge,
      left: face(textures.left),
      right: face(textures.right),
      // Ít kim loại: scene không có môi trường phản chiếu, kim loại cao sẽ xỉn tối so với bản 2.5D.
      sealCap: new MeshStandardMaterial({ map: shared.seal, metalness: 0.08, roughness: 0.45, transparent: true }),
      sealSide: new MeshStandardMaterial({ color: '#b8955a', metalness: 0.08, roughness: 0.5, transparent: true }),
      glow: new MeshBasicMaterial({ map: shared.glow, transparent: true, opacity: 0, depthWrite: false }),
    }
  }, [textures, shared])

  const doorGeometry = useMemo(() => new BoxGeometry(viewport.w / 2, viewport.h, DOOR_DEPTH), [viewport])

  useEffect(() => () => doorGeometry.dispose(), [doorGeometry])
  useEffect(
    () => () => {
      shared.seal.dispose()
      shared.glow.dispose()
      shared.sealLeft.dispose()
      shared.sealRight.dispose()
    },
    [shared],
  )
  useEffect(
    () => () => {
      if (materials) Object.values(materials).forEach((material) => material.dispose())
    },
    [materials],
  )

  const refit = useCallback(() => get().invalidate(), [get])

  // Báo sẵn sàng sau khi khung hình đầu tiên có texture đã được vẽ.
  const readyFired = useRef(false)
  useEffect(() => {
    if (!materials || readyFired.current) return
    readyFired.current = true
    const { invalidate } = get()
    invalidate()
    let breathing: gsap.core.Tween | undefined

    const openTimeline = (root: HTMLElement, { onReveal, onDone }: OpenCallbacks) => {
      const m = materials
      const camera = get().camera
      holdPaint(2800)
      sealPress.current?.scale.set(1, 1, 1)

      const tl = gsap.timeline({ defaults: { ease: 'paper' }, onUpdate: invalidate, onComplete: onDone })
      // Từ đây cửa che kín màn hình; bỏ nền giấy của overlay để phía sau là thiệp thật.
      tl.set(root, { backgroundColor: 'transparent' }, 0)

      // Dấu sáp nén lại rồi tách đôi, bật ra hai phía.
      if (sealPress.current) tl.to(sealPress.current.scale, { x: 0.92, y: 0.92, duration: 0.15, ease: 'power2.in' }, 0)
      if (sealLeft.current && sealRight.current) {
        tl.to(sealLeft.current.position, { x: -0.07, y: 0.02, z: 0.1, duration: 0.6 }, 0.15)
          .to(sealLeft.current.rotation, { y: -0.7, z: 0.45, duration: 0.6 }, 0.15)
          .to(sealRight.current.position, { x: 0.07, y: 0.02, z: 0.1, duration: 0.6 }, 0.15)
          .to(sealRight.current.rotation, { y: 0.7, z: -0.45, duration: 0.6 }, 0.15)
          .to([m.sealCap, m.sealSide], { opacity: 0, duration: 0.45 }, 0.3)
          // Bóng đổ không mờ theo opacity: tắt luôn khi hai nửa bật ra.
          .call(
            () => {
              sealLeft.current!.castShadow = false
              sealRight.current!.castShadow = false
            },
            [],
            0.25,
          )
      }

      // Khe sáng phía sau loé lên khi cửa vừa hé.
      if (glow.current) {
        tl.to(m.glow, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.45)
          .fromTo(glow.current.scale, { x: 0.05 }, { x: 1, duration: 0.6, ease: 'power2.out' }, 0.45)
          .to(m.glow, { opacity: 0, duration: 0.9, ease: 'power1.in' }, 1.1)
          .to(glow.current.scale, { x: 2.4, duration: 0.9, ease: 'power1.in' }, 1.1)
      }

      // Hai cánh quay vào trong quanh bản lề; camera tiến qua khung cửa.
      const swing = { duration: 1.7, ease: 'silk' }
      if (hingeLeft.current) tl.to(hingeLeft.current.rotation, { y: SWING, ...swing }, 0.6)
      if (hingeRight.current) tl.to(hingeRight.current.rotation, { y: -SWING, ...swing }, 0.6)
      tl.to(camera.position, { z: CAMERA_Z * 0.72, duration: 2, ease: 'power2.inOut' }, 0.5)

      // Phần DOM: nút mờ đi, bìa thật phát, overlay tan.
      tl.to(root.querySelectorAll('[data-anim="cta"]'), { autoAlpha: 0, y: 12, duration: 0.4 }, 0.2)
        .call(onReveal, [], 1.05)
        .to(root, { autoAlpha: 0, duration: 0.5, ease: 'power1.out' }, 2.0)

      guard(tl)
      return { fastForward: () => void tl.timeScale(3), finish: () => void tl.progress(1) }
    }

    const api: Doors3DApi = {
      refit,
      startIdle: () => {
        if (!sealPress.current) return
        breathing = gsap.to(sealPress.current.scale, {
          x: 1.02,
          y: 1.02,
          duration: 1.2,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          onUpdate: invalidate,
        })
      },
      open: (root, callbacks) => {
        breathing?.kill()
        return openTimeline(root, callbacks)
      },
    }

    // Hai khung hình: lần vẽ đầu tiên với texture đã xong trước khi báo sẵn sàng.
    requestAnimationFrame(() => requestAnimationFrame(() => onReady(api)))
    return () => {
      breathing?.kill()
    }
  }, [materials, get, refit, onReady])

  if (!materials) return null

  const doorW = viewport.w / 2
  const sealScale = sealPixels(size.width) / 2 / viewport.ppu / SEAL_R
  const pointer = {
    onClick: () => onOpenRequest(),
    onPointerOver: () => void (document.body.style.cursor = 'pointer'),
    onPointerOut: () => void (document.body.style.cursor = ''),
  }

  return (
    <>
      {/* Ánh sáng gần trung tính để giấy giữ đúng màu bản 2.5D; nắng xiên từ góc trên trái làm nổi hoa văn. */}
      <ambientLight intensity={2} color="#fffbf8" />
      <directionalLight
        position={[-2.2, 2.4, 2.2]}
        intensity={1.75}
        color="#fff8f1"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.01}
        shadow-radius={6}
        shadow-camera-left={-0.6}
        shadow-camera-right={0.6}
        shadow-camera-top={0.6}
        shadow-camera-bottom={-0.6}
      />

      <mesh ref={glow} position-z={-0.4} material={materials.glow}>
        <planeGeometry args={[viewport.w * 0.36, viewport.h * 1.1]} />
      </mesh>

      <group ref={hingeLeft} position-x={-viewport.w / 2}>
        <mesh
          position={[doorW / 2, 0, -DOOR_DEPTH / 2]}
          receiveShadow
          geometry={doorGeometry}
          material={[materials.edge, materials.edge, materials.edge, materials.edge, materials.left, materials.edge]}
        />
      </group>
      <group ref={hingeRight} position-x={viewport.w / 2}>
        <mesh
          position={[-doorW / 2, 0, -DOOR_DEPTH / 2]}
          receiveShadow
          geometry={doorGeometry}
          material={[materials.edge, materials.edge, materials.edge, materials.edge, materials.right, materials.edge]}
        />
      </group>

      <group ref={seal} position-z={0.004} scale={sealScale}>
        <group ref={sealPress}>
          <mesh ref={sealLeft} castShadow geometry={shared.sealLeft} material={[materials.sealCap, materials.sealSide]} {...pointer} />
          <mesh ref={sealRight} castShadow geometry={shared.sealRight} material={[materials.sealCap, materials.sealSide]} {...pointer} />
        </group>
      </group>
    </>
  )
}
