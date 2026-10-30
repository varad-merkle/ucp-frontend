/** Presentation helpers. */

import type { BuyerProfile, Money } from './types'

const FORMATTERS = new Map<string, Intl.NumberFormat>()

function formatter(currency: string): Intl.NumberFormat {
  let existing = FORMATTERS.get(currency)
  if (!existing) {
    existing = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 2,
    })
    FORMATTERS.set(currency, existing)
  }
  return existing
}

/**
 * UCP amounts are integers in the currency's ISO 4217 minor unit. `Intl` knows
 * each currency's exponent, so scale by it rather than assuming 100.
 */
export function formatAmount(amount: number, currency = 'USD'): string {
  const intl = formatter(currency)
  const digits = intl.resolvedOptions().maximumFractionDigits ?? 2
  const value = amount / 10 ** digits
  // Whole amounts read better without ".00" on a product card.
  return Number.isInteger(value)
    ? intl.format(value).replace(/\.00$/, '')
    : intl.format(value)
}

export const money = (value: Money) => formatAmount(value.amount, value.currency)

export function discountPercent(price: Money, listPrice?: Money): number | null {
  if (!listPrice || listPrice.amount <= price.amount) return null
  return Math.round(((listPrice.amount - price.amount) / listPrice.amount) * 100)
}

export function titleCase(value: string): string {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatDate(iso?: string): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
    new Date(iso),
  )
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(iso))
}

/** The buyer's full name, or null when neither name is saved. */
export function buyerName(buyer: BuyerProfile | null | undefined): string | null {
  const name = [buyer?.first_name, buyer?.last_name].filter(Boolean).join(' ').trim()
  return name || null
}

/** Up to two initials for the avatar, e.g. "Jane Doe" -> "JD". */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
