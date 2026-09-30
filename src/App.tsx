import { useEffect, useState } from 'react'

import { Composer } from './components/Composer'
import { MessageList } from './components/MessageList'
import { ProtocolInspector } from './components/ProtocolInspector'
import { Sidebar } from './components/Sidebar'
import { ThemeToggle } from './components/ThemeToggle'
import { IconCart, IconPlus, IconTerminal } from './components/icons'
import { formatAmount } from './lib/format'
import { useChat } from './state/ChatContext'

export default function App() {
  const { exchangeTick, state, send, sending, newChat } = useChat()
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [exchangeCount, setExchangeCount] = useState(0)

  // `/` toggles the protocol log, unless the composer has focus.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      if (event.key === '/' && !typing) {
        event.preventDefault()
        setInspectorOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="shell">
      <Sidebar
        onOpenInspector={() => setInspectorOpen(true)}
        inspectorCount={exchangeCount}
      />

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">
            <h1>Shopping assistant</h1>
            <span className="faint">Powered by the Universal Commerce Protocol</span>
          </div>
          <div className="topbar-actions">
            {/* The sidebar is hidden on narrow screens, so New chat needs a
                home in the top bar too. */}
            <button
              type="button"
              className="btn btn-ghost show-sm"
              onClick={newChat}
              aria-label="New chat"
            >
              <IconPlus size={15} />
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setInspectorOpen(true)}
            >
              <IconTerminal size={15} />
              <span className="hide-sm">Protocol log</span>
              {exchangeCount > 0 && <span className="badge mono">{exchangeCount}</span>}
            </button>
            <button
              type="button"
              className="btn"
              disabled={sending}
              onClick={() => send("What's in my cart?")}
            >
              <IconCart size={15} />
              {state.cart_count > 0 ? (
                <>
                  <span className="badge accent mono">{state.cart_count}</span>
                  <span className="hide-sm">{formatAmount(state.cart_subtotal)}</span>
                </>
              ) : (
                <span className="hide-sm">Cart</span>
              )}
            </button>
            <ThemeToggle />
          </div>
        </header>

        <MessageList />

        <Composer />
      </div>

      <ProtocolInspector
        open={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        tick={exchangeTick}
        onCountChange={setExchangeCount}
      />
    </div>
  )
}
