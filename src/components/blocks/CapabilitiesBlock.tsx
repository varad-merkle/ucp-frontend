/** What the merchant advertises at /.well-known/ucp. */

import { shortCapability } from '../../lib/format'
import type { CapabilitiesView } from '../../lib/types'
import { IconCheck } from '../icons'

export function CapabilitiesBlock({
  version,
  business,
  capabilities,
  payment_handlers,
}: CapabilitiesView) {
  return (
    <div className="card-lite capcard">
      <header className="capcard-head">
        <div>
          <h4>{business?.name}</h4>
          <span className="faint">
            {[
              `UCP ${version}`,
              business?.product_count != null && `${business.product_count} products`,
              business?.currency,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
      </header>

      <section className="checkoutcard-section">
        <span className="section-label">Capabilities</span>
        <ul className="caplist">
          {capabilities.map((capability) => (
            <li key={capability.name}>
              <span className="caplist-tick">
                <IconCheck size={12} />
              </span>
              <span>
                <strong>{shortCapability(capability.name)}</strong>
                <code className="faint">{capability.name}</code>
              </span>
              <span className="badge mono">{capability.version}</span>
            </li>
          ))}
        </ul>
      </section>

      {payment_handlers.length > 0 && (
        <section className="checkoutcard-section">
          <span className="section-label">Payment handlers</span>
          <div className="chip-row">
            {payment_handlers.map((handler) => (
              <span className="chip" key={handler.id}>
                {handler.id}
              </span>
            ))}
          </div>
        </section>
      )}

      {business?.categories && (
        <section className="checkoutcard-section">
          <span className="section-label">Categories</span>
          <div className="chip-row">
            {business.categories.map((category) => (
              <span className="chip" key={category}>
                {category}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
