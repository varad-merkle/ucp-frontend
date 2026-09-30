/** Left rail: new chat, starter prompts and connection status. */

import { useCallback, useEffect, useState } from 'react'

import { api } from '../lib/api'
import { formatAmount } from '../lib/format'
import type { Health } from '../lib/types'
import { useChat } from '../state/ChatContext'
import { IconPlus, IconRefresh, IconTerminal } from './icons'

const STARTERS = [
  'Show me floor lamps',
  'Throw pillows under $50',
  'Accent chairs under $400',
  'Rugs between $100 and $300',
  'What can the store do?',
]

export function Sidebar({
  onOpenInspector,
  inspectorCount,
}: {
  onOpenInspector: () => void
  inspectorCount: number
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

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">P1</div>
        <div className="brand-text">
          <strong>Pier 1</strong>
          <span>UCP shopping agent</span>
        </div>
      </div>

      <button type="button" className="btn btn-newchat" onClick={newChat}>
        <IconPlus size={15} />
        New chat
      </button>

      <nav className="starters" aria-label="Starter prompts">
        <div className="nav-heading">Try asking</div>
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
        <button type="button" className="btn btn-ghost btn-block" onClick={onOpenInspector}>
          <IconTerminal size={15} />
          Protocol log
          {inspectorCount > 0 && <span className="badge mono">{inspectorCount}</span>}
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
            <span className="conn-label">Store</span>
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
                : 'Unreachable — is the client running on :7000?'}
            </span>
          </div>
          <div className="conn-url">
            {health?.agent.merchant_url ?? '—'}
            {merchantOnline && ` · ${health?.merchant.latency_ms}ms`}
          </div>
          <div className="conn-url">UCP {health?.agent.version ?? '—'}</div>
        </div>
      </div>
    </aside>
  )
}
