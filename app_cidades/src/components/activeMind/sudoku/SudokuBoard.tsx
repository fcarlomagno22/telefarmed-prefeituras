import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { colors } from '../../../theme/colors'
import type { SudokuCellFeedback, SudokuSession } from '../../../types/sudoku'

type SudokuBoardProps = {
  session: SudokuSession
  selectedIndex: number | null
  conflictIndexes?: Set<number>
  cellFeedback?: Partial<Record<number, SudokuCellFeedback>>
  maxGridSize?: number
  onSelectCell: (index: number) => void
}

const BOARD_PADDING = 8
const THICK_BORDER = 2
const THIN_BORDER = StyleSheet.hairlineWidth

function getBorderRightWidth(col: number): number {
  if (col === 8) return 0
  if ((col + 1) % 3 === 0) return THICK_BORDER
  return THIN_BORDER
}

function getBorderBottomWidth(row: number): number {
  if (row === 8) return 0
  if ((row + 1) % 3 === 0) return THICK_BORDER
  return THIN_BORDER
}

type SudokuCellProps = {
  index: number
  value: number
  cellSize: number
  fontSize: number
  textOffset: number
  isGiven: boolean
  isRevealed: boolean
  isSelected: boolean
  isConflict: boolean
  feedback?: SudokuCellFeedback
  onPress: (index: number) => void
}

function SudokuCell({
  index,
  value,
  cellSize,
  fontSize,
  textOffset,
  isGiven,
  isRevealed,
  isSelected,
  isConflict,
  feedback,
  onPress,
}: SudokuCellProps) {
  const row = Math.floor(index / 9)
  const col = index % 9

  return (
    <Pressable
      onPress={() => onPress(index)}
      style={[
        styles.cell,
        {
          width: cellSize,
          height: cellSize,
          borderRightWidth: getBorderRightWidth(col),
          borderBottomWidth: getBorderBottomWidth(row),
        },
        isSelected && styles.cellSelected,
        isConflict && styles.cellConflict,
        feedback === 'correct' && styles.cellCorrect,
        feedback === 'wrong' && styles.cellWrong,
        feedback === 'conflict-source' && styles.cellConflictSource,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Célula ${row + 1}, ${col + 1}${value ? `, valor ${value}` : ', vazia'}`}
    >
      <Text
        style={[
          styles.cellValue,
          {
            fontSize,
            lineHeight: fontSize + 1,
            marginBottom: textOffset,
          },
          isGiven && styles.cellValueGiven,
          isRevealed && styles.cellValueRevealed,
          !isGiven && !isRevealed && value !== 0 && styles.cellValueEditable,
          isConflict && styles.cellValueConflict,
        ]}
      >
        {value === 0 ? '' : value}
      </Text>
    </Pressable>
  )
}

export function SudokuBoard({
  session,
  selectedIndex,
  conflictIndexes,
  cellFeedback,
  maxGridSize,
  onSelectCell,
}: SudokuBoardProps) {
  const { width: screenWidth } = useWindowDimensions()
  const conflicts = conflictIndexes ?? new Set<number>()
  const boardOuterSize = maxGridSize ?? Math.min(screenWidth - 32, 360)
  const gridSize = boardOuterSize - BOARD_PADDING * 2
  const cellSize = Math.floor(gridSize / 9)
  const gridExactSize = cellSize * 9
  const fontSize = Math.max(11, Math.min(15, Math.floor(cellSize * 0.34)))
  const textOffset = Math.max(2, Math.floor(cellSize * 0.1))

  function handleCellPress(index: number) {
    void Haptics.selectionAsync()
    onSelectCell(index)
  }

  return (
    <View style={[styles.board, { width: gridExactSize + BOARD_PADDING * 2 }]}>
      <View
        style={[
          styles.grid,
          {
            width: gridExactSize,
            height: gridExactSize,
            borderWidth: THICK_BORDER,
          },
        ]}
      >
        {Array.from({ length: 9 }, (_, row) => (
          <View key={`row-${row}`} style={[styles.row, { height: cellSize }]}>
            {Array.from({ length: 9 }, (_, col) => {
              const index = row * 9 + col
              const value = session.values[index]

              return (
                <SudokuCell
                  key={index}
                  index={index}
                  value={value}
                  cellSize={cellSize}
                  fontSize={fontSize}
                  textOffset={textOffset}
                  isGiven={session.givens[index]}
                  isRevealed={session.revealed[index]}
                  isSelected={selectedIndex === index}
                  isConflict={conflicts.has(index)}
                  feedback={cellFeedback?.[index]}
                  onPress={handleCellPress}
                />
              )
            })}
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  board: {
    alignSelf: 'center',
    padding: BOARD_PADDING,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  grid: {
    overflow: 'hidden',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  cellSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cellConflict: {
    backgroundColor: 'rgba(255, 107, 107, 0.14)',
  },
  cellCorrect: {
    backgroundColor: 'rgba(74, 222, 128, 0.18)',
  },
  cellWrong: {
    backgroundColor: 'rgba(255, 107, 107, 0.22)',
  },
  cellConflictSource: {
    backgroundColor: 'rgba(251, 191, 36, 0.16)',
  },
  cellValue: {
    fontWeight: '600',
    textAlign: 'center',
  },
  cellValueGiven: {
    color: colors.text,
  },
  cellValueRevealed: {
    color: '#fcd34d',
  },
  cellValueEditable: {
    color: '#93c5fd',
  },
  cellValueConflict: {
    color: colors.error,
  },
})
