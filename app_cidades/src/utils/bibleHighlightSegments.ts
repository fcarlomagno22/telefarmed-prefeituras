import type { BibleVerseHighlight } from '../types/bibleHighlights'

export type BibleTextSegment =
  | { type: 'plain'; text: string; offset: number }
  | { type: 'highlight'; text: string; offset: number; highlight: BibleVerseHighlight }

export function buildHighlightSegments(text: string, highlights: BibleVerseHighlight[]) {
  const valid = [...highlights]
    .filter((highlight) => highlight.start >= 0 && highlight.end <= text.length && highlight.start < highlight.end)
    .sort((left, right) => left.start - right.start)

  const segments: BibleTextSegment[] = []
  let cursor = 0

  for (const highlight of valid) {
    if (highlight.start < cursor) continue

    if (highlight.start > cursor) {
      segments.push({
        type: 'plain',
        text: text.slice(cursor, highlight.start),
        offset: cursor,
      })
    }

    segments.push({
      type: 'highlight',
      text: text.slice(highlight.start, highlight.end),
      offset: highlight.start,
      highlight,
    })
    cursor = highlight.end
  }

  if (cursor < text.length) {
    segments.push({
      type: 'plain',
      text: text.slice(cursor),
      offset: cursor,
    })
  }

  return segments
}

export function highlightsOverlap(
  left: Pick<BibleVerseHighlight, 'start' | 'end'>,
  right: Pick<BibleVerseHighlight, 'start' | 'end'>,
) {
  return left.start < right.end && right.start < left.end
}
