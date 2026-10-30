/** Left rail: new chat, starter prompts, signed-in buyer and connection status. */

import { useCallback, useEffect, useState } from 'react'

import { api } from '../lib/api'
import { buyerName, formatAmount, initials } from '../lib/format'
import type { Health, Profile, StoreStatus } from '../lib/types'
import { useChat } from '../state/ChatContext'
import { IconPlus, IconRefresh, IconUser } from './icons'

const STARTERS = [
  'Sectional sofas under $1,500',
  'Area rugs for the living room',
  'Papasan chairs',
  'Sneakers for everyday wear',
  'Car interior detailing kits',
  'Dining sets for six',
]

/** The store's logo, falling back to its initial when there is none or it fails to load. */
function StoreLogo({ store }: { store: StoreStatus }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className="store-logo" aria-hidden="true">
      {store.logo && !failed ? (
        <img src={store.logo} alt="" onError={() => setFailed(true)} />
      ) : (
        store.name.charAt(0).toUpperCase()
      )}
    </span>
  )
}

export function Sidebar({
  profile,
  onOpenProfile,
}: {
  profile: Profile | null
  onOpenProfile: () => void
}) {
  const { send, newChat, state, sending } = useChat()
  const [health, setHealth] = useState<Health | null>(null)
  const [checking, setChecking] = useState(false)

  const refresh = useCallback(async () => {
    setChecking(true)
    try {
      setHealth(await api.health())
    } catch {
      setHealth(null)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const merchantOnline = Boolean(health?.merchant.reachable)
  const name = buyerName(profile?.buyer)

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">SA</div>
        <div className="brand-text">
          <strong>Shopping Assistant</strong>
          <span>Powered by UCP</span>
        </div>
      </div>

      <button type="button" className="btn btn-newchat" onClick={newChat}>
        <IconPlus size={15} />
        New chat
      </button>

      <nav className="starters" aria-label="Starter prompts">
        <div className="nav-heading">Suggestions</div>
        {STARTERS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="starter"
            disabled={sending}
            onClick={() => send(prompt)}
          >
            {prompt}
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <button type="button" className="user-card" onClick={onOpenProfile}>
          <span className="avatar">{name ? initials(name) : <IconUser size={14} />}</span>
          <span className="user-card-text">
            <strong className="truncate">{name ?? 'Set up your profile'}</strong>
            <span className="truncate">{profile?.buyer.email ?? 'Add your name and email'}</span>
          </span>
        </button>

        {state.cart_count > 0 && (
          <div className="conn cart-pill">
            <span>
              {state.cart_count} item{state.cart_count === 1 ? '' : 's'} in cart
            </span>
            <strong>{formatAmount(state.cart_subtotal)}</strong>
          </div>
        )}

        <div className="conn">
          <div className="row-between">
            <span className="conn-label">Stores</span>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => void refresh()}
              disabled={checking}
              aria-label="Re-check connection"
            >
              <IconRefresh size={12} />
            </button>
          </div>
          <div className="conn-row">
            <span className={`dot ${merchantOnline ? 'ok' : 'bad'}`} />
            <span className="truncate">
              {merchantOnline
                ? (health?.merchant.name ?? 'Online')
                : 'Stores unavailable'}
            </span>
          </div>
          {health?.stores && health.stores.length > 0 && (
            <ul className="store-list">
              {health.stores.map((store) => (
                <li key={store.id}>
                  <a
                    className="store-row"
                    href={store.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Visit ${store.name} (${store.online ? 'online' : 'offline'})`}
                  >
                    <StoreLogo store={store} />
                    <span className="store-text">
                      <strong className="truncate">{store.name}</strong>
                      {store.category && <span className="truncate">{store.category}</span>}
                    </span>
                    <span className={`dot ${store.online ? 'ok' : 'bad'}`} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  )
}
