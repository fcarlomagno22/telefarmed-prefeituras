export type WordSearchCellBounds = {
  row: number
  col: number
  x: number
  y: number
  width: number
  height: number
}

export function upsertWordSearchCellBounds(
  bounds: WordSearchCellBounds[],
  next: WordSearchCellBounds,
): WordSearchCellBounds[] {
  const index = bounds.findIndex((item) => item.row === next.row && item.col === next.col)
  if (index === -1) return [...bounds, next]

  const updated = bounds.slice()
  updated[index] = next
  return updated
}

function isPointInsideBounds(pageX: number, pageY: number, bounds: WordSearchCellBounds): boolean {
  return (
    pageX >= bounds.x &&
    pageX <= bounds.x + bounds.width &&
    pageY >= bounds.y &&
    pageY <= bounds.y + bounds.height
  )
}

function distanceToCellCenter(pageX: number, pageY: number, bounds: WordSearchCellBounds): number {
  const centerX = bounds.x + bounds.width / 2
  const centerY = bounds.y + bounds.height / 2
  const deltaX = pageX - centerX
  const deltaY = pageY - centerY
  return deltaX * deltaX + deltaY * deltaY
}

export function hitTestWordSearchCell(
  pageX: number,
  pageY: number,
  bounds: WordSearchCellBounds[],
): { row: number; col: number } | null {
  if (bounds.length === 0) return null

  for (const cell of bounds) {
    if (isPointInsideBounds(pageX, pageY, cell)) {
      return { row: cell.row, col: cell.col }
    }
  }

  let nearest = bounds[0]
  let nearestDistance = distanceToCellCenter(pageX, pageY, nearest)

  for (let index = 1; index < bounds.length; index += 1) {
    const cell = bounds[index]
    const distance = distanceToCellCenter(pageX, pageY, cell)
    if (distance < nearestDistance) {
      nearest = cell
      nearestDistance = distance
    }
  }

  return { row: nearest.row, col: nearest.col }
}
