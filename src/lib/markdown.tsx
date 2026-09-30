/**
 * Minimal markdown renderer for assistant text.
 *
 * The agent only ever emits bold, inline code, links and dash bullets, so a
 * full markdown dependency would be several kilobytes to render four rules. Input
 * is never inserted as HTML — every token becomes a React node.
 */

import { Fragment, type ReactNode } from 'react'

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g
const LINK = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/

function inline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE).map((part, index) => {
    const key = `${keyPrefix}-${index}`
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={key}>{part.slice(1, -1)}</code>
    }
    const link = part.match(LINK)
    if (link) {
      return (
        <a key={key} href={link[2]} target="_blank" rel="noopener noreferrer">
          {link[1]}
        </a>
      )
    }
    return <Fragment key={key}>{part}</Fragment>
  })
}

export function Markdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const nodes: ReactNode[] = []
  let bullets: string[] = []

  const flush = () => {
    if (!bullets.length) return
    nodes.push(
      <ul key={`ul-${nodes.length}`}>
        {bullets.map((item, index) => (
          <li key={index}>{inline(item, `li-${nodes.length}-${index}`)}</li>
        ))}
      </ul>,
    )
    bullets = []
  }

  for (const line of lines) {
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    if (bullet) {
      bullets.push(bullet[1])
      continue
    }
    flush()
    if (line.trim()) {
      nodes.push(<p key={`p-${nodes.length}`}>{inline(line, `p-${nodes.length}`)}</p>)
    }
  }
  flush()

  return <>{nodes}</>
}
