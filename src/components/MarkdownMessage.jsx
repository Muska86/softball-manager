/**
 * Renders a subset of markdown commonly used by Claude:
 * - Paragraphs (blank-line separated)
 * - Numbered lists (1. 2. 3.)
 * - Bullet lists (- or *)
 * - **bold** and *italic*
 * - `inline code`
 */

function renderInline(text) {
  // Split on bold, italic, and inline code markers
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1 py-0.5 rounded bg-gray-700 text-brand-300 text-xs font-mono">{part.slice(1, -1)}</code>
    }
    return part
  })
}

function parseBlocks(text) {
  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Split into blocks by blank lines
  const rawBlocks = normalized.split(/\n{2,}/)

  const blocks = []

  for (const block of rawBlocks) {
    const lines = block.split('\n').filter((l) => l.trim() !== '')
    if (lines.length === 0) continue

    // Numbered list block
    if (lines.every((l) => /^\d+\.\s/.test(l.trim()))) {
      blocks.push({
        type: 'ol',
        items: lines.map((l) => l.replace(/^\d+\.\s*/, '').trim()),
      })
      continue
    }

    // Bullet list block
    if (lines.every((l) => /^[-*]\s/.test(l.trim()))) {
      blocks.push({
        type: 'ul',
        items: lines.map((l) => l.replace(/^[-*]\s*/, '').trim()),
      })
      continue
    }

    // Mixed block — try to split out list items embedded in prose
    const mixed = []
    let proseBuf = []

    for (const line of lines) {
      const trimmed = line.trim()
      const isNumbered = /^\d+\.\s/.test(trimmed)
      const isBullet = /^[-*]\s/.test(trimmed)

      if (isNumbered || isBullet) {
        if (proseBuf.length) {
          mixed.push({ type: 'p', text: proseBuf.join(' ') })
          proseBuf = []
        }
        mixed.push({
          type: isNumbered ? 'ol-item' : 'ul-item',
          text: trimmed.replace(/^(\d+\.|-|\*)\s*/, ''),
        })
      } else {
        proseBuf.push(trimmed)
      }
    }

    if (proseBuf.length) {
      mixed.push({ type: 'p', text: proseBuf.join(' ') })
    }

    // Collect consecutive list items into list groups
    let i = 0
    while (i < mixed.length) {
      const item = mixed[i]
      if (item.type === 'ol-item' || item.type === 'ul-item') {
        const listType = item.type === 'ol-item' ? 'ol' : 'ul'
        const items = []
        while (i < mixed.length && mixed[i].type === item.type) {
          items.push(mixed[i].text)
          i++
        }
        blocks.push({ type: listType, items })
      } else {
        blocks.push(item)
        i++
      }
    }
  }

  return blocks
}

export default function MarkdownMessage({ content, className = '' }) {
  const blocks = parseBlocks(content)

  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((block, i) => {
        if (block.type === 'ol') {
          return (
            <ol key={i} className="list-none space-y-1.5 pl-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-brand-700/60 text-brand-300 text-xs font-bold flex items-center justify-center mt-0.5">
                    {j + 1}
                  </span>
                  <span className="text-gray-200 leading-snug">{renderInline(item)}</span>
                </li>
              ))}
            </ol>
          )
        }

        if (block.type === 'ul') {
          return (
            <ul key={i} className="list-none space-y-1.5 pl-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2.5">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-brand-400 mt-2" />
                  <span className="text-gray-200 leading-snug">{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          )
        }

        // paragraph
        return (
          <p key={i} className="text-gray-200 leading-relaxed">
            {renderInline(block.text || '')}
          </p>
        )
      })}
    </div>
  )
}
