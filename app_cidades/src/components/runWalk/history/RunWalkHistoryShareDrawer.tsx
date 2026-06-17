import * as Haptics from 'expo-haptics'
import { Share, StyleSheet, Text, View } from 'react-native'
import type { RunWalkActivitySummary } from '../../../data/runWalkActivitySummaryStorage'
import { colors } from '../../../theme/colors'
import { formatActivityShareTitle } from '../../../utils/runWalkActivityLocation'
import { formatActivityDateLabel } from '../../../utils/runWalkHistoryStats'
import {
  formatCaloriesBurned,
  formatElapsedActivityTime,
  formatPaceMinPerKm,
} from '../../../utils/runWalkActivityStats'
import { PrimaryButton } from '../../PrimaryButton'
import { RunWalkSheetDrawer } from '../RunWalkSheetDrawer'

type RunWalkHistoryShareDrawerProps = {
  visible: boolean
  activity: RunWalkActivitySummary | null
  onClose: () => void
}

export function RunWalkHistoryShareDrawer({
  visible,
  activity,
  onClose,
}: RunWalkHistoryShareDrawerProps) {
  if (!activity) return null

  const shareTitle = formatActivityShareTitle(activity.locationCity, activity.locationState)

  const shareMessage = [
    shareTitle,
    `${activity.distanceKm.toFixed(1).replace('.', ',')} km em ${formatElapsedActivityTime(activity.elapsedSeconds)}`,
    `Ritmo ${formatPaceMinPerKm(activity.paceMinPerKm)} · ${formatCaloriesBurned(activity.estimatedCalories)}`,
    `Telefarmed · Corrida e Caminhada`,
  ].join('\n')

  async function handleShare() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    await Share.share({ message: shareMessage })
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Compartilhar treino"
      subtitle="Resumo pronto para enviar"
      onClose={onClose}
      scrollable={false}
      extraBottomInset={24}
      footer={<PrimaryButton label="Compartilhar" onPress={() => void handleShare()} />}
    >
      <View style={styles.card}>
        <Text style={styles.kicker}>Treino concluído</Text>
        <Text style={styles.title}>{shareTitle}</Text>
        <Text style={styles.date}>{formatActivityDateLabel(activity.completedAt)}</Text>

        <View style={styles.metrics}>
          <Metric label="Distância" value={`${activity.distanceKm.toFixed(1).replace('.', ',')} km`} />
          <Metric label="Tempo" value={formatElapsedActivityTime(activity.elapsedSeconds)} />
          <Metric label="Ritmo" value={formatPaceMinPerKm(activity.paceMinPerKm)} />
          <Metric label="Calorias" value={formatCaloriesBurned(activity.estimatedCalories)} />
        </View>
      </View>
    </RunWalkSheetDrawer>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.28)',
  },
  kicker: {
    color: '#6ee7b7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  metric: {
    width: '47%',
    gap: 2,
  },
  metricLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
})
