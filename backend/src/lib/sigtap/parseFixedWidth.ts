export type FixedWidthColumn = {
  name: string
  start: number
  end: number
}

export function sliceFixedWidthLine(line: string, start: number, end: number): string {
  return line.slice(start - 1, end).trim()
}

export function parseFixedWidthLine(
  line: string,
  columns: FixedWidthColumn[],
): Record<string, string> {
  const row: Record<string, string> = {}
  for (const column of columns) {
    row[column.name] = sliceFixedWidthLine(line, column.start, column.end)
  }
  return row
}

export const SIGTAP_PROCEDIMENTO_COLUMNS: FixedWidthColumn[] = [
  { name: 'CO_PROCEDIMENTO', start: 1, end: 10 },
  { name: 'NO_PROCEDIMENTO', start: 11, end: 260 },
  { name: 'DT_COMPETENCIA', start: 331, end: 336 },
]

export const SIGTAP_OCUPACAO_COLUMNS: FixedWidthColumn[] = [
  { name: 'CO_OCUPACAO', start: 1, end: 6 },
  { name: 'NO_OCUPACAO', start: 7, end: 156 },
]

export const SIGTAP_PROCEDIMENTO_OCUPACAO_COLUMNS: FixedWidthColumn[] = [
  { name: 'CO_PROCEDIMENTO', start: 1, end: 10 },
  { name: 'CO_OCUPACAO', start: 11, end: 16 },
  { name: 'DT_COMPETENCIA', start: 17, end: 22 },
]
