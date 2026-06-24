import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { CrosswordDirection } from '../../../types/crossword'

export type CrosswordHintTooltipProps = {
  hint: string
  number: number
  direction: CrosswordDirection
  left: number
  top: number
  maxWidth: number
  placement: 'above' | 'below'
  arrowLeft: number
}

function directionLabel(direction: CrosswordDirection): string {
  return direction === 'across' ? 'Horizontal' : 'Vertical'
}

export function CrosswordHintTooltip({
  hint,
  number,
  direction,
  left,
  top,
  maxWidth,
  placement,
  arrowLeft,
}: CrosswordHintTooltipProps) {
  return (
    <View
      style={[
        styles.tooltip,
        {
          left,
          top,
          maxWidth,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Dica ${number}: ${hint}`}
      pointerEvents="none"
    >
      <Text style={styles.label}>
        {number}. {directionLabel(direction)}
      </Text>
      <Text style={styles.hint}>{hint}</Text>
      <View
        style={[
          styles.arrow,
          { left: arrowLeft },
          placement === 'below' ? styles.arrowBelow : styles.arrowAbove,
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    zIndex: 20,
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 14, 20, 0.97)',
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  label: {
    color: '#f9a8d4',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  hint: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  arrow: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: 'rgba(14, 14, 20, 0.97)',
    borderColor: 'rgba(244, 114, 182, 0.45)',
    transform: [{ rotate: '45deg' }],
  },
  arrowBelow: {
    top: -5,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  arrowAbove: {
    bottom: -5,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
})

const TOOLTIP_ESTIMATED_HEIGHT = 68

export function getCrosswordHintTooltipLayout({
  row,
  col,
  rows,
  cellSize,
  cellGap,
  framePadding,
  boardWidth,
  tooltipMaxWidth = 216,
}: {
  row: number
  col: number
  rows: number
  cellSize: number
  cellGap: number
  framePadding: number
  boardWidth: number
  tooltipMaxWidth?: number
}): {
  left: number
  top: number
  maxWidth: number
  placement: 'above' | 'below'
  arrowLeft: number
} {
  const cellLeft = framePadding + col * (cellSize + cellGap)
  const cellTop = framePadding + row * (cellSize + cellGap)
  const cellCenterX = cellLeft + cellSize / 2
  const cellBottom = cellTop + cellSize

  const maxWidth = Math.min(tooltipMaxWidth, boardWidth - 12)
  const left = Math.max(6, Math.min(cellCenterX - maxWidth / 2, boardWidth - maxWidth - 6))
  const placement: 'above' | 'below' = row >= rows - 1 ? 'above' : 'below'
  const top =
    placement === 'below'
      ? cellBottom + 8
      : Math.max(4, cellTop - TOOLTIP_ESTIMATED_HEIGHT - 8)
  const arrowLeft = Math.max(12, Math.min(cellCenterX - left - 5, maxWidth - 22))

  return { left, top, maxWidth, placement, arrowLeft }
}
