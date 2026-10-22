import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'ghost' | 'link'

interface CommonProps {
  variant?: Variant
  size?: 'md' | 'lg'
  icon?: ReactNode
  children: ReactNode
}

type AsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }
type AsLink = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

/** Nút dùng chung. Có `href` thì render `<a>`, ngược lại là `<button>`. */
export function Button(props: AsButton | AsLink) {
  const { variant = 'primary', size = 'md', icon, children, className, ...rest } = props
  const classes = [styles.button, styles[variant], styles[size], className].filter(Boolean).join(' ')
  const content = (
    <>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </>
  )

  if (rest.href !== undefined) {
    return (
      <a className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {content}
      </a>
    )
  }
  return (
    <button type="button" className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {content}
    </button>
  )
}
