/** Right-hand slide-over used by the cart, product detail and inspector. */

import { useEffect, type ReactNode } from 'react'

import { IconClose } from './icons'

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  wide,
  footer,
  children,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  wide?: boolean
  footer?: ReactNode
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside
        className={`drawer${wide ? ' wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Panel'}
      >
        <header className="drawer-head">
          <div style={{ minWidth: 0 }}>
            <h3 className="truncate">{title}</h3>
            {subtitle && (
              <p className="faint" style={{ fontSize: 'var(--text-xs)' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Close panel"
          >
            <IconClose />
          </button>
        </header>

        <div className="drawer-body">{children}</div>

        {footer && <div className="drawer-foot">{footer}</div>}
      </aside>
    </>
  )
}
