/** Client for the UCP agent's chat and inspection endpoints. */

import type {
  ChatReply,
  CheckoutDetails,
  Health,
  IdentityStatus,
  Profile,
  ProfilePatch,
} from './types'

export class AgentError extends Error {}

// ------------------------------------------------------------ login token

const TOKEN_KEY = 'ucp-token'

/**
 * The token from POST /api/login. Kept in localStorage so a page reload stays
 * logged in; the server holds tokens in memory, so a backend restart makes it
 * stale and the next request's 401 sends the user back to the login screen.
 */
let token: string | null = null
try {
  token = localStorage.getItem(TOKEN_KEY)
} catch {
  // storage blocked (private window etc.): log in each visit
}

function setToken(value: string | null) {
  token = value
  try {
    if (value) localStorage.setItem(TOKEN_KEY, value)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
}

export function hasToken(): boolean {
  return token !== null
}

/** Called when the server rejects our token, so the app can show the login screen. */
let onUnauthorized: () => void = () => {}
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

/**
 * The reason FastAPI gives for a failed request: a string from our own checks, or a
 * list of field errors when the body doesn't match the schema (e.g. an unknown field).
 */
async function errorDetail(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { detail?: unknown }
    if (typeof body.detail === 'string') return body.detail
    if (Array.isArray(body.detail)) {
      return body.detail
        .map((item: { loc?: unknown[]; msg?: string }) => {
          const field = item.loc?.filter((part) => part !== 'body').join('.')
          return field ? `${field}: ${item.msg}` : item.msg
        })
        .join('; ')
    }
  } catch {
    // not JSON; fall back to the status code
  }
  return null
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const sentToken = token
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (sentToken) headers.authorization = `Bearer ${sentToken}`

  let response: Response
  try {
    response = await fetch(path, { ...init, headers })
  } catch {
    throw new AgentError(
      'Cannot reach the UCP agent. Is it running on port 7000?',
    )
  }
  if (response.status === 401 && sentToken) {
    // Our token is unknown to the server (expired, logged out, or the backend
    // restarted). Drop it and go back to the login screen.
    setToken(null)
    onUnauthorized()
  }
  if (!response.ok) {
    const detail = await errorDetail(response)
    throw new AgentError(detail ?? `${path} failed with status ${response.status}`)
  }
  return (await response.json()) as T
}

export const api = {
  /** Exchange username + password for a token, stored for every later request. */
  login: async (username: string, password: string) => {
    const result = await json<{ token: string; username: string }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    setToken(result.token)
    return result.username
  },

  /** Invalidate the token on the server (best effort) and forget it locally. */
  logout: async () => {
    try {
      if (token) await json('/api/logout', { method: 'POST' })
    } catch {
      // already invalid or server down: forgetting it locally is enough
    } finally {
      setToken(null)
    }
  },

  /** Who the stored token belongs to; used on page load to restore the session. */
  me: () => json<{ username: string }>('/api/me'),

  chat: (message: string, sessionId: string | null) =>
    json<ChatReply>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, session_id: sessionId }),
    }),

  /** The checkout card's delivery details form, saved in one update. */
  checkoutDetails: (sessionId: string, details: CheckoutDetails) =>
    json<ChatReply>('/api/checkout/details', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, details }),
    }),

  /** A cart card's Checkout button: opens the checkout for that store. */
  startCheckout: (sessionId: string, store: string) =>
    json<ChatReply>('/api/checkout/start', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, store }),
    }),

  /** The saved buyer profile and market preferences. */
  profile: () => json<Profile>('/api/profile'),

  /** Partial update; returns the whole profile as the server now has it. */
  updateProfile: (patch: ProfilePatch) =>
    json<Profile>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  health: () => json<Health>('/api/health'),

  /** Identity linking status: the Shop account and each store. */
  identity: () => json<IdentityStatus>('/api/identity'),

  /**
   * Start linking Shop accounts ('shop') or one store. Sends the browser to the sign-in
   * page; the server's callback brings it back here with ?identity=linked|error.
   */
  linkIdentity: async (target: string) => {
    const { authorize_url } = await json<{ authorize_url: string }>('/api/identity/link', {
      method: 'POST',
      body: JSON.stringify({ target }),
    })
    window.location.assign(authorize_url)
  },

  /** Unlink (the server revokes the tokens first); returns the new status. */
  unlinkIdentity: (target: string) =>
    json<IdentityStatus>(`/api/identity/${encodeURIComponent(target)}`, { method: 'DELETE' }),
}
