import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'

export type PreparationInfoRow = {
  id: string
  label: string
  value: string
  icon: keyof typeof Ionicons.glyphMap
  loading?: boolean
  singleLine?: boolean
}

export type PreparationInfoRowGroup = PreparationInfoRow | [PreparationInfoRow, PreparationInfoRow]

type RunWalkPreparationInfoGridProps = {
  rows: PreparationInfoRowGroup[]
}

function PreparationInfoCell({ row }: { row: PreparationInfoRow }) {
  return (
    <>
      <View style={styles.iconWrap}>
        <Ionicons name={row.icon} size={14} color="#ff8533" />
      </View>
      <Text style={styles.label}>{row.label}</Text>
      <Text
        style={[styles.value, row.singleLine && styles.valueSingleLine]}
        numberOfLines={row.singleLine ? 1 : 2}
        ellipsizeMode={row.singleLine ? 'tail' : undefined}
      >
        {row.loading ? 'Carregando...' : row.value}
      </Text>
    </>
  )
}

export function RunWalkPreparationInfoGrid({ rows }: RunWalkPreparationInfoGridProps) {
  const lastRowIndex = rows.length - 1

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Informações principais</Text>
      <View style={styles.card}>
        {rows.map((group, rowIndex) => {
          const pair = Array.isArray(group) ? group : [group]
          const isFullWidth = pair.length === 1

          return (
            <View
              key={`row-${pair[0].id}`}
              style={[styles.row, rowIndex < lastRowIndex && styles.rowDivider]}
            >
              {pair.map((row, colIndex) => (
                <View
                  key={row.id}
                  style={[
                    styles.cell,
                    isFullWidth && styles.cellFullWidth,
                    !isFullWidth && colIndex === 0 && styles.cellDivider,
                  ]}
                >
                  <PreparationInfoCell row={row} />
                </View>
              ))}
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
    width: '100%',
  },
  card: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  cell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 4,
    alignItems: 'center',
    minWidth: 0,
  },
  cellFullWidth: {
    flex: 1,
    width: '100%',
  },
  cellDivider: {
    borderRightWidth: 1,
    borderRightColor: colors.surfaceBorder,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
  },
  label: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    textAlign: 'center',
    width: '100%',
  },
  value: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    textAlign: 'center',
    width: '100%',
  },
  valueSingleLine: {
    fontSize: 12,
    lineHeight: 16,
  },
})
