import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { SleepLogEntry } from '../../../types/sleepLog'
import {
  formatSleepDuration,
  formatSleepLogShortDateLabel,
  formatSleepTimeMinutes,
  getSleepQualityLabel,
} from '../../../utils/sleepLogFormat'

type SleepTimeHistoryEntryListProps = {
  entries: SleepLogEntry[]
  title?: string
  emptyMessage?: string
}

export function SleepTimeHistoryEntryList({
  entries,
  title = 'Registros',
  emptyMessage = 'Nenhum registro para este dia.',
}: SleepTimeHistoryEntryListProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {entries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        entries.map((entry) => (
          <View key={entry.id} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryDate}>{formatSleepLogShortDateLabel(entry.wakeDateIso)}</Text>
              <Text style={styles.entryDuration}>{formatSleepDuration(entry.durationMinutes)}</Text>
            </View>

            <Text style={styles.entryTimes}>
              Deitou às {formatSleepTimeMinutes(entry.bedTimeMinutes)} · Acordou às{' '}
              {formatSleepTimeMinutes(entry.wakeTimeMinutes)}
            </Text>

            <View style={styles.entryMetaRow}>
              <View style={styles.metaPill}>
                <MaterialCommunityIcons name="star-outline" size={14} color="#a5b4fc" />
                <Text style={styles.metaPillText}>{getSleepQualityLabel(entry.quality)}</Text>
              </View>

              <View style={styles.metaPill}>
                <MaterialCommunityIcons name="eye-outline" size={14} color="#a5b4fc" />
                <Text style={styles.metaPillText}>
                  {entry.wakeCount === 0
                    ? 'Sem despertares'
                    : `${entry.wakeCount} despertar${entry.wakeCount > 1 ? 'es' : ''}`}
                </Text>
              </View>
            </View>

            {entry.notes ? <Text style={styles.entryNotes}>{entry.notes}</Text> : null}
          </View>
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyCard: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  entryCard: {
    borderRadius: 18,
    padding: 16,
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  entryDate: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  entryDuration: {
    color: '#a5b4fc',
    fontSize: 14,
    fontWeight: '800',
  },
  entryTimes: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  entryMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  metaPillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  entryNotes: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
})
