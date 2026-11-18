/** Client for the UCP agent's chat and inspection endpoints. */

import type {
  ChatReply,
  CheckoutDetails,
  DetectedLocation,
  Health,
  Profile,
  ProfilePatch,
} from './types'

export class AgentError extends Error {}

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
    throw new AgentError(`${path} failed with status ${response.status}`)
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

  /** Ask the backend to detect the request IP from its trusted hosting proxy. */
  detectLocation: () => json<DetectedLocation>('/api/auto-detect-location'),

  /** Partial update; returns the whole profile as the server now has it. */
  updateProfile: (patch: ProfilePatch) =>
    json<Profile>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  health: () => json<Health>('/api/health'),

  exchanges: (limit = 40) =>
    json<{ exchanges: Exchange[]; total: number }>(`/api/exchanges?limit=${limit}`),

  clearExchanges: () => fetch('/api/exchanges', { method: 'DELETE' }),
}
