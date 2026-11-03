import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import { LoginPage } from './components/LoginPage'
import { AuthProvider, useAuth } from './state/AuthContext'
import { ChatProvider } from './state/ChatContext'
import './index.css'

/** Login screen until signed in; then the chat, reset per user (keyed by username). */
function Root() {
  const { status, username } = useAuth()
  if (status === 'checking') return null
  if (status === 'signed-out') return <LoginPage />
  return (
    <ChatProvider key={username}>
      <App />
    </ChatProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>,
)
