/**
 * Who is logged in.
 *
 * On load a stored token is checked with GET /api/me; any 401 from any request
 * (see setUnauthorizedHandler in api.ts) drops the user back to the login screen.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { api, hasToken, setUnauthorizedHandler } from '../lib/api'

type AuthStatus = 'checking' | 'signed-out' | 'signed-in'

type AuthContextValue = {
  status: AuthStatus
  username: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(hasToken() ? 'checking' : 'signed-out')
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUsername(null)
      setStatus('signed-out')
    })
    if (!hasToken()) return
    api
      .me()
      .then((me) => {
        setUsername(me.username)
        setStatus('signed-in')
      })
      .catch(() => setStatus('signed-out'))
  }, [])

  const login = useCallback(async (name: string, password: string) => {
    const who = await api.login(name, password)
    setUsername(who)
    setStatus('signed-in')
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    setUsername(null)
    setStatus('signed-out')
  }, [])

  const value = useMemo(
    () => ({ status, username, login, logout }),
    [status, username, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
