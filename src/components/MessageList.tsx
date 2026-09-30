/** The conversation transcript. */

import { useCallback, useEffect, useRef, useState } from 'react'

import { Markdown } from '../lib/markdown'
import type { Block, Message } from '../lib/types'
import { useChat } from '../state/ChatContext'
import { CapabilitiesBlock } from './blocks/CapabilitiesBlock'
import { CartBlock } from './blocks/CartBlock'
import { CheckoutBlock } from './blocks/CheckoutBlock'
import { OrderBlock } from './blocks/OrderBlock'
import { ProductBlock } from './blocks/ProductBlock'
import { ProductsBlock } from './blocks/ProductsBlock'
import { IconChevron } from './icons'

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'text':
      return (
        <div className="prose">
          <Markdown text={block.text} />
        </div>
      )
    case 'notice':
      return (
        <div className={`message ${block.tone}`}>
          <span>{block.text}</span>
        </div>
      )
    case 'products':
      return <ProductsBlock products={block.products} />
    case 'product':
      return <ProductBlock product={block.product} />
    case 'cart':
      return (
        <CartBlock
          lines={block.lines}
          subtotal={block.subtotal}
          currency={block.currency}
        />
      )
    case 'checkout':
      return <CheckoutBlock checkout={block.checkout} />
    case 'order':
      return <OrderBlock order={block.order} />
    case 'capabilities':
      return <CapabilitiesBlock {...block} />
    default:
      return null
  }
}

function Thinking() {
  return (
    <div className="thinking" aria-label="Assistant is working">
      <span />
      <span />
      <span />
    </div>
  )
}

function MessageView({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="turn user">
        <div className="bubble">{message.text}</div>
      </div>
    )
  }

  return (
    <div className="turn assistant">
      <div className="avatar" aria-hidden>
        UCP
      </div>
      <div className="turn-body">
        {message.pending ? (
          <Thinking />
        ) : (
          message.blocks?.map((block, index) => (
            <BlockView key={index} block={block} />
          ))
        )}
      </div>
    </div>
  )
}

/** Distance from the bottom, in px, still counted as "following the latest". */
const PIN_THRESHOLD = 140

export function MessageList() {
  const { messages } = useChat()
  const scrollRef = useRef<HTMLElement>(null)
  const [pinned, setPinned] = useState(true)

  const toBottom = useCallback((behavior: ScrollBehavior) => {
    const element = scrollRef.current
    if (element) element.scrollTo({ top: element.scrollHeight, behavior })
  }, [])

  // Follow new turns only while the reader is already at the bottom, so
  // scrolling back through a long conversation isn't yanked away.
  useEffect(() => {
    if (pinned) toBottom('smooth')
  }, [messages, pinned, toBottom])

  const onScroll = () => {
    const element = scrollRef.current
    if (!element) return
    const distance = element.scrollHeight - element.scrollTop - element.clientHeight
    setPinned(distance <= PIN_THRESHOLD)
  }

  return (
    <div className="chat-area">
      <main className="chat" ref={scrollRef} onScroll={onScroll}>
        <div className="transcript" role="log" aria-live="polite">
          {messages.map((message) => (
            <MessageView key={message.id} message={message} />
          ))}
        </div>
      </main>

      {!pinned && (
        <button
          type="button"
          className="jump-latest"
          onClick={() => {
            setPinned(true)
            toBottom('smooth')
          }}
        >
          <IconChevron size={13} />
          Jump to latest
        </button>
      )}
    </div>
  )
}
