import { Canvas, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  BackSide,
  FrontSide,
  type Group,
  MathUtils,
  type Mesh,
  MeshStandardMaterial,
  type PerspectiveCamera,
  RepeatWrapping,
  ShadowMaterial,
  type Texture,
  Vector3,
} from 'three'
import { gsap, guard } from '../../../lib/gsap'
import { CARD_H, CARD_W, CARD_Y, ENV_H, ENV_W, FLAP_DEPTH, SEAL_R, Z } from './dimensions'
import { fitTexture, flapGeometry, pocketGeometry, sealHalfGeometry } from './geometry'
import { cardTexture, flapTexture, grainTexture, loadTextureFonts, pocketTexture, sealTexture } from './textures'

export interface Envelope3DText {
  first: string
  second: string
  date: string
  monogram: string
}

export interface OpenCallbacks {
  onReveal: () => void
  onDone: () => void
}

export interface Envelope3DApi {
  /** Căn lại khung hình theo phong bì 2.5D (gọi ngay trước khi hiện lớp 3D). */
  refit: () => void
  /** Dấu sáp "thở" chờ được chạm. */
  startIdle: () => void
  open: (root: HTMLElement, callbacks: OpenCallbacks) => { fastForward: () => void; finish: () => void }
}

export interface Envelope3DProps {
  /** Sân khấu 2.5D — phong bì 3D được đặt khớp đúng vị trí/kích thước của nó. */
  stage: HTMLElement
  text: Envelope3DText
  onReady: (api: Envelope3DApi) => void
  /** Mất WebGL context hoặc lỗi dựng scene: quay về bản 2.5D. */
  onFail: () => void
  /** Khách chạm vào dấu sáp 3D. */
  onOpenRequest: () => void
}

const CAMERA_Z = 5
const FOV = 30
/** Phong bì nằm trên bàn, mép trên ngả ra xa. */
const TILT = -0.2

/**
 * Scene 0 (bản 3D) — chỉ tải cho máy đủ mạnh. Cùng câu chuyện với bản 2.5D nhưng giấy, bóng
 * đổ và nắp lật có chiều sâu thật; thẻ bay thẳng về phía camera để "trở thành" khung bìa.
 */
export default function Envelope3D(props: Envelope3DProps) {
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
  card: Texture
  pocket: Texture
  flap: Texture
  grain: Texture
  seal: Texture
}

