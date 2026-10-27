import styles from './Ornament.module.css'

type Point = [number, number]
type Cubic = [Point, Point, Point, Point]

/** Lá liễu thuôn, gốc tại (0,0), dài 1 đơn vị theo trục x, ngọn hơi cong lên. */
const LEAF = 'M0,0 C0.2,-0.24 0.62,-0.28 1,-0.07 C0.66,0.13 0.26,0.17 0,0 Z'

/**
 * Dây lá mọc từ giữa ra ngoài (trục x dương), uốn lượn hình sóng rồi cuộn xoắn ở ngọn.
 * Hai đoạn bậc ba nối mượt để có thể dò vị trí và hướng tiếp tuyến cho từng lá.
 */
const VINE: Cubic[] = [
  [[0, 0], [20, -7], [42, 6], [64, 1.5]],
  [[64, 1.5], [82, -2], [97, -6], [110, -3]],
]
const CURL = 'C116,-1.5 117.5,4 113,4.6 C109.6,5 108.6,1.6 111,0.8'
const VINE_PATH = `M0,0 ${VINE.map(([, a, b, c]) => `C${a} ${b} ${c}`).join(' ')} ${CURL}`

/** Tua cuốn nhỏ tách khỏi dây gần gốc, cuộn về phía dưới. */
const TENDRIL = 'M4,-0.9 C7,4.6 13.5,6.6 15.8,4 C17.2,2.3 15,1 13.9,2.6'

function cubicAt([p0, p1, p2, p3]: Cubic, t: number): { point: Point; angle: number } {
  const u = 1 - t
  const point: Point = [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ]
  const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0])
  const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1])
  return { point, angle: (Math.atan2(dy, dx) * 180) / Math.PI }
}

/** Lá so le hai bên dây, nghiêng theo tiếp tuyến và nhỏ dần về phía ngọn. */
const VINE_LEAVES = (() => {
  const stops: Array<[segment: number, t: number]> = [
    [0, 0.3], [0, 0.5], [0, 0.68], [0, 0.86],
    [1, 0.08], [1, 0.32], [1, 0.55], [1, 0.78],
  ]
  return stops.map(([segment, t], index) => {
    const { point, angle } = cubicAt(VINE[segment], t)
    const side = index % 2 === 0 ? -1 : 1
    const size = 13.5 - index * 0.8
    return `translate(${point[0].toFixed(2)} ${point[1].toFixed(2)}) rotate(${(angle + side * 36).toFixed(1)}) scale(${size} ${side * -size})`
  })
})()

/** Một nửa hoạ tiết: dây lá uốn lượn. `flip` để dây mọc sang trái. */
function Vine({ flip, offsetX }: { flip?: boolean; offsetX: number }) {
  return (
    <g transform={`translate(${offsetX} 14) ${flip ? 'scale(-1 1)' : ''}`}>
      <path d={VINE_PATH} className={styles.stem} data-anim="rule" />
      <path d={TENDRIL} className={styles.tendril} data-anim="rule" />
      {VINE_LEAVES.map((transform, index) => (
        <path key={index} d={LEAF} className={styles.leaf} data-anim="leaf" transform={transform} />
      ))}
    </g>
  )
}

/** Cánh hoa nhài tròn đầy, đầu chỉ hơi gợn, mọc lên trên (trục y âm) từ sát nhuỵ. */
const PETAL = 'M0,-1 C-3,-1.8 -4.6,-5 -3.4,-7.3 C-2.3,-9.1 -0.9,-9.1 0,-8.75 C0.9,-9.1 2.3,-9.1 3.4,-7.3 C4.6,-5 3,-1.8 0,-1 Z'
const PETAL_ANGLES = [0, 72, 144, 216, 288]
const STAMEN_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

/** Bông hoa nhài năm cánh ở giữa đường phân cách: cánh xếp chồng nhẹ, nhuỵ là cụm chấm nhỏ. */
function Blossom({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`} data-anim="blossom">
      {PETAL_ANGLES.map((angle) => (
        <g key={angle} transform={`rotate(${angle})`}>
          <path d={PETAL} className={styles.petal} />
          <path d="M0,-3.4 V-6.2" className={styles.vein} />
        </g>
      ))}
      <circle r="2.3" className={styles.pistil} />
      {STAMEN_ANGLES.map((angle) => (
        <circle key={angle} cx="0" cy="-1.55" r="0.38" className={styles.stamen} transform={`rotate(${angle})`} />
      ))}
      <circle r="0.6" className={styles.stamen} />
    </g>
  )
}

/** Đường phân cách: hai dây lá uốn lượn đối xứng, ở giữa là một bông hoa nhài năm cánh. */
export function Divider({ className }: { className?: string }) {
  return (
    <svg
      className={[styles.divider, className].filter(Boolean).join(' ')}
      viewBox="0 0 280 28"
      aria-hidden="true"
      data-anim="divider"
    >
      <Vine offsetX={131} flip />
      <Vine offsetX={149} />
      <Blossom cx={140} cy={14} />
    </svg>
  )
}
