/**
 * Live checkout card.
 *
 * The merchant owns this state: the card renders whatever the last `Checkout`
 * said, and the place-order button unlocks only on `ready_for_complete`. Every
 * control sends a chat turn rather than calling the API directly.
 */

import { formatAmount, titleCase } from '../../lib/format'
import type { CheckoutView } from '../../lib/types'
import { useChat } from '../../state/ChatContext'
import { IconCheck } from '../icons'

function Totals({ totals, currency }: { totals: CheckoutView['totals']; currency: string }) {
  return (
    <div className="totals">
      {totals.map((total, index) => {
        const grand = total.type === 'total'
        return (
          <div
            key={`${total.type}-${index}`}
            className={`totals-row${grand ? ' grand' : ''}${total.amount < 0 ? ' discount' : ''}`}
          >
            <span>{total.display_text ?? titleCase(total.type)}</span>
            <span>
              {total.amount === 0 && total.type === 'fulfillment'
                ? 'Free'
                : formatAmount(total.amount, currency)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function CheckoutBlock({ checkout }: { checkout: CheckoutView }) {
  const { send, sending } = useChat()
  const ready = checkout.status === 'ready_for_complete'
  const { address, buyer } = checkout

  const addressLine = [
    address.street_address,
    address.address_locality,
    address.address_region,
    address.postal_code,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="card-lite checkoutcard">
      <header className="checkoutcard-head">
        <div>
          <h4>Checkout</h4>
          <code className="faint">{checkout.id}</code>
        </div>
        <span className={`badge ${ready ? 'success' : 'warning'}`}>
          {titleCase(checkout.status)}
        </span>
      </header>

      <div className="checkoutcard-items">
        {checkout.line_items.map((line) => (
          <div className="cartrow compact" key={line.id}>
            {line.image ? (
              <img className="thumb" src={line.image} alt="" />
            ) : (
              <div className="thumb" />
            )}
            <div className="cartrow-main">
              <div className="cartrow-title">{line.title}</div>
              <div className="cartrow-meta">
                {line.variant_label && `${line.variant_label} · `}×{line.quantity}
              </div>
            </div>
            <strong>{formatAmount(line.line_total, checkout.currency)}</strong>
          </div>
        ))}
      </div>

      {(buyer?.email || addressLine) && (
        <section className="checkoutcard-section">
          <span className="section-label">Deliver to</span>
          <p>
            {[buyer?.first_name, buyer?.last_name].filter(Boolean).join(' ')}
            {buyer?.email && <span className="faint"> · {buyer.email}</span>}
            {buyer?.phone_number && <span className="faint"> · {buyer.phone_number}</span>}
          </p>
          {addressLine && <p className="faint">{addressLine}</p>}
        </section>
      )}

      {checkout.shipping_options.length > 0 && (
        <section className="checkoutcard-section">
          <span className="section-label">Delivery</span>
          <div className="optionlist">
            {checkout.shipping_options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`option${option.id === checkout.selected_shipping_id ? ' selected' : ''}`}
                disabled={sending}
                onClick={() => send(option.title)}
              >
                <span className="option-radio" />
                <span className="option-main">
                  <span className="option-title">{option.title}</span>
                  <span className="option-sub">
                    {option.description}
                    {option.carrier && ` · ${option.carrier}`}
                  </span>
                </span>
                <span className="option-price">
                  {option.amount === 0
                    ? 'Free'
                    : formatAmount(option.amount, checkout.currency)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {checkout.instruments.length > 0 && (
        <section className="checkoutcard-section">
          <span className="section-label">Payment</span>
          <div className="chip-row">
            {checkout.instruments.map((instrument) => (
              <button
                key={instrument.id}
                type="button"
                className={`chip${instrument.selected ? ' active' : ''}`}
                disabled={sending}
                onClick={() => send(`Pay by ${instrument.label}`)}
              >
                {instrument.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {checkout.messages.length > 0 && (
        <div className="checkoutcard-messages">
          {checkout.messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              {message.code && <span className="message-code">{message.code}</span>}
              <span>{message.content}</span>
            </div>
          ))}
        </div>
      )}

      <footer className="checkoutcard-foot">
        <Totals totals={checkout.totals} currency={checkout.currency} />
        {/* Orders aren't placed from the chat for now: payment happens on the
            store's own checkout page (UCP continue_url). Uncomment to bring
            the place-order button back.
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={sending || !ready}
          onClick={() => send('Place the order')}
        >
          <IconCheck size={15} />
          {ready ? 'Place the order' : 'Complete the details above'}
        </button>
        */}
        {checkout.continue_url && (
          <a
            className="btn btn-primary btn-block"
            href={checkout.continue_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconCheck size={15} />
            Continue to payment
          </a>
        )}
        {checkout.links.length > 0 && (
          <div className="chip-row">
            {checkout.links.map((link) => (
              <a
                key={link.type}
                className="chip"
                href={link.url}
                target="_blank"
                rel="noreferrer"
              >
                {link.title ?? titleCase(link.type)}
              </a>
            ))}
          </div>
        )}
      </footer>
    </div>
  )
}
