/** Suggestion chips plus the message input. */

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

import { useChat } from '../state/ChatContext'
import { IconSend } from './icons'

export function Composer() {
  const { send, sending, suggestions } = useChat()
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Grow the box with the text instead of scrolling a one-line field.
  useEffect(() => {
    const element = inputRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`
  }, [draft])

  useEffect(() => {
    if (!sending) inputRef.current?.focus()
  }, [sending])

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (!draft.trim() || sending) return
    send(draft)
    setDraft('')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div className="composer-wrap">
      {suggestions.length > 0 && !sending && (
        <div className="suggestions">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="chip"
              onClick={() => send(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form className="composer" onSubmit={submit}>
        <textarea
          ref={inputRef}
          rows={1}
          className="composer-input"
          placeholder="Ask for anything — “show me table lamps under $150”"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          disabled={sending}
          aria-label="Message"
        />
        <button
          type="submit"
          className="composer-send"
          disabled={sending || !draft.trim()}
          aria-label="Send message"
        >
          <IconSend size={17} />
        </button>
      </form>

      <p className="composer-hint">
        Every turn is a live UCP call to the store. Press{' '}
        <kbd>/</kbd> to open the protocol log.
      </p>
    </div>
  )
}
