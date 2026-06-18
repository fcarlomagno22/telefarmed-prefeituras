import { StyleSheet, Text, View } from 'react-native'
import type { MentalHealthCheckInEntry } from '../../types/mentalHealth'
import { colors } from '../../theme/colors'
import {
  formatMentalHealthCheckInTime,
  formatMentalHealthEmotions,
  formatMentalHealthMoodDisplay,
} from '../../utils/mentalHealthCheckIn'
import { toLocalDateIso } from '../../utils/runWalkWeeklyChart'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type MentalHealthRecentCheckInsDrawerProps = {
  visible: boolean
  entries: MentalHealthCheckInEntry[]
  onClose: () => void
}

function formatEntryDate(iso: string) {
  const today = toLocalDateIso(new Date())
  const entryDate = toLocalDateIso(new Date(iso))

  if (entryDate === today) return 'Hoje'

  const formatted = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso))

  return formatted.replace('.', '')
}

export function MentalHealthRecentCheckInsDrawer({
  visible,
  entries,
  onClose,
}: MentalHealthRecentCheckInsDrawerProps) {
  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Registros recentes"
      subtitle="Seus últimos check-ins emocionais"
      onClose={onClose}
    >
      {entries.length === 0 ? (
        <Text style={styles.empty}>Você ainda não possui registros recentes.</Text>
      ) : (
        entries.slice(0, 8).map((entry) => (
          <View key={entry.id} style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemDate}>{formatEntryDate(entry.recordedAt)}</Text>
              <Text style={styles.itemTime}>{formatMentalHealthCheckInTime(entry.recordedAt)}</Text>
            </View>
            <Text style={styles.itemMood}>{formatMentalHealthMoodDisplay(entry.mood)}</Text>
            <Text style={styles.itemMeta}>
              {formatMentalHealthEmotions(entry.emotions)}
              {entry.mainInfluence ? ` · ${entry.mainInfluence}` : ''}
            </Text>
          </View>
        ))
      )}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  item: {
    gap: 4,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemDate: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  itemTime: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  itemMood: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  itemMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
})
