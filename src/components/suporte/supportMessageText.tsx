import type { PointerEvent } from 'react'

const BLOCK_TAGS = new Set([
  'P',
  'DIV',
  'LI',
  'H1',
  'H2',
  'H3',
  'H4',
  'BLOCKQUOTE',
  'PRE',
])

function normalizePlainText(value: string) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function walkRichTextNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? ''
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return ''
  }

  const element = node as HTMLElement

  if (element.tagName === 'BR') {
    return '\n'
  }

  let output = ''
  for (const child of Array.from(element.childNodes)) {
    output += walkRichTextNode(child)
  }

  if (BLOCK_TAGS.has(element.tagName)) {
    const trimmed = output.trim()
    return trimmed ? `\n\n${trimmed}\n\n` : '\n'
  }

  return output
}

/** Preserva quebras de parágrafo ao converter o editor rich text em texto plano. */
export function extractPlainTextFromRichHtml(html: string): string {
  if (!html.trim()) return ''

  const root = document.createElement('div')
  root.innerHTML = html
  return normalizePlainText(walkRichTextNode(root))
}

export function extractPlainTextFromRichEditor(element: HTMLElement): string {
  return extractPlainTextFromRichHtml(element.innerHTML)
}

type SupportMessageBodyProps = {
  body: string
  className?: string
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void
}

export function SupportMessageBody({
  body,
  className = 'mt-1',
  onPointerDown,
}: SupportMessageBodyProps) {
  const lines = body.split('\n')

  return (
    <div
      data-message-body
      className={`${className} flex cursor-text select-text flex-col gap-2`}
      onPointerDown={onPointerDown}
    >
      {lines.map((line, index) =>
        line.length === 0 ? (
          <div key={index} className="h-2 shrink-0" aria-hidden />
        ) : (
          <p key={index} className="break-words leading-relaxed">
            {line}
          </p>
        ),
      )}
    </div>
  )
}
