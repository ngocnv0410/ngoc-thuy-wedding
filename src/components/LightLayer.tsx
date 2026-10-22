import styles from './LightLayer.module.css'

/**
 * Lớp vệt sáng cố định giữa nền trang và nội dung. Hành trình ánh sáng được điều khiển bởi
 * chunk motion (src/motion/light.ts); không có motion thì lớp này ẩn.
 */
export function LightLayer() {
  return <div id="light-layer" className={styles.light} aria-hidden="true" />
}
