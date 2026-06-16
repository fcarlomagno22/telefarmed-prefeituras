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

type RunWalkPreparationInfoGridProps = {
  rowPairs: PreparationInfoRow[][]
}

function PreparationInfoCell({ row }: { row: PreparationInfoRow }) {
  return (
    <View style={styles.cell}>
      <View style={styles.iconWrap}>
        <Ionicons name={row.icon} size={14} color="#fdba74" />
      </View>
      <Text style={styles.label}>{row.label}</Text>
      <Text
        style={[styles.value, row.singleLine && styles.valueSingleLine]}
        numberOfLines={row.singleLine ? 1 : 2}
        ellipsizeMode={row.singleLine ? 'tail' : undefined}
      >
        {row.loading ? 'Carregando...' : row.value}
      </Text>
    </View>
  )
}

export function RunWalkPreparationInfoGrid({ rowPairs }: RunWalkPreparationInfoGridProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Informações principais</Text>
      <View style={styles.grid}>
        {rowPairs.map((pair, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {pair.map((row) => (
              <PreparationInfoCell key={row.id} row={row} />
            ))}
          </View>
        ))}
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
  grid: {
    gap: 8,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  cell: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
    alignItems: 'center',
    minWidth: 0,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 133, 51, 0.15)',
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