function Scene({ stage, text, onReady, onOpenRequest }: Envelope3DProps) {
  // Đọc trạng thái mới nhất (kích thước, camera) qua get() — các hàm dưới được gọi về sau.
  const get = useThree((state) => state.get)
  const size = useThree((state) => state.size)
  const [textures, setTextures] = useState<Textures | null>(null)

  const group = useRef<Group>(null)
  const back = useRef<Mesh>(null)
  const card = useRef<Mesh>(null)
  const pocket = useRef<Mesh>(null)
  const flap = useRef<Group>(null)
  const seal = useRef<Group>(null)
  const sealLeft = useRef<Mesh>(null)
  const sealRight = useRef<Mesh>(null)

  // Texture vẽ bằng font của trang: chờ font (đúng subset tiếng Việt) trước khi vẽ.
  useEffect(() => {
    let cancelled = false
    let built: Textures | undefined
    loadTextureFonts(`${text.first} ${text.second}`).then(() => {
      if (cancelled) return
      const grain = grainTexture()
      grain.wrapS = grain.wrapT = RepeatWrapping
      built = {
        card: cardTexture(text),
        pocket: fitTexture(pocketTexture(`${text.first} & ${text.second}`), -ENV_W / 2, -ENV_H / 2, ENV_W, ENV_H),
        flap: fitTexture(flapTexture(), -ENV_W / 2, -FLAP_DEPTH, ENV_W, FLAP_DEPTH),
        grain,
        seal: fitTexture(sealTexture(text.monogram), -SEAL_R, -SEAL_R, SEAL_R * 2, SEAL_R * 2),
      }
      setTextures(built)
    })
    return () => {
      cancelled = true
      if (built) Object.values(built).forEach((texture) => texture.dispose())
    }
  }, [text])

  const materials = useMemo(() => {
    if (!textures) return null
    const paper = { roughness: 0.92, metalness: 0, transparent: true }
    return {
      back: new MeshStandardMaterial({ ...paper, color: '#e6dbc6', map: textures.grain }),
      card: new MeshStandardMaterial({ ...paper, roughness: 0.85, map: textures.card }),
      pocket: new MeshStandardMaterial({ ...paper, map: textures.pocket }),
      flapFront: new MeshStandardMaterial({ ...paper, map: textures.flap, side: FrontSide }),
      flapBack: new MeshStandardMaterial({ ...paper, color: '#ddd0b8', map: textures.grain, side: BackSide }),
      sealCap: new MeshStandardMaterial({ map: textures.seal, metalness: 0.3, roughness: 0.42, transparent: true }),
      sealSide: new MeshStandardMaterial({ color: '#a88a50', metalness: 0.3, roughness: 0.5, transparent: true }),
      ground: new ShadowMaterial({ opacity: 0.2, transparent: true }),
    }
  }, [textures])

  const geometries = useMemo(
    () => ({
      pocket: pocketGeometry(),
      flap: flapGeometry(),
      sealLeft: sealHalfGeometry('left'),
      sealRight: sealHalfGeometry('right'),
    }),
    [],
  )

  useEffect(
    () => () => {
      Object.values(geometries).forEach((geometry) => geometry.dispose())
      if (materials) Object.values(materials).forEach((material) => material.dispose())
    },
    [geometries, materials],
  )

  // Đặt phong bì 3D trùng vị trí/kích thước sân khấu 2.5D (đo theo pixel trên màn hình).
  const refit = useCallback(() => {
    const el = group.current
    if (!el) return
    const { size, invalidate } = get()
    const rect = stage.getBoundingClientRect()
    const visibleHeight = 2 * CAMERA_Z * Math.tan(MathUtils.degToRad(FOV / 2))
    const ppu = size.height / visibleHeight
    el.scale.setScalar(rect.width / ppu / ENV_W)
    el.position.set((rect.left + rect.width / 2 - size.width / 2) / ppu, -(rect.top + rect.height / 2 - size.height / 2) / ppu, 0)
    invalidate()
  }, [get, stage])
  useLayoutEffect(refit, [refit, size, materials])

  // Báo sẵn sàng sau khi khung hình đầu tiên có texture đã được vẽ.
  const readyFired = useRef(false)
  useEffect(() => {
    if (!materials || readyFired.current) return
    readyFired.current = true
    const { invalidate } = get()
    invalidate()
    let breathing: gsap.core.Tween | undefined

    const api: Envelope3DApi = {
      refit,
      startIdle: () => {
        if (!seal.current) return
        breathing = gsap.to(seal.current.scale, {
          x: 1.015,
          y: 1.015,
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

    const openTimeline = (root: HTMLElement, { onReveal, onDone }: OpenCallbacks) => {
      const parts = { back: back.current!, card: card.current!, pocket: pocket.current!, flap: flap.current!, seal: seal.current! }
      const m = materials
      seal.current?.scale.set(1, 1, 1)

      // Vị trí để thẻ (quay thẳng về camera) phủ đúng bề ngang khung bìa thật.
      const target = document.querySelector('#bia [data-anim="frame"], #bia [data-anim="media"]')
      let fitted = new Vector3(0, CARD_Y + CARD_H * 0.58, Z.card)
      const fitCard = () => {
        const g = group.current
        if (!target || !g) return
        const rect = target.getBoundingClientRect()
        const { camera, size } = get()
        const cam = camera as PerspectiveCamera
        const tan = Math.tan(MathUtils.degToRad(cam.fov / 2))
        const aspect = size.width / size.height
        const distance = Math.max(0.6, (CARD_W * g.scale.x * size.height) / (rect.width * 2 * tan))
        const ndcX = ((rect.left + rect.width / 2) / size.width) * 2 - 1
        const ndcY = -(((rect.top + rect.height / 2) / size.height) * 2 - 1)
        const world = new Vector3(ndcX * distance * tan * aspect, ndcY * distance * tan, cam.position.z - distance)
        fitted = g.worldToLocal(world)
      }

      const falling = [parts.back, parts.pocket, parts.flap]

      const tl = gsap.timeline({ defaults: { ease: 'paper' }, onUpdate: invalidate, onComplete: onDone })

      // Dấu sáp nén lại rồi tách đôi, bật ra hai phía.
      tl.to(parts.seal.scale, { x: 0.94, y: 0.94, duration: 0.15, ease: 'power2.in' }, 0)
      if (sealLeft.current && sealRight.current) {
        tl.to(sealLeft.current.position, { x: -0.06, y: 0.03, z: 0.08, duration: 0.55 }, 0.15)
          .to(sealLeft.current.rotation, { y: -0.7, z: 0.45, duration: 0.55 }, 0.15)
          .to(sealRight.current.position, { x: 0.06, y: 0.03, z: 0.08, duration: 0.55 }, 0.15)
          .to(sealRight.current.rotation, { y: 0.7, z: -0.45, duration: 0.55 }, 0.15)
          .to([m.sealCap, m.sealSide], { opacity: 0, duration: 0.4 }, 0.3)
      }

      // Nắp lật quanh bản lề, vượt quá 180° để nằm ra phía sau phong bì (không che thẻ).
      tl.to(parts.flap.rotation, { x: -Math.PI * 1.04, duration: 0.85, ease: 'silk' }, 0.4)

      // Thẻ trượt lên khỏi túi (túi trước che phần dưới thẻ — che khuất thật trong 3D).
      tl.to(parts.card.position, { y: CARD_Y + CARD_H * 0.58, duration: 0.9 }, 1.0)
        .call(fitCard, [], 1.9)
        .to(
          parts.card.position,
          { x: () => fitted.x, y: () => fitted.y, z: () => fitted.z, duration: 0.85, ease: 'silk', immediateRender: false },
          1.9,
        )
        .to(parts.card.rotation, { x: -TILT, duration: 0.85, ease: 'silk' }, 1.9)
        .to(m.card, { opacity: 0, duration: 0.35, ease: 'power1.in' }, 2.45)

      // Phong bì rơi xuống và tan.
      tl.to(
        falling.map((part) => part.position),
        { y: (_, target: Vector3) => target.y - 0.35, duration: 0.8, ease: 'silk' },
        1.9,
      )
      tl.to([m.back, m.pocket, m.flapFront, m.flapBack, m.ground], { opacity: 0, duration: 0.7, ease: 'silk' }, 1.95)

      // Phần DOM: nút mờ đi, bìa thật hiện, overlay tan.
      tl.to(root.querySelectorAll('[data-anim="cta"]'), { autoAlpha: 0, y: 12, duration: 0.4 }, 0.2)
        .call(onReveal, [], 2.55)
        .to(root, { autoAlpha: 0, duration: 0.5, ease: 'power1.out' }, 2.6)

      guard(tl)
      return { fastForward: () => void tl.timeScale(3), finish: () => void tl.progress(1) }
    }

    // Hai khung hình: lần vẽ đầu tiên với texture đã xong trước khi báo sẵn sàng.
    requestAnimationFrame(() => requestAnimationFrame(() => onReady(api)))
    return () => {
      breathing?.kill()
    }
  }, [materials, get, refit, onReady])

  if (!materials) return null

  const sealY = ENV_H / 2 - FLAP_DEPTH
  const pointer = {
    onClick: () => onOpenRequest(),
    onPointerOver: () => void (document.body.style.cursor = 'pointer'),
    onPointerOut: () => void (document.body.style.cursor = ''),
  }

  return (
    <>
      {/* Ánh sáng gần trung tính để giấy giữ đúng màu ivory của bản 2.5D; nắng ấm rất nhẹ từ góc trên trái. */}
      <ambientLight intensity={1.9} color="#ffffff" />
      <directionalLight
        position={[-1.4, 2, 2.8]}
        intensity={1.1}
        color="#fff7ec"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.01}
        shadow-radius={6}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
      />
      <group ref={group} rotation-x={TILT}>
        <mesh position-z={Z.ground} receiveShadow material={materials.ground}>
          <planeGeometry args={[6, 6]} />
        </mesh>
        <mesh ref={back} position-z={Z.back} castShadow receiveShadow material={materials.back}>
          <planeGeometry args={[ENV_W, ENV_H]} />
        </mesh>
        <mesh ref={card} position={[0, CARD_Y, Z.card]} receiveShadow material={materials.card}>
          <planeGeometry args={[CARD_W, CARD_H]} />
        </mesh>
        <mesh ref={pocket} position-z={Z.pocket} castShadow receiveShadow geometry={geometries.pocket} material={materials.pocket} />
        <group ref={flap} position={[0, ENV_H / 2, Z.flap]}>
          <mesh castShadow geometry={geometries.flap} material={materials.flapFront} />
          <mesh geometry={geometries.flap} material={materials.flapBack} />
        </group>
        <group ref={seal} position={[0, sealY, Z.seal]}>
          <mesh ref={sealLeft} castShadow geometry={geometries.sealLeft} material={[materials.sealCap, materials.sealSide]} {...pointer} />
          <mesh ref={sealRight} castShadow geometry={geometries.sealRight} material={[materials.sealCap, materials.sealSide]} {...pointer} />
        </group>
      </group>
    </>
  )
}
