/** Small shared presentational bits. */

import type { ReactNode } from 'react'

import type { Rating as RatingType } from '../lib/types'

export function Badge({
  tone = 'neutral',
  mono,
  children,
}: {
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger'
  mono?: boolean
  children: ReactNode
}) {
  return <span className={`badge ${tone}${mono ? ' mono' : ''}`}>{children}</span>
}

/** Five stars clipped to the exact ratio, so 4.2 and 4.7 do not look alike. */
export function Rating({ rating }: { rating?: RatingType }) {
  if (!rating) return null
  const min = rating.scale_min ?? 0
  const max = rating.scale_max || 5
  const ratio = Math.min(1, Math.max(0, (rating.value - min) / (max - min)))

  return (
    <span className="rating">
      <span className="stars" aria-hidden>
        ★★★★★
        <span className="stars-fill" style={{ width: `${ratio * 100}%` }}>
          ★★★★★
        </span>
      </span>
      <span>{rating.value.toFixed(1)}</span>
      {rating.count != null && (
        <span className="faint">({rating.count.toLocaleString()})</span>
      )}
      <span className="visually-hidden">
        Rated {rating.value} out of {max}
      </span>
    </span>
  )
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  )
}
