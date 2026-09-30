/**
 * Protocol inspector.
 *
 * Reads the agent's exchange ring buffer so every UCP request and response —
 * including the headers the agent generated — can be inspected from the UI.
 * This is the part of the console that makes the protocol itself visible.
 */

import { useCallback, useEffect, useState } from 'react'

import { api } from '../lib/api'
import { formatTime, shortCapability } from '../lib/format'
import type { Exchange } from '../lib/types'
import { Drawer } from './Drawer'
import { EmptyState } from './ui'
import { IconChevron, IconRefresh, IconTrash } from './icons'

function pathOf(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

function Json({ label, value }: { label: string; value: unknown }) {
  if (value == null) return null
  return (
    <>
      <div className="json-label">{label}</div>
      <pre className="json">{JSON.stringify(value, null, 2)}</pre>
    </>
  )
}

function ExchangeRow({ exchange }: { exchange: Exchange }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="exchange">
      <button
        type="button"
        className="exchange-head"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <IconChevron size={12} />
        <span className="exchange-method">{exchange.method}</span>
        <span className="exchange-path">{pathOf(exchange.url)}</span>
        <span className={`exchange-status ${exchange.ok ? 'ok' : 'bad'}`}>
          {exchange.status}
        </span>
        <span className="exchange-time">{exchange.duration_ms}ms</span>
      </button>

      {open && (
        <div className="exchange-detail">
          <div
            className="row"
            style={{ flexWrap: 'wrap', gap: 'var(--s-2)', paddingTop: 'var(--s-3)' }}
          >
            <span className="badge accent">{shortCapability(exchange.capability)}</span>
            <span className="badge mono">{formatTime(exchange.started_at)}</span>
            <span className="badge mono">{exchange.id.slice(0, 8)}</span>
          </div>
          <Json label="Request headers" value={exchange.request_headers} />
          <Json label="Request body" value={exchange.request_body} />
          <Json label="Response body" value={exchange.response_body} />
        </div>
      )}
    </div>
  )
}

export function ProtocolInspector({
  open,
  onClose,
  tick,
  onCountChange,
}: {
  open: boolean
  onClose: () => void
  /** Bumped by the app after each UCP call so the log stays current. */
  tick: number
  onCountChange: (count: number) => void
}) {
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.exchanges(40)
      setExchanges(result.exchanges)
      onCountChange(result.total)
    } catch {
      setExchanges([])
      onCountChange(0)
    } finally {
      setLoading(false)
    }
  }, [onCountChange])

  useEffect(() => {
    void refresh()
  }, [refresh, tick])

  const clear = async () => {
    await api.clearExchanges()
    await refresh()
  }

  const failures = exchanges.filter((exchange) => !exchange.ok).length

  return (
    <Drawer
      open={open}
      onClose={onClose}
      wide
      title="Protocol log"
      subtitle={`${exchanges.length} exchanges${failures ? ` · ${failures} failed` : ''} between the agent and the merchant`}
      footer={
        <>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => void refresh()}
            disabled={loading}
          >
            <IconRefresh size={13} />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => void clear()}
            disabled={loading || exchanges.length === 0}
          >
            <IconTrash size={13} />
            Clear
          </button>
          <span className="faint" style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)' }}>
            Newest first
          </span>
        </>
      }
    >
      {exchanges.length === 0 ? (
        <EmptyState
          title="No exchanges yet"
          body="Every call the agent makes to the merchant is captured here with its UCP headers, request body and response."
        />
      ) : (
        <div>
          {exchanges.map((exchange) => (
            <ExchangeRow key={exchange.id} exchange={exchange} />
          ))}
        </div>
      )}
    </Drawer>
  )
}
