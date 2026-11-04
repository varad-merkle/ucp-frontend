/**
 * Linked accounts (UCP identity linking), in the sidebar.
 *
 * One "Connect" signs in to Shop accounts, which links every store that trusts it
 * without another sign-in. A store that refuses that can be signed in to directly.
 * Hidden entirely until the server is configured for linking (status.enabled).
 */

import { useCallback, useEffect, useState } from 'react'

import { AgentError, api } from '../lib/api'
import type { IdentityStatus, IdentityStore } from '../lib/types'

type Notice = { tone: 'ok' | 'error'; text: string }

/** The ?identity=... the server's callback sends the browser back with, if any. */
function readReturn(): Notice | null {
  const params = new URLSearchParams(window.location.search)
  const outcome = params.get('identity')
  if (outcome === 'linked') {
    const target = params.get('target')
    return { tone: 'ok', text: target === 'shop' ? 'Shop account connected.' : 'Store account linked.' }
  }
  if (outcome === 'error') {
    return { tone: 'error', text: params.get('reason') ?? 'Linking did not complete.' }
  }
  return null
}

function storeState(store: IdentityStore): string {
  if (store.linked) return store.via === 'chained' ? 'Linked through Shop' : 'Linked'
  if (store.error) return 'Shop link refused: sign in to the store'
  return 'Shopping as guest'
}

export function IdentityPanel() {
  const [status, setStatus] = useState<IdentityStatus | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(readReturn)

  const refresh = useCallback(async () => {
    try {
      setStatus(await api.identity())
    } catch {
      setStatus(null)
    }
  }, [])

  useEffect(() => {
    void refresh()
    // Drop ?identity=... from the address bar so a reload doesn't repeat the notice.
    if (window.location.search.includes('identity=')) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [refresh])

  async function link(target: string) {
    setBusy(target)
    setNotice(null)
    try {
      await api.linkIdentity(target) // navigates away on success
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof AgentError ? error.message : 'Could not start linking.' })
      setBusy(null)
    }
  }

  async function unlink(target: string) {
    setBusy(target)
    setNotice(null)
    try {
      setStatus(await api.unlinkIdentity(target))
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof AgentError ? error.message : 'Could not unlink.' })
    } finally {
      setBusy(null)
    }
  }

  if (!status?.enabled) return null

  const stores = status.stores.filter((store) => store.supported && store.configured)

  return (
    <div className="conn identity">
      <span className="conn-label">Linked accounts</span>

      <div className="identity-row">
        <span className="identity-text">
          <strong>Shop account</strong>
          <span className="truncate">
            {status.shop.linked
              ? (status.shop.account ?? 'Connected')
              : 'One sign-in links every store'}
          </span>
        </span>
        {status.shop.linked ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={busy !== null}
            onClick={() => void unlink('shop')}
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={busy !== null}
            onClick={() => void link('shop')}
          >
            {busy === 'shop' ? 'Opening…' : 'Connect'}
          </button>
        )}
      </div>

      {stores.length > 0 && (
        <ul className="identity-stores">
          {stores.map((store) => (
            <li key={store.id} className="identity-row">
              <span className={`dot ${store.linked ? 'ok' : ''}`} />
              <span className="identity-text">
                <strong className="truncate">{store.name}</strong>
                <span className="truncate" title={store.error ?? undefined}>
                  {storeState(store)}
                </span>
              </span>
              {store.via === 'oauth' ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={busy !== null}
                  onClick={() => void unlink(store.id)}
                >
                  Unlink
                </button>
              ) : (
                !store.linked && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={busy !== null}
                    onClick={() => void link(store.id)}
                    title={`Sign in to ${store.name} directly`}
                  >
                    {busy === store.id ? 'Opening…' : 'Sign in'}
                  </button>
                )
              )}
            </li>
          ))}
        </ul>
      )}

      {notice && (
        <p className={`identity-notice ${notice.tone}`} role="status">
          {notice.text}
        </p>
      )}
    </div>
  )
}
