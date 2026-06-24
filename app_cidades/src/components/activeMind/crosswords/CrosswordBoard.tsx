import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { CrosswordEntry } from '../../../types/crossword'
import {
  CrosswordHintTooltip,
  getCrosswordHintTooltipLayout,
} from './CrosswordHintTooltip'

export const CROSSWORD_CELL_GAP = 2
export const CROSSWORD_FRAME_PADDING = 16

type CrosswordBoardProps = {
  rows: number
  cols: number
  cells: Record<string, { row: number; col: number; isBlock: boolean; solution: string; user: string; number?: number }>
  selectedCell: { row: number; col: number } | null
  hintTooltipEntry: CrosswordEntry | null
  activeEntryCellKeys: string[]
  activeEntrySolved: boolean
  solvedCellKeys: Set<string>
  cellFeedback: Record<string, 'correct' | 'wrong'>
  maxSize: number
  onSelectCell: (row: number, col: number) => void
}

function cellKey(row: number, col: number): string {
  return `${row},${col}`
}

function getCellSize(rows: number, cols: number, maxSize: number): number {
  const innerWidth = Math.max(120, maxSize - CROSSWORD_FRAME_PADDING)
  const innerHeight = Math.max(120, maxSize - CROSSWORD_FRAME_PADDING)

  const widthLimited = (innerWidth - CROSSWORD_CELL_GAP * Math.max(0, cols - 1)) / cols
  const heightLimited = (innerHeight - CROSSWORD_CELL_GAP * Math.max(0, rows - 1)) / rows

  return Math.max(22, Math.floor(Math.min(widthLimited, heightLimited, 38)))
}

export function CrosswordBoard({
  rows,
  cols,
  cells,
  selectedCell,
  hintTooltipEntry,
  activeEntryCellKeys,
  activeEntrySolved,
  solvedCellKeys,
  cellFeedback,
  maxSize,
  onSelectCell,
}: CrosswordBoardProps) {
  const cellSize = getCellSize(rows, cols, maxSize)
  const gridWidth = cellSize * cols + CROSSWORD_CELL_GAP * Math.max(0, cols - 1)
  const gridHeight = cellSize * rows + CROSSWORD_CELL_GAP * Math.max(0, rows - 1)
  const boardWidth = gridWidth + CROSSWORD_FRAME_PADDING
  const letterFontSize = Math.max(12, Math.min(16, Math.floor(cellSize * 0.42)))
  const numberFontSize = Math.max(7, Math.min(9, Math.floor(cellSize * 0.2)))

  const tooltipLayout = hintTooltipEntry
    ? getCrosswordHintTooltipLayout({
        row: hintTooltipEntry.row,
        col: hintTooltipEntry.col,
        rows,
        cellSize,
        cellGap: CROSSWORD_CELL_GAP,
        framePadding: CROSSWORD_FRAME_PADDING / 2,
        boardWidth,
      })
    : null

  return (
    <View
      style={[
        styles.outer,
        {
          width: boardWidth,
          maxWidth: maxSize,
        },
      ]}
    >
      <View style={[styles.frame, { width: boardWidth }]}>
        <View style={[styles.grid, { width: gridWidth, height: gridHeight }]}>
          {Array.from({ length: rows }).map((_, row) => (
            <View
              key={`row-${row}`}
              style={[styles.row, { gap: CROSSWORD_CELL_GAP, height: cellSize }]}
            >
              {Array.from({ length: cols }).map((__, col) => {
                const key = cellKey(row, col)
                const cell = cells[key]

                if (!cell) {
                  return (
                    <View
                      key={key}
                      style={[styles.missingCell, { width: cellSize, height: cellSize }]}
                    />
                  )
                }

                if (cell.isBlock) {
                  return (
                    <View
                      key={key}
                      style={[styles.blockCell, { width: cellSize, height: cellSize }]}
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                    />
                  )
                }

                const isSelected = selectedCell?.row === row && selectedCell?.col === col
                const isActiveWord = activeEntryCellKeys.includes(key)
                const isLockedCrossing =
                  !activeEntrySolved && solvedCellKeys.has(key) && isActiveWord
                const feedback = cellFeedback[key]
                const solved = solvedCellKeys.has(key) && !isLockedCrossing

                return (
                  <Pressable
                    key={key}
                    onPress={() => onSelectCell(row, col)}
                    style={({ pressed }) => [
                      styles.cell,
                      {
                        width: cellSize,
                        height: cellSize,
                      },
                      isActiveWord && styles.cellActiveWord,
                      isLockedCrossing && styles.cellLockedCrossing,
                      isSelected && styles.cellSelected,
                      feedback === 'correct' && styles.cellCorrect,
                      feedback === 'wrong' && styles.cellWrong,
                      solved && styles.cellSolved,
                      pressed && styles.cellPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={
                      cell.number != null
                        ? `Palavra ${cell.number}, célula ${row + 1} por ${col + 1}`
                        : `Célula ${row + 1} por ${col + 1}`
                    }
                  >
                    {cell.number != null ? (
                      <Text style={[styles.cellNumber, { fontSize: numberFontSize }]}>{cell.number}</Text>
                    ) : null}
                    <Text
                      style={[
                        styles.cellLetter,
                        { fontSize: letterFontSize },
                        !cell.user && styles.cellLetterEmpty,
                      ]}
                    >
                      {cell.user || ''}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          ))}
        </View>
      </View>

      {hintTooltipEntry && tooltipLayout ? (
        <CrosswordHintTooltip
          hint={hintTooltipEntry.hint}
          number={hintTooltipEntry.number}
          direction={hintTooltipEntry.direction}
          left={tooltipLayout.left}
          top={tooltipLayout.top}
          maxWidth={tooltipLayout.maxWidth}
          placement={tooltipLayout.placement}
          arrowLeft={tooltipLayout.arrowLeft}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    alignSelf: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  frame: {
    padding: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.22)',
    overflow: 'hidden',
  },
  grid: {
    gap: CROSSWORD_CELL_GAP,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  missingCell: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 4,
  },
  blockCell: {
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.9)',
  },
  cell: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  cellActiveWord: {
    backgroundColor: 'rgba(244, 114, 182, 0.12)',
    borderColor: 'rgba(244, 114, 182, 0.28)',
  },
  cellLockedCrossing: {
    backgroundColor: 'rgba(103, 232, 249, 0.1)',
    borderColor: 'rgba(103, 232, 249, 0.42)',
    borderWidth: 1.5,
  },
  cellSelected: {
    borderColor: '#f9a8d4',
    backgroundColor: 'rgba(244, 114, 182, 0.2)',
  },
  cellCorrect: {
    backgroundColor: 'rgba(74, 222, 128, 0.16)',
    borderColor: 'rgba(74, 222, 128, 0.5)',
  },
  cellWrong: {
    backgroundColor: 'rgba(248, 113, 113, 0.16)',
    borderColor: 'rgba(248, 113, 113, 0.5)',
  },
  cellSolved: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderColor: 'rgba(74, 222, 128, 0.35)',
  },
  cellPressed: {
    opacity: 0.88,
  },
  cellNumber: {
    position: 'absolute',
    top: 1,
    left: 3,
    color: '#f9a8d4',
    fontWeight: '700',
    lineHeight: 10,
  },
  cellLetter: {
    color: colors.text,
    fontWeight: '700',
    textTransform: 'uppercase',
    includeFontPadding: false,
    textAlign: 'center',
  },
  cellLetterEmpty: {
    color: 'transparent',
  },
})
