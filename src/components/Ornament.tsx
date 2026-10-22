import styles from './Ornament.module.css'

/** Lá hình hạt hạnh, gốc tại (0,0), dài 1 đơn vị theo trục x. */
const LEAF = 'M0,0 C0.25,-0.32 0.7,-0.34 1,0 C0.7,0.34 0.25,0.32 0,0 Z'

const LAUREL_LEAVES = (() => {
  const leaves: Array<{ x: number; angle: number; size: number }> = []
  for (let i = 0; i < 6; i++) {
    const x = 8 + i * 17
    const size = 15 - i * 1.4
    leaves.push({ x, angle: -38, size }, { x: x + 5, angle: 38, size })
  }
  return leaves
})()

/**
 * Cành nguyệt quế nhũ vàng nằm ngang (theo mẫu chữ tên tham khảo): thân thẳng, lá xếp đôi
 * nhỏ dần về phía ngọn. `flip` để cành hướng ngược lại.
 */
function LaurelBranch({ flip, offsetX }: { flip?: boolean; offsetX: number }) {
  return (
    <g transform={`translate(${offsetX} 10) ${flip ? 'scale(-1 1)' : ''}`}>
      <path d="M0,0 H112" className={styles.stem} data-anim="rule" />
      {LAUREL_LEAVES.map((leaf, index) => (
        <path
          key={index}
          d={LEAF}
          className={styles.leaf}
          data-anim="leaf"
          transform={`translate(${leaf.x} 0) rotate(${leaf.angle}) scale(${leaf.size})`}
        />
      ))}
      <path d={LEAF} className={styles.leaf} data-anim="leaf" transform="translate(112 0) scale(13)" />
    </g>
  )
}

/** Đường phân cách: hai cành nguyệt quế hướng vào một hạt thoi ở giữa. */
export function Divider({ className }: { className?: string }) {
  return (
    <svg
      className={[styles.divider, className].filter(Boolean).join(' ')}
      viewBox="0 0 280 20"
      aria-hidden="true"
      data-anim="divider"
    >
      <LaurelBranch offsetX={8} />
      <LaurelBranch offsetX={272} flip />
      <path d="M140,4 L146,10 L140,16 L134,10 Z" className={styles.diamond} data-anim="diamond" />
    </svg>
  )
}
