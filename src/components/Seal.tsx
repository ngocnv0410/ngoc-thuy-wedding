import { useId } from 'react'
import { sealMarkup } from './sealArt'
import styles from './Seal.module.css'

interface SealProps {
  monogram: string
  size?: number
  className?: string
}

/** A champagne medallion with an engraved monogram and a fine botanical wreath. */
export function Seal({ monogram, size = 96, className }: SealProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  return (
    <svg
      className={[styles.seal, className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Monogram ${monogram}`}
      dangerouslySetInnerHTML={{ __html: sealMarkup(id, monogram) }}
    />
  )
}
