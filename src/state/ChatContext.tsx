/**
 * Conversation state.
 *
 * `send` is the single way anything enters the conversation. Buttons inside
 * product, cart and checkout cards call it too, so clicking "Add to cart" is
 * recorded as a user turn exactly as if it had been typed — the transcript
 * stays a complete record of the session.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { AgentError, api } from '../lib/api'
import type { ChatReply, ChatState, CheckoutDetails, Message } from '../lib/types'

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  blocks: [
    {
      type: 'text',
      text:
        'Welcome. I can help you find products across our partner stores, ' +
        'compare options and prepare your checkout. What are you looking for today?',
    },
  ],
}

const OPENING_SUGGESTIONS = [
  'A sofa for my living room',
  'Allbirds slip-ons',
  'Car cleaning products',
  'Which stores can you shop at?',
]

type ChatContextValue = {
  messages: Message[]
  suggestions: string[]
  state: ChatState
  sending: boolean
  send: (text: string) => void
  submitCheckoutDetails: (details: CheckoutDetails) => void
  startCheckout: (storeId: string, storeName: string) => void
  newChat: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

const EMPTY_STATE: ChatState = {
  cart_count: 0,
  cart_subtotal: 0,
  checkout_id: null,
  order_id: null,
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [suggestions, setSuggestions] = useState<string[]>(OPENING_SUGGESTIONS)
  const [state, setState] = useState<ChatState>(EMPTY_STATE)
  const [sending, setSending] = useState(false)

  const sessionId = useRef<string | null>(null)
  const counter = useRef(0)
  const inFlight = useRef(false)

  /** One turn: show `text` as the shopper's message, then the reply from `request`. */
  const runTurn = useCallback((text: string, request: () => Promise<ChatReply>) => {
    // One turn at a time: the agent's session state is not reentrant, and
    // overlapping turns would interleave cart mutations.
    if (inFlight.current) return

    inFlight.current = true
    setSending(true)
    setSuggestions([])

    const turn = ++counter.current
    const pendingId = `a${turn}`
    setMessages((current) => [
      ...current,
      { id: `u${turn}`, role: 'user', text },
      { id: pendingId, role: 'assistant', pending: true },
    ])

    void (async () => {
      try {
        const reply = await request()
        sessionId.current = reply.session_id
        setMessages((current) =>
          current.map((message) =>
            message.id === pendingId
              ? { id: pendingId, role: 'assistant', blocks: reply.blocks }
              : message,
          ),
        )
        setSuggestions(reply.suggestions)
        setState(reply.state)
      } catch (error) {
        const text =
          error instanceof AgentError
            ? error.message
            : 'Something went wrong talking to the agent.'
        setMessages((current) =>
          current.map((message) =>
            message.id === pendingId
              ? {
                  id: pendingId,
                  role: 'assistant',
                  failed: true,
                  blocks: [{ type: 'notice', tone: 'error', text }],
                }
              : message,
          ),
        )
        setSuggestions(['Try again'])
      } finally {
        inFlight.current = false
        setSending(false)
      }
    })()
  }, [])

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim()
      if (text) runTurn(text, () => api.chat(text, sessionId.current))
    },
    [runTurn],
  )

  const submitCheckoutDetails = useCallback(
    (details: CheckoutDetails) => {
      const sid = sessionId.current
      if (sid) runTurn('Delivery details', () => api.checkoutDetails(sid, details))
    },
    [runTurn],
  )

  const startCheckout = useCallback(
    (storeId: string, storeName: string) => {
      const sid = sessionId.current
      if (sid) runTurn(`Checkout ${storeName}`, () => api.startCheckout(sid, storeId))
    },
    [runTurn],
  )

  const newChat = useCallback(() => {
    sessionId.current = null
    counter.current = 0
    setMessages([WELCOME])
    setSuggestions(OPENING_SUGGESTIONS)
    setState(EMPTY_STATE)
  }, [])

  const value = useMemo(
    () => ({ messages, suggestions, state, sending, send, submitCheckoutDetails, startCheckout, newChat }),
    [messages, suggestions, state, sending, send, submitCheckoutDetails, startCheckout, newChat],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext)
  if (!context) throw new Error('useChat must be used inside <ChatProvider>')
  return context
}
