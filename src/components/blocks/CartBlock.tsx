/** Inline cart. Quantity and removal changes are sent as chat turns. */

import { formatAmount, titleCase } from '../../lib/format'
import type { CartLine } from '../../lib/types'
import { useChat } from '../../state/ChatContext'
import { IconMinus, IconPlus, IconTrash } from '../icons'

export function CartBlock({
  lines,
  subtotal,
  currency,
}: {
  lines: CartLine[]
  subtotal: number
  currency: string
}) {
  const { send, sending } = useChat()

  if (lines.length === 0) {
    return <div className="card-lite muted">Your cart is empty.</div>
  }

  return (
    <div className="card-lite cartcard">
      {lines.map((line) => (
        <div className="cartrow" key={line.variant_id}>
          {line.image ? (
            <img className="thumb" src={line.image} alt="" />
          ) : (
            <div className="thumb" />
          )}

          <div className="cartrow-main">
            <div className="cartrow-title">{line.title}</div>
            <div className="cartrow-meta">
              {line.variant_label && `${line.variant_label} · `}
              {formatAmount(line.price, currency)} each
              {line.availability && line.availability !== 'in_stock' && (
                <span className="badge warning">{titleCase(line.availability)}</span>
              )}
            </div>
          </div>

          <div className="cartrow-right">
            <strong>{formatAmount(line.line_total, currency)}</strong>
            <div className="row" style={{ gap: 6 }}>
              <div className="qty qty-sm">
                <button
                  type="button"
                  disabled={sending || line.quantity <= 1}
                  onClick={() => send(`Make the ${line.title} ${line.quantity - 1}`)}
                  aria-label={`Decrease ${line.title}`}
                >
                  <IconMinus size={12} />
                </button>
                <span>{line.quantity}</span>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => send(`Make the ${line.title} ${line.quantity + 1}`)}
                  aria-label={`Increase ${line.title}`}
                >
                  <IconPlus size={12} />
                </button>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                disabled={sending}
                onClick={() => send(`Remove the ${line.title}`)}
                aria-label={`Remove ${line.title}`}
              >
                <IconTrash size={13} />
              </button>
            </div>
          </div>
        </div>
      ))}

      <footer className="cartcard-foot">
        <div>
          <span className="faint">Subtotal</span>
          <strong>{formatAmount(subtotal, currency)}</strong>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={sending}
          onClick={() => send('Checkout')}
        >
          Checkout
        </button>
      </footer>
    </div>
  )
}
