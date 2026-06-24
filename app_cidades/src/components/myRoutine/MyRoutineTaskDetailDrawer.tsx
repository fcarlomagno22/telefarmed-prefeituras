import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import type { MyRoutineTask } from '../../types/myRoutine'
import {
  formatPriorityLabel,
  formatTaskScheduleLabel,
} from '../../utils/myRoutineTodayHelpers'
import { AppointmentActionButton } from '../appointments/AppointmentActionButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

const PALETTE = ACTION_ICON_PALETTES.myRoutine
const ACCENT_LIGHT = '#f0abfc'

type MyRoutineTaskDetailDrawerProps = {
  visible: boolean
  task: MyRoutineTask | null
  onClose: () => void
  onDone: () => void
  onSnooze: () => void
  onSkip: () => void
  onEdit: () => void
}

export function MyRoutineTaskDetailDrawer({
  visible,
  task,
  onClose,
  onDone,
  onSnooze,
  onSkip,
  onEdit,
}: MyRoutineTaskDetailDrawerProps) {
  const styles = useThemedStyles(createStyles)
  if (!task) return null

  const isDone = task.status === 'done'
  const isSkipped = task.status === 'skipped'

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Detalhe da tarefa"
      subtitle={formatPriorityLabel(task.priority)}
      onClose={onClose}
    >
      <View style={styles.content}>
        <LinearGradient
          colors={['rgba(240, 171, 252, 0.18)', 'rgba(14, 14, 20, 0.98)']}
          style={styles.heroCard}
        >
          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.schedule}>{formatTaskScheduleLabel(task)}</Text>
          {task.skipReason ? (
            <Text style={styles.skipReason}>Motivo do pulo: {task.skipReason}</Text>
          ) : null}
        </LinearGradient>

        {!isDone && !isSkipped ? (
          <View style={styles.actionsRow}>
            <AppointmentActionButton
              label="Feito"
              icon="check"
              palette={PALETTE}
              onPress={onDone}
            />
            <AppointmentActionButton
              label="Adiar"
              icon="clock-outline"
              palette={ACTION_ICON_PALETTES.myGoals}
              onPress={onSnooze}
            />
          </View>
        ) : null}

        {!isDone && !isSkipped ? (
          <View style={styles.actionsRow}>
            <AppointmentActionButton
              label="Pular"
              icon="close"
              palette={ACTION_ICON_PALETTES.myMetrics}
              onPress={onSkip}
            />
            <AppointmentActionButton
              label="Editar"
              icon="pencil-outline"
              palette={ACTION_ICON_PALETTES.eatWell}
              onPress={onEdit}
            />
          </View>
        ) : null}

        {isDone ? (
          <View style={styles.statusBanner}>
            <Ionicons name="checkmark-circle" size={18} color={ACCENT_LIGHT} />
            <Text style={styles.statusText}>Tarefa concluída hoje</Text>
          </View>
        ) : null}

        {isSkipped ? (
          <View style={styles.statusBanner}>
            <Ionicons name="heart-outline" size={18} color={ACCENT_LIGHT} />
            <Text style={styles.statusText}>Pulada sem culpa — amanhã recomeçamos</Text>
          </View>
        ) : null}
      </View>
    </RunWalkSheetDrawer>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  content: { gap: 12 },
  heroCard: {
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.22)',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  schedule: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  skipReason: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(217, 70, 239, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.2)',
  },
  statusText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
}
}

