/**
 * Live checkout card.
 *
 * The merchant owns this state: the card renders whatever the last `Checkout`
 * said, and the place-order button unlocks only on `ready_for_complete`. The
 * delivery details form saves everything the store needs in one update; the
 * other controls send chat turns.
 */

import { useState, type FormEvent } from 'react'

import { formatAmount, titleCase } from '../../lib/format'
import type { CheckoutDetails, CheckoutView, UcpMessage } from '../../lib/types'
import { useChat } from '../../state/ChatContext'
// import { IconCheck } from '../icons'  // used by the payment buttons, switched off for now

type Field = keyof CheckoutDetails

// Placeholders describe the field rather than show sample values, so they aren't mistaken for defaults.
const FIELDS: { name: Field; label: string; placeholder: string; type?: string; wide?: boolean }[] = [
  { name: 'email', label: 'Email', placeholder: 'name@example.com', type: 'email', wide: true },
  { name: 'first_name', label: 'First name', placeholder: 'First name' },
  { name: 'last_name', label: 'Last name', placeholder: 'Last name' },
  { name: 'phone', label: 'Phone', placeholder: 'With country code, e.g. +1 …', type: 'tel', wide: true },
  { name: 'street_address', label: 'Street address', placeholder: 'House number and street', wide: true },
  { name: 'city', label: 'City', placeholder: 'City' },
  { name: 'region', label: 'State / region', placeholder: 'If the address has one' },
  { name: 'postal_code', label: 'Postal / ZIP code', placeholder: 'Postal code' },
  { name: 'country', label: 'Country code', placeholder: 'Two letters: US, IN, GB…' },
]

/**
 * The form field a store message is about: from its UCP `path` when the store gives
 * one, otherwise from its code. Order matters: "postal_code_for_zone" is a postal error.
 */
function fieldFor(message: UcpMessage): Field | null {
  const text = `${message.path ?? ''} ${message.code ?? ''}`.toLowerCase()
  const rules: [RegExp, Field][] = [
    [/postal|zip/, 'postal_code'],
    [/phone/, 'phone'],
    [/first_name/, 'first_name'],
    [/last_name/, 'last_name'],
    [/email|contact_method/, 'email'],
    [/city|locality/, 'city'],
    [/region|province|state\b/, 'region'],
    [/country/, 'country'],
    [/street|address/, 'street_address'],
  ]
  return rules.find(([pattern]) => pattern.test(text))?.[1] ?? null
}

function DetailsForm({ initial, errors }: { initial: CheckoutDetails; errors: Partial<Record<Field, string>> }) {
  const { submitCheckoutDetails, sending } = useChat()
  const [details, setDetails] = useState<CheckoutDetails>(initial)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    submitCheckoutDetails({ ...details, country: details.country.trim().toUpperCase() })
  }

  return (
    <form className="checkoutcard-section detailsform" onSubmit={submit}>
      <span className="section-label">Delivery details</span>
      <div className="detailsform-grid">
        {FIELDS.map((field) => (
          <label
            key={field.name}
            className={`detailsform-field${field.wide ? ' wide' : ''}${errors[field.name] ? ' invalid' : ''}`}
          >
            <span>{field.label}</span>
            <input
              type={field.type ?? 'text'}
              value={details[field.name]}
              placeholder={field.placeholder}
              maxLength={field.name === 'country' ? 2 : undefined}
              onChange={(event) => setDetails({ ...details, [field.name]: event.target.value })}
              disabled={sending}
              aria-invalid={Boolean(errors[field.name])}
            />
            {errors[field.name] && <em className="detailsform-error">{errors[field.name]}</em>}
          </label>
        ))}
      </div>
      <button type="submit" className="btn btn-primary btn-sm" disabled={sending}>
        Save details
      </button>
    </form>
  )
}

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
  const open = !['completed', 'canceled'].includes(checkout.status)
  // Store errors about a detail the form collects are shown next to that field;
  // everything else stays in the card's message list.
  const errors: Partial<Record<Field, string>> = {}
  const messages = checkout.messages.filter((message) => {
    const field = message.type === 'error' ? fieldFor(message) : null
    if (open && field) errors[field] ??= message.content
    return !(open && field)
  })

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

      {open && <DetailsForm initial={checkout.details} errors={errors} />}

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

      {/* Payment is switched off for now; uncomment to bring the payment choices back.
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
      */}

      {messages.length > 0 && (
        <div className="checkoutcard-messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              {message.code && <span className="message-code">{message.code}</span>}
              <span>{message.content}</span>
            </div>
          ))}
        </div>
      )}

      <footer className="checkoutcard-foot">
        <Totals totals={checkout.totals} currency={checkout.currency} />
        {/* Payment is switched off for now: checkout stops at reviewing the details.
            Uncomment to bring back the place-order button, or the hand-off to the
            store's own payment page (UCP continue_url), and the IconCheck import.
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={sending || !ready}
          onClick={() => send('Place the order')}
        >
          <IconCheck size={15} />
          {ready ? 'Place the order' : 'Complete the details above'}
        </button>
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
        */}
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
