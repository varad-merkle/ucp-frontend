/** Order receipt with the fulfillment timeline. */

import { formatAmount, formatDate, titleCase } from '../../lib/format'
import type { OrderView } from '../../lib/types'
import { IconCheck } from '../icons'

export function OrderBlock({ order }: { order: OrderView }) {
  const { destination } = order

  return (
    <div className="card-lite ordercard">
      <header className="ordercard-head">
        <span className="ordercard-check">
          <IconCheck size={18} />
        </span>
        <div>
          <h4>Order {order.label ?? order.id}</h4>
          <span className="faint">
            {order.method}
            {order.expected_on && ` · expected ${formatDate(order.expected_on)}`}
          </span>
        </div>
      </header>

      <div className="checkoutcard-items">
        {order.line_items.map((line) => (
          <div className="cartrow compact" key={line.id}>
            {line.image ? (
              <img className="thumb" src={line.image} alt="" />
            ) : (
              <div className="thumb" />
            )}
            <div className="cartrow-main">
              <div className="cartrow-title">{line.title}</div>
              <div className="cartrow-meta">
                ×{line.quantity} · {titleCase(line.status)}
              </div>
            </div>
            <strong>{formatAmount(line.line_total, order.currency)}</strong>
          </div>
        ))}
      </div>

      {Object.keys(destination).length > 0 && (
        <section className="checkoutcard-section">
          <span className="section-label">Shipping to</span>
          <p>
            {[destination.first_name, destination.last_name].filter(Boolean).join(' ')}
          </p>
          <p className="faint">
            {[
              destination.street_address,
              destination.address_locality,
              destination.address_region,
              destination.postal_code,
              destination.address_country,
            ]
              .filter(Boolean)
              .join(', ')}
          </p>
        </section>
      )}

      {order.events.length > 0 && (
        <section className="checkoutcard-section">
          <span className="section-label">Timeline</span>
          <div className="timeline">
            {order.events.map((event) => (
              <div className="timeline-item" key={event.id}>
                <div className="timeline-title">{titleCase(event.type)}</div>
                <div className="timeline-meta">
                  {new Date(event.occurred_at).toLocaleString()}
                  {event.carrier && ` · ${event.carrier}`}
                </div>
                {event.description && <p className="faint">{event.description}</p>}
                {event.tracking_url && (
                  <a href={event.tracking_url} target="_blank" rel="noreferrer">
                    Track {event.tracking_number}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="checkoutcard-foot">
        <div className="totals">
          {order.totals.map((total, index) => (
            <div
              key={index}
              className={`totals-row${total.type === 'total' ? ' grand' : ''}${total.amount < 0 ? ' discount' : ''}`}
            >
              <span>{total.display_text ?? titleCase(total.type)}</span>
              <span>
                {total.amount === 0 && total.type === 'fulfillment'
                  ? 'Free'
                  : formatAmount(total.amount, order.currency)}
              </span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  )
}
