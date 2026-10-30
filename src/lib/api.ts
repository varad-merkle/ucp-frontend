/** Client for the UCP agent's chat and inspection endpoints. */

import type {
  ChatReply,
  CheckoutDetails,
  Health,
  Profile,
  ProfilePatch,
} from './types'

export class AgentError extends Error {}

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
  let response: Response
  try {
    response = await fetch(path, {
      headers: { 'content-type': 'application/json' },
      ...init,
    })
  } catch {
    throw new AgentError(
      'Cannot reach the UCP agent. Is it running on port 7000?',
    )
  }
  if (!response.ok) {
    const detail = response.status === 422 ? await errorDetail(response) : null
    throw new AgentError(detail ?? `${path} failed with status ${response.status}`)
  }
  return (await response.json()) as T
}

export const api = {
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
}
