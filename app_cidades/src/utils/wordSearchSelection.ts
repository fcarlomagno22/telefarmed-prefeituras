export function wordSearchCellKey(row: number, col: number): string {
  return `${row},${col}`
}

export function buildWordSearchSelectionLine(
  start: { row: number; col: number },
  end: { row: number; col: number },
  rows: number,
  cols: number,
): string[] {
  const deltaRow = end.row - start.row
  const deltaCol = end.col - start.col
  const stepRow = deltaRow === 0 ? 0 : deltaRow > 0 ? 1 : -1
  const stepCol = deltaCol === 0 ? 0 : deltaCol > 0 ? 1 : -1

  if (!(deltaRow === 0 || deltaCol === 0 || Math.abs(deltaRow) === Math.abs(deltaCol))) {
    return [wordSearchCellKey(start.row, start.col)]
  }

  const steps = Math.max(Math.abs(deltaRow), Math.abs(deltaCol))
  const keys: string[] = []

  for (let index = 0; index <= steps; index += 1) {
    const row = start.row + stepRow * index
    const col = start.col + stepCol * index
    if (row < 0 || col < 0 || row >= rows || col >= cols) break
    keys.push(wordSearchCellKey(row, col))
  }

  return keys
}

/** Hit-test using touch coords relative to the grid view (same layout as rendered cells). */
export function localTouchToWordSearchCell(
  localX: number,
  localY: number,
  rows: number,
  cols: number,
  cellSize: number,
  cellGap: number,
): { row: number; col: number } | null {
  const stride = cellSize + cellGap
  const maxX = cols * stride - cellGap
  const maxY = rows * stride - cellGap

  if (localX < 0 || localY < 0 || localX > maxX || localY > maxY) {
    return null
  }

  for (let row = 0; row < rows; row += 1) {
    const top = row * stride
    const bottom = top + cellSize
    if (localY < top || localY > bottom) continue

    for (let col = 0; col < cols; col += 1) {
      const left = col * stride
      const right = left + cellSize
      if (localX >= left && localX <= right) {
        return { row, col }
      }
    }
  }

  let nearestRow = 0
  let nearestRowDistance = Number.POSITIVE_INFINITY
  for (let row = 0; row < rows; row += 1) {
    const centerY = row * stride + cellSize / 2
    const distance = Math.abs(localY - centerY)
    if (distance < nearestRowDistance) {
      nearestRowDistance = distance
      nearestRow = row
    }
  }

  let nearestCol = 0
  let nearestColDistance = Number.POSITIVE_INFINITY
  for (let col = 0; col < cols; col += 1) {
    const centerX = col * stride + cellSize / 2
    const distance = Math.abs(localX - centerX)
    if (distance < nearestColDistance) {
      nearestColDistance = distance
      nearestCol = col
    }
  }

  return { row: nearestRow, col: nearestCol }
}
