/** Product carousel — the "flash products for this query" response. */

import { useState } from 'react'

import { discountPercent, money, titleCase } from '../../lib/format'
import type { CardVariant, ProductCard } from '../../lib/types'
import { useChat } from '../../state/ChatContext'
import { Rating } from '../ui'
import { IconCart } from '../icons'

/** Matches the merchant's own low-stock threshold. */
const LOW_STOCK = 3

function availabilityTone(status?: string) {
  // Backorder items are still purchasable; like the storefront, don't flag them.
  if (!status || status === 'in_stock' || status === 'backorder') return null
  return status === 'out_of_stock' || status === 'discontinued'
    ? 'danger'
    : 'warning'
}

function Card({ product }: { product: ProductCard }) {
  const { send, sending } = useChat()
  const variants = product.variants ?? []

  // Start on whatever the agent featured — which already honours a size in the
  // query — then let the shopper switch without leaving the card.
  const [selectedId, setSelectedId] = useState<string | undefined>(
    () => variants.find((v) => v.label === product.variant_label)?.id ?? variants[0]?.id,
  )
  const selected: CardVariant | undefined =
    variants.find((v) => v.id === selectedId) ?? variants[0]

  const price = selected?.price ?? product.price
  const listPrice = selected?.list_price ?? product.list_price
  const off = discountPercent(price, listPrice)
  const status = selected?.status ?? product.availability
  const tone = availabilityTone(status)
  const stock = selected?.stock
  const purchasable = selected ? selected.available : true
  const hasSizes = variants.length > 1

  const detailMessage = `Tell me about the ${product.title}`
  const addMessage =
    hasSizes && selected?.label
      ? `Add the ${product.title} in ${selected.label}`
      : `Add the ${product.title}`

  return (
    <article className="pcard" role="listitem">
      <button
        type="button"
        className="pcard-media"
        onClick={() => send(detailMessage)}
        disabled={sending}
        aria-label={`See details for ${product.title}`}
      >
        {product.image && (
          <img src={product.image} alt={product.title} loading="lazy" />
        )}
        {off !== null && <span className="pcard-flag">{off}% off</span>}
        {tone ? (
          <span className={`pcard-stock ${tone}`}>{titleCase(status!)}</span>
        ) : (
          stock != null &&
          stock > 0 &&
          stock <= LOW_STOCK && (
            <span className="pcard-stock warning">{stock} left</span>
          )
        )}
      </button>

      <div className="pcard-body">
        {product.brand && <div className="pcard-brand">{product.brand}</div>}
        <button
          type="button"
          className="pcard-title"
          onClick={() => send(detailMessage)}
          disabled={sending}
        >
          {product.title}
        </button>
        {product.tagline && <p className="pcard-tag">{product.tagline}</p>}

        <Rating rating={product.rating} />

        {hasSizes && (
          <div className="pcard-sizes">
            <span className="pcard-sizes-label">{product.option_name}</span>
            <div className="chip-row">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  className={`chip chip-xs${variant.id === selected?.id ? ' active' : ''}`}
                  disabled={!variant.available}
                  onClick={() => setSelectedId(variant.id)}
                  title={
                    variant.available
                      ? undefined
                      : `${variant.label} is ${(variant.status ?? 'unavailable').replace(/_/g, ' ')}`
                  }
                >
                  {variant.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pcard-price">
          <strong>{money(price)}</strong>
          {listPrice && listPrice.amount > price.amount && (
            <span className="was">{money(listPrice)}</span>
          )}
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm pcard-add"
          onClick={() => send(addMessage)}
          disabled={sending || !purchasable}
        >
          <IconCart size={14} />
          {purchasable ? 'Add to cart' : 'Sold out'}
        </button>
      </div>
    </article>
  )
}

export function ProductsBlock({ products }: { products: ProductCard[] }) {
  return (
    <div className="pcards" role="list">
      {products.map((product) => (
        <Card key={product.id} product={product} />
      ))}
    </div>
  )
}
