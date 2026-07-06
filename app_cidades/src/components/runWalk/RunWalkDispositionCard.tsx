import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import { colors } from '../../theme/colors'
import type { DispositionState } from '../../types/runWalk'
import { AppointmentActionButton } from '../appointments/AppointmentActionButton'

const PALETTE = ACTION_ICON_PALETTES.mentalHealth

type RunWalkDispositionCardProps = {
  disposition: DispositionState
  onExplainPress: () => void
  onCheckinPress: () => void
}

function getLevelColor(level: DispositionState['level']) {
  if (level === 'good') return '#0891b2'
  if (level === 'moderate') return '#d97706'
  if (level === 'low') return '#ea580c'
  return '#dc2626'
}

export function RunWalkDispositionCard({
  disposition,
  onExplainPress,
  onCheckinPress,
}: RunWalkDispositionCardProps) {
  const accent = getLevelColor(disposition.level)

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="pulse" size={18} color={accent} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>Como você está</Text>
          <Text style={styles.title}>{disposition.message}</Text>
        </View>
      </View>

      <Text style={styles.hint}>
        Consideramos sono, cansaço, atividade recente, hidratação, clima e como você se sente.
      </Text>

      <View style={styles.actionsRow}>
        <AppointmentActionButton
          label="Entender"
          icon="lightbulb-on-outline"
          palette={PALETTE}
          onPress={onExplainPress}
        />
        <AppointmentActionButton
          label="Check-in"
          icon="chat-processing-outline"
          palette={ACTION_ICON_PALETTES.myRoutine}
          onPress={onCheckinPress}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.backgroundElevated,
    shadowColor: '#0891b2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfeff',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 2,
  },
})
