import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { TodayActivity } from '../../types/runWalk'

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  )
}

function getActivityTypeLabel(type: TodayActivity['type']) {
  if (type === 'walk') return 'Caminhada'
  if (type === 'run') return 'Corrida'
  return 'Corrida e caminhada'
}

type RunWalkActivityDetailContentProps = {
  activity: TodayActivity
}

export function RunWalkActivityDetailContent({ activity }: RunWalkActivityDetailContentProps) {
  return (
    <>
      <View style={styles.section}>
        <DetailRow label="Tipo" value={getActivityTypeLabel(activity.type)} />
        <DetailRow label="Duração" value={`${activity.durationMinutes} minutos`} />
        <DetailRow
          label="Distância estimada"
          value={`${activity.estimatedDistanceKm.toFixed(1)} km`}
        />
        <DetailRow label="Intensidade" value={activity.intensityLabel} />
        <DetailRow label="Objetivo" value={activity.goal} />
        <DetailRow label="Ritmo recomendado" value={activity.recommendedPace} />
        <DetailRow label="Terreno sugerido" value={activity.terrain} />
        <DetailRow
          label="Orientação em áudio"
          value={activity.audioGuidance ? 'Ativada' : 'Desativada'}
        />
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Etapas</Text>
        {activity.structure.map((step, index) => (
          <View key={`${step.label}-${index}`} style={styles.stepRow}>
            <View style={styles.stepIndex}>
              <Text style={styles.stepIndexText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Aquecimento</Text>
        <Text style={styles.blockText}>{activity.warmup}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Desaquecimento</Text>
        <Text style={styles.blockText}>{activity.cooldown}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Cuidados importantes</Text>
        {activity.importantCautions.map((caution) => (
          <View key={caution} style={styles.cautionRow}>
            <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#fca5a5" />
            <Text style={styles.cautionText}>{caution}</Text>
          </View>
        ))}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
    paddingBottom: 4,
  },
  detailRow: {
    gap: 3,
  },
  detailLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  block: {
    gap: 8,
    paddingTop: 4,
  },
  blockTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  blockText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.28)',
  },
  stepIndexText: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    paddingTop: 2,
  },
  cautionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cautionText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
})
