/** Sign-in screen shown until the user has a valid token. */

import { useState, type FormEvent } from 'react'

import { AgentError } from '../lib/api'
import { useAuth } from '../state/AuthContext'
import { ThemeToggle } from './ThemeToggle'

export function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(username.trim(), password)
    } catch (err) {
      setError(err instanceof AgentError ? err.message : 'Login failed.')
      setBusy(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-theme">
        <ThemeToggle />
      </div>
      <form className="login-card" onSubmit={submit}>
        <div className="brand">
          <div className="brand-mark">SA</div>
          <div className="brand-text">
            <strong>Shopping Assistant</strong>
            <span>Powered by UCP</span>
          </div>
        </div>

        <h2>Sign in</h2>

        <label className="detailsform-field">
          <span>Username</span>
          <input
            autoFocus
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={busy}
            required
          />
        </label>
        <label className="detailsform-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            required
          />
        </label>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary login-submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
