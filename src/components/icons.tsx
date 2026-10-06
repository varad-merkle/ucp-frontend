/** Inline icon set — keeps the bundle dependency-free. */

type IconProps = { size?: number; className?: string }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export const IconCart = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.3a1.5 1.5 0 0 0 1.5-1.2L20.5 8H6" />
    <circle cx="9.5" cy="20" r="1.2" />
    <circle cx="17.5" cy="20" r="1.2" />
  </svg>
)

export const IconTerminal = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="m7.5 9.5 2.5 2.5-2.5 2.5M13 15h4" />
  </svg>
)

export const IconClose = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const IconRefresh = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M20 12a8 8 0 1 1-2.3-5.7" />
    <path d="M20 4v4.5h-4.5" />
  </svg>
)

export const IconCheck = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
)

export const IconChevron = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const IconTrash = ({ size = 15 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </svg>
)

export const IconPlus = ({ size = 14 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconMinus = ({ size = 14 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M5 12h14" />
  </svg>
)

export const IconSend = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
)

export const IconSun = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </svg>
)

export const IconMoon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </svg>
)
