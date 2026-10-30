import { useEffect, useState } from 'react'

import { Composer } from './components/Composer'
import { MessageList } from './components/MessageList'
import { ProfileDrawer } from './components/ProfileDrawer'
import { Sidebar } from './components/Sidebar'
import { ThemeToggle } from './components/ThemeToggle'
import { IconCart, IconPlus, IconUser } from './components/icons'
import { api } from './lib/api'
import { buyerName, formatAmount, initials } from './lib/format'
import type { Profile } from './lib/types'
import { useChat } from './state/ChatContext'

export default function App() {
  const { state, send, sending, newChat } = useChat()
  const [profileOpen, setProfileOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  // Load the saved profile once so the header can greet the buyer by name.
  useEffect(() => {
    api.profile().then(setProfile).catch(() => setProfile(null))
  }, [])

  const name = buyerName(profile?.buyer)

  return (
    <div className="shell">
      <Sidebar profile={profile} onOpenProfile={() => setProfileOpen(true)} />

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">
            <h1>Shopping Assistant</h1>
            <span className="faint">Search, compare and check out across partner stores</span>
          </div>
          <div className="topbar-actions">
            {/* The sidebar is hidden on narrow screens, so New chat needs a
                home in the top bar too. */}
            <button
              type="button"
              className="btn btn-ghost show-sm"
              onClick={newChat}
              aria-label="New chat"
            >
              <IconPlus size={15} />
            </button>
            <button
              type="button"
              className="btn"
              disabled={sending}
              onClick={() => send("What's in my cart?")}
            >
              <IconCart size={15} />
              {state.cart_count > 0 ? (
                <>
                  <span className="badge accent mono">{state.cart_count}</span>
                  <span className="hide-sm">{formatAmount(state.cart_subtotal)}</span>
                </>
              ) : (
                <span className="hide-sm">Cart</span>
              )}
            </button>
            <ThemeToggle />
            <button
              type="button"
              className="btn btn-ghost profile-btn"
              onClick={() => setProfileOpen(true)}
              aria-label={name ? `Profile: ${name}` : 'Profile'}
              title={name ?? 'Profile'}
            >
              <span className="avatar">{name ? initials(name) : <IconUser size={14} />}</span>
              <span className="hide-sm truncate">{name ?? 'Profile'}</span>
            </button>
          </div>
        </header>

        <MessageList />

        <Composer />
      </div>

      <ProfileDrawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSaved={setProfile}
      />
    </div>
  )
}
