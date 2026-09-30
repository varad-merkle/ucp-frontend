/** Light / dark switch shown in the top-right corner. */

import { useEffect, useState } from 'react'

import { IconMoon, IconSun } from './icons'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

// index.html sets data-theme before the first paint, so start from that.
function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      className="btn btn-ghost btn-icon theme-toggle"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
    </button>
  )
}
