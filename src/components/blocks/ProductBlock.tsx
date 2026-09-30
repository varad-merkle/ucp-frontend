/** Expanded product card with variant picker and quantity stepper. */

import { useState } from 'react'

import { discountPercent, money, titleCase } from '../../lib/format'
import type { ProductDetail } from '../../lib/types'
import { useChat } from '../../state/ChatContext'
import { Rating } from '../ui'
import { IconCart, IconMinus, IconPlus } from '../icons'

/** Matches the merchant's own low-stock threshold. */
const LOW_STOCK = 3

export function ProductBlock({ product }: { product: ProductDetail }) {
  const { send, sending } = useChat()
  const [quantity, setQuantity] = useState(1)

  const { variant } = product
  const off = discountPercent(variant.price, variant.list_price)

  return (
    <article className="pdetail">
      <div className="pdetail-media">
        {product.image && <img src={product.image} alt={product.title} />}
        {off !== null && <span className="pcard-flag">{off}% off</span>}
      </div>

      <div className="pdetail-body">
        <header>
          {product.brand && <div className="pcard-brand">{product.brand}</div>}
          <h3>{product.title}</h3>
          <Rating rating={product.rating} />
        </header>

        <div className="pdetail-price">
          <strong>{money(variant.price)}</strong>
          {variant.list_price && variant.list_price.amount > variant.price.amount && (
            <span className="was">{money(variant.list_price)}</span>
          )}
          {variant.availability &&
            variant.availability !== 'in_stock' &&
            variant.availability !== 'backorder' && (
            <span className={`badge ${variant.purchasable ? 'warning' : 'danger'}`}>
              {titleCase(variant.availability)}
            </span>
          )}
          {/* Scarcity is worth surfacing, abundance is just noise. */}
          {!variant.backorderable &&
            variant.stock != null &&
            variant.stock > 0 &&
            variant.stock <= LOW_STOCK && (
              <span className="badge warning">Only {variant.stock} left</span>
            )}
        </div>

        {product.highlights.length > 0 && (
          <ul className="pdetail-highlights">
            {product.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}

        {product.options.length > 1 && (
          <div className="pdetail-options">
            <span className="pdetail-options-label">{product.option_name}</span>
            <div className="chip-row">
              {product.options.map((option) => (
                <button
                  key={option.id ?? option.label}
                  type="button"
                  className={`chip${option.label === variant.label ? ' active' : ''}`}
                  disabled={sending || !option.available}
                  onClick={() => send(`In ${option.label}`)}
                  title={option.available ? undefined : `${option.label} is unavailable`}
                >
                  {option.label}
                  {!option.available && ' · sold out'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pdetail-actions">
          <div className="qty">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <IconMinus />
            </button>
            <span>{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              aria-label="Increase quantity"
            >
              <IconPlus />
            </button>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            disabled={sending || !variant.purchasable}
            onClick={() =>
              send(
                quantity > 1
                  ? `Add ${quantity} of the ${product.title}`
                  : `Add the ${product.title}`,
              )
            }
          >
            <IconCart size={15} />
            {variant.purchasable ? 'Add to cart' : 'Unavailable'}
          </button>
        </div>

        {product.policies.length > 0 && (
          <div className="pdetail-policies">
            {product.policies.map((policy) => (
              <p key={policy.label}>
                <span className="badge accent">{policy.label}</span> {policy.text}
              </p>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
