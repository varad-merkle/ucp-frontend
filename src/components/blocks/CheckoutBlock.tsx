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
import { IconExternal } from '../icons'
// import { IconCheck } from '../icons'  // used by the payment buttons, switched off for now

type Field = keyof CheckoutDetails

/** The UCP checkout statuses, in words a shopper understands. Unknown ones fall back to the raw value. */
const STATUS: Record<string, { label: string; hint: string; tone: 'success' | 'warning' | 'neutral' }> = {
  incomplete: { label: 'Details needed', hint: 'Add the details below to continue', tone: 'warning' },
  requires_escalation: { label: 'Finish on store', hint: 'The store needs you on its own page', tone: 'warning' },
  ready_for_complete: { label: 'Ready', hint: 'All details are in: continue to payment', tone: 'success' },
  complete_in_progress: { label: 'Placing order', hint: 'The store is placing the order', tone: 'neutral' },
  completed: { label: 'Order placed', hint: 'The store has placed the order', tone: 'success' },
  canceled: { label: 'Canceled', hint: 'This checkout was canceled', tone: 'neutral' },
}

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

function isBuyerOnly(message: UcpMessage): boolean {
  return message.severity === 'requires_buyer_input' || message.severity === 'requires_buyer_review'
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
  const open = !['completed', 'canceled'].includes(checkout.status)
  // Store errors about a detail the form collects are shown next to that field;
  // everything else stays in the card's message list.
  const errors: Partial<Record<Field, string>> = {}
  // The same last step for every store: continue on the store's own checkout page.
  const storeUrl = open ? checkout.continue_url : null
  // Messages only the buyer can resolve on the store's page (UCP requires_buyer_input /
  // requires_buyer_review, e.g. "An extension interaction is required…"). When the card
  // offers the store's page, the continue section explains them in plain words instead.
  const buyerOnly = checkout.messages.filter((message) => isBuyerOnly(message))
  const messages = checkout.messages.filter((message) => {
    if (storeUrl && isBuyerOnly(message)) return false
    const field = message.type === 'error' ? fieldFor(message) : null
    if (open && field) errors[field] ??= message.content
    return !(open && field)
  })

  return (
    <div className="card-lite checkoutcard">
      {/* checkout.id is the store's opaque handle (a gid with an access key): UCP has
          platforms pass it back to the store, never show it, so it stays out of the card. */}
      <header className="checkoutcard-head">
        <div>
          <h4>{checkout.store ? `${checkout.store} checkout` : 'Checkout'}</h4>
          <span className="faint">{STATUS[checkout.status]?.hint ?? titleCase(checkout.status)}</span>
        </div>
        <span className={`badge ${STATUS[checkout.status]?.tone ?? 'warning'}`}>
          {STATUS[checkout.status]?.label ?? titleCase(checkout.status)}
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
              <span>{message.content}</span>
            </div>
          ))}
        </div>
      )}

      {storeUrl && (
        <section className="checkoutcard-section handoff">
          <p>
            Payment and placing the order happen on {checkout.store ?? 'the store'}’s own checkout
            page.
            {buyerOnly.length > 0 && (
              <span title={buyerOnly.map((message) => message.content).join(' ')}>
                {' '}It also has a step only you can complete there, such as a required checkbox or
                choice.
              </span>
            )}
          </p>
          <a className="btn btn-primary btn-block" href={storeUrl} target="_blank" rel="noopener noreferrer">
            Continue to payment on {checkout.store ?? 'the store'}
            <IconExternal size={14} />
          </a>
        </section>
      )}

      <footer className="checkoutcard-foot">
        <Totals totals={checkout.totals} currency={checkout.currency} />
        {/* Placing the order from here (UCP complete_checkout) is switched off: payment happens
            on the store's own page, through the continue section above. Uncomment to bring back
            the place-order button, with the IconCheck import.
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={sending || checkout.status !== 'ready_for_complete'}
          onClick={() => send('Place the order')}
        >
          <IconCheck size={15} />
          {checkout.status === 'ready_for_complete' ? 'Place the order' : 'Complete the details above'}
        </button>
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
