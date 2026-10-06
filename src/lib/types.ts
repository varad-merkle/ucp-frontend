/**
 * Wire types for the chat API.
 *
 * The agent answers each turn with a list of *blocks*. A block is one thing to
 * render inline in the conversation: a paragraph, a product carousel, the
 * cart, the live checkout, or the finished order.
 */

export type Money = { amount: number; currency: string }

export type Rating = {
  value: number
  scale_min?: number
  scale_max: number
  count?: number
}

export type CardVariant = {
  id: string
  label?: string
  price: Money
  list_price?: Money
  available: boolean
  status?: string
  stock?: number | null
}

export type ProductCard = {
  id: string
  handle?: string
  title: string
  brand?: string
  tagline?: string
  category?: string
  image?: string
  /** Price of the featured variant, which follows any size the shopper asked for. */
  price: Money
  list_price?: Money
  price_from?: Money
  rating?: Rating
  availability?: string
  variant_count: number
  variant_label?: string
  /** Units on hand. Null for variants the merchant does not stock-track. */
  stock?: number | null
  /** Every variant, so the card can offer size chips without a round trip. */
  variants?: CardVariant[]
  option_name?: string
}

export type ProductOptionValue = {
  id?: string
  label: string
  available: boolean
  price?: Money
}

export type ProductDetail = ProductCard & {
  description?: string
  highlights: string[]
  tags: string[]
  option_name?: string
  options: ProductOptionValue[]
  variant: {
    id: string
    sku?: string
    label?: string
    price: Money
    list_price?: Money
    availability?: string
    purchasable: boolean
    stock?: number | null
    backorderable?: boolean
  }
  policies: { label: string; text?: string }[]
}

export type CartLine = {
  variant_id: string
  title: string
  variant_label?: string
  image?: string
  price: number
  quantity: number
  line_total: number
  availability?: string
}

export type Total = { type: string; display_text?: string; amount: number }

export type UcpMessage = {
  type: 'error' | 'warning' | 'info'
  code?: string
  content: string
  /** JSONPath of the field the message is about, e.g. "$.buyer.phone_number". */
  path?: string | null
  severity?: string | null
}

export type CheckoutView = {
  id: string
  status: string
  currency: string
  line_items: {
    id: string
    title: string
    variant_label?: string
    image?: string
    price: number
    quantity: number
    line_total: number
  }[]
  totals: Total[]
  buyer?: {
    first_name?: string
    last_name?: string
    email?: string
    phone_number?: string
  }
  address: Record<string, string>
  shipping_options: {
    id: string
    title: string
    description?: string
    carrier?: string
    amount: number
  }[]
  selected_shipping_id?: string
  instruments: { id: string; label: string; handler: string; selected: boolean }[]
  messages: UcpMessage[]
  links: { type: string; url: string; title?: string }[]
  /** Details the shopper entered, to pre-fill the delivery details form. */
  details: CheckoutDetails
  /** Where the buyer finishes on the store's own checkout page (UCP hand-off). */
  continue_url?: string
}

/** The checkout card's delivery details form. Country is a two-letter ISO code. */
export type CheckoutDetails = {
  email: string
  first_name: string
  last_name: string
  phone: string
  street_address: string
  city: string
  region: string
  postal_code: string
  country: string
}

export type OrderView = {
  id: string
  label?: string
  currency: string
  permalink_url: string
  line_items: {
    id: string
    title: string
    image?: string
    quantity: number
    line_total: number
    status: string
  }[]
  totals: Total[]
  destination: Record<string, string>
  method?: string
  expected_on?: string
  events: {
    id: string
    occurred_at: string
    type: string
    description?: string
    carrier?: string
    tracking_number?: string
    tracking_url?: string
  }[]
}

export type CapabilitiesView = {
  version?: string
  business?: {
    name?: string
    description?: string
    currency?: string
    categories?: string[]
    product_count?: number
  }
  capabilities: { name: string; version: string; spec?: string }[]
  payment_handlers: { name: string; id: string; version: string }[]
}

export type Block =
  | { type: 'text'; text: string }
  | { type: 'notice'; tone: 'error' | 'warning' | 'info'; text: string }
  | { type: 'products'; products: ProductCard[] }
  | { type: 'product'; product: ProductDetail }
  | { type: 'cart'; currency: string; subtotal: number; lines: CartLine[] }
  | { type: 'checkout'; checkout: CheckoutView }
  | { type: 'order'; order: OrderView }
  | ({ type: 'capabilities' } & CapabilitiesView)

export type ChatState = {
  cart_count: number
  cart_subtotal: number
  checkout_id: string | null
  order_id: string | null
}

export type ChatReply = {
  session_id: string
  blocks: Block[]
  suggestions: string[]
  state: ChatState
}

export type Message = {
  id: string
  role: 'user' | 'assistant'
  /** User turns carry plain text; assistant turns carry blocks. */
  text?: string
  blocks?: Block[]
  pending?: boolean
  failed?: boolean
}

export type Health = {
  agent: { status: string; version: string; profile_url: string; merchant_url: string }
  merchant: {
    reachable: boolean
    status: number
    latency_ms: number
    name?: string | null
  }
}

/** Metadata about one UCP request/response pair, for the protocol log. */
export type Exchange = {
  id: string
  capability: string
  method: string
  url: string
  started_at: string
  status: number
  ok: boolean
  duration_ms: number
  request_headers: Record<string, string>
  request_body?: unknown
  response_body?: unknown
  error?: string
}
