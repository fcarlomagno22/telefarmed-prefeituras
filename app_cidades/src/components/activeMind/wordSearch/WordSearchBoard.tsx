import { useCallback, useMemo, useRef } from 'react'
import {
  type GestureResponderEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { colors } from '../../../theme/colors'
import {
  buildWordSearchSelectionLine,
  localTouchToWordSearchCell,
  wordSearchCellKey,
} from '../../../utils/wordSearchSelection'

export const WORD_SEARCH_CELL_GAP = 2
export const WORD_SEARCH_FRAME_PADDING = 16

const DRAG_THRESHOLD_PX = 6

type WordSearchBoardProps = {
  rows: number
  cols: number
  cells: Record<string, { row: number; col: number; letter: string }>
  activeSelectionKeys: Set<string>
  foundCellKeys: Set<string>
  wrongSelectionKeys: Set<string>
  layoutWidth: number
  maxSize: number
  disabled?: boolean
  onSelectionChange: (cellKeys: string[]) => void
  onSelectionComplete: (cellKeys: string[]) => void
  onCellPress: (row: number, col: number) => void
}

function getCellSize(rows: number, cols: number, maxSize: number): number {
  const innerWidth = Math.max(120, maxSize - WORD_SEARCH_FRAME_PADDING)
  const innerHeight = Math.max(120, maxSize - WORD_SEARCH_FRAME_PADDING)

  const widthLimited = (innerWidth - WORD_SEARCH_CELL_GAP * Math.max(0, cols - 1)) / cols
  const heightLimited = (innerHeight - WORD_SEARCH_CELL_GAP * Math.max(0, rows - 1)) / rows

  return Math.max(22, Math.floor(Math.min(widthLimited, heightLimited, 38)))
}

export function WordSearchBoard({
  rows,
  cols,
  cells,
  activeSelectionKeys,
  foundCellKeys,
  wrongSelectionKeys,
  layoutWidth,
  maxSize,
  disabled = false,
  onSelectionChange,
  onSelectionComplete,
  onCellPress,
}: WordSearchBoardProps) {
  const cellSize = getCellSize(rows, cols, maxSize)
  const gridWidth = cellSize * cols + WORD_SEARCH_CELL_GAP * Math.max(0, cols - 1)
  const gridHeight = cellSize * rows + WORD_SEARCH_CELL_GAP * Math.max(0, rows - 1)
  const letterFontSize = Math.max(12, Math.min(16, Math.floor(cellSize * 0.42)))

  const anchorCellRef = useRef<{ row: number; col: number } | null>(null)
  const selectionKeysRef = useRef<string[]>([])
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })

  const resolveCellFromEvent = useCallback(
    (event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent
      return localTouchToWordSearchCell(
        locationX,
        locationY,
        rows,
        cols,
        cellSize,
        WORD_SEARCH_CELL_GAP,
      )
    },
    [cellSize, cols, rows],
  )

  const updateDragSelection = useCallback(
    (end: { row: number; col: number }) => {
      const anchor = anchorCellRef.current
      if (!anchor) return

      const keys = buildWordSearchSelectionLine(anchor, end, rows, cols)
      selectionKeysRef.current = keys
      onSelectionChange(keys)
    },
    [cols, onSelectionChange, rows],
  )

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (event) => {
          const cell = resolveCellFromEvent(event)
          if (!cell) return

          isDraggingRef.current = false
          dragStartRef.current = {
            x: event.nativeEvent.locationX,
            y: event.nativeEvent.locationY,
          }
          anchorCellRef.current = cell
          const keys = [wordSearchCellKey(cell.row, cell.col)]
          selectionKeysRef.current = keys
          onSelectionChange(keys)
        },
        onPanResponderMove: (event) => {
          const anchor = anchorCellRef.current
          if (!anchor) return

          const deltaX = event.nativeEvent.locationX - dragStartRef.current.x
          const deltaY = event.nativeEvent.locationY - dragStartRef.current.y
          if (
            !isDraggingRef.current &&
            Math.abs(deltaX) <= DRAG_THRESHOLD_PX &&
            Math.abs(deltaY) <= DRAG_THRESHOLD_PX
          ) {
            return
          }

          isDraggingRef.current = true
          const cell = resolveCellFromEvent(event) ?? anchor
          updateDragSelection(cell)
        },
        onPanResponderRelease: () => {
          const anchor = anchorCellRef.current

          if (isDraggingRef.current && selectionKeysRef.current.length >= 2) {
            onSelectionComplete(selectionKeysRef.current)
          } else if (!isDraggingRef.current && anchor) {
            onCellPress(anchor.row, anchor.col)
          } else {
            onSelectionChange([])
          }

          anchorCellRef.current = null
          selectionKeysRef.current = []
          isDraggingRef.current = false
        },
        onPanResponderTerminate: () => {
          anchorCellRef.current = null
          selectionKeysRef.current = []
          isDraggingRef.current = false
          onSelectionChange([])
        },
      }),
    [
      disabled,
      onCellPress,
      onSelectionChange,
      onSelectionComplete,
      resolveCellFromEvent,
      updateDragSelection,
    ],
  )

  return (
    <View style={[styles.outer, { width: layoutWidth }]}>
      <View style={[styles.frame, { width: layoutWidth }]}>
        <View
          {...panResponder.panHandlers}
          style={[styles.gridShell, { width: gridWidth, height: gridHeight, gap: WORD_SEARCH_CELL_GAP }]}
        >
          {Array.from({ length: rows }).map((_, row) => (
            <View
              key={`row-${row}`}
              pointerEvents="none"
              style={[styles.row, { gap: WORD_SEARCH_CELL_GAP, height: cellSize }]}
            >
              {Array.from({ length: cols }).map((__, col) => {
                const key = wordSearchCellKey(row, col)
                const cell = cells[key]

                if (!cell) {
                  return (
                    <View
                      key={key}
                      pointerEvents="none"
                      style={[styles.missingCell, { width: cellSize, height: cellSize }]}
                    />
                  )
                }

                const isActive = activeSelectionKeys.has(key)
                const isFound = foundCellKeys.has(key)
                const isWrong = wrongSelectionKeys.has(key)

                return (
                  <View
                    key={key}
                    pointerEvents="none"
                    style={[
                      styles.cell,
                      {
                        width: cellSize,
                        height: cellSize,
                      },
                      isActive && !isFound && styles.cellActive,
                      isWrong && styles.cellWrong,
                      isFound && styles.cellFound,
                    ]}
                    accessibilityRole="text"
                    accessibilityLabel={`Letra ${cell.letter}, linha ${row + 1}, coluna ${col + 1}`}
                  >
                    <Text style={[styles.cellLetter, { fontSize: letterFontSize, lineHeight: letterFontSize }]}>
                      {cell.letter}
                    </Text>
                  </View>
                )
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    alignSelf: 'stretch',
  },
  frame: {
    padding: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.22)',
    overflow: 'hidden',
    alignItems: 'center',
  },
  gridShell: {
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  missingCell: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 4,
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
  cellActive: {
    backgroundColor: 'rgba(244, 114, 182, 0.2)',
    borderColor: '#f9a8d4',
  },
  cellWrong: {
    backgroundColor: 'rgba(248, 113, 113, 0.16)',
    borderColor: 'rgba(248, 113, 113, 0.5)',
  },
  cellFound: {
    backgroundColor: 'rgba(74, 222, 128, 0.16)',
    borderColor: 'rgba(74, 222, 128, 0.5)',
  },
  cellLetter: {
    color: colors.text,
    fontWeight: '700',
    textTransform: 'uppercase',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
})
