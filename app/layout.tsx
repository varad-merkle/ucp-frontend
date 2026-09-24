import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UCP Commerce Chatbot',
  description: 'Universal Commerce Protocol Shopping Assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
