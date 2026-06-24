import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { MyRoutineDayPlan, MyRoutineTask } from '../../types/myRoutine'
import {
  formatPriorityLabel,
  formatTaskScheduleLabel,
  reorderTasks,
  syncMinimalIdsForDay,
  toggleTaskPriority,
} from '../../utils/myRoutineWeekStats'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import { useTheme } from '../../contexts/ThemeContext'

const ACCENT_LIGHT = '#f0abfc'

type MyRoutineDayPlanDrawerProps = {
  visible: boolean
  dayPlan: MyRoutineDayPlan | null
  weekdayLabel?: string
  onClose: () => void
  onSave: (dayPlan: MyRoutineDayPlan) => void
}

export function MyRoutineDayPlanDrawer({
  visible,
  dayPlan,
  weekdayLabel,
  onClose,
  onSave,
}: MyRoutineDayPlanDrawerProps) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const [draft, setDraft] = useState<MyRoutineDayPlan | null>(null)

  useEffect(() => {
    if (visible && dayPlan) setDraft(dayPlan)
    if (!visible) setDraft(null)
  }, [dayPlan, visible])

  if (!draft) return null

  function moveTask(index: number, direction: -1 | 1) {
    setDraft((current) => {
      if (!current) return current
      const nextTasks = reorderTasks(current.tasks, index, index + direction)
      return syncMinimalIdsForDay({ ...current, tasks: nextTasks })
    })
  }

  function handleTogglePriority(task: MyRoutineTask) {
    setDraft((current) => {
      if (!current) return current
      const tasks = current.tasks.map((item) =>
        item.id === task.id ? toggleTaskPriority(item) : item,
      )
      return syncMinimalIdsForDay({ ...current, tasks })
    })
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={weekdayLabel ? `Plano · ${weekdayLabel}` : 'Plano do dia'}
      subtitle={draft.dateIso}
      onClose={onClose}
      footer={
        <PrimaryButton
          label="Salvar dia"
          onPress={() => {
            onSave(draft)
            onClose()
          }}
          style={styles.footerBtn}
        />
      }
    >
      <View style={styles.content}>
        {draft.tasks.length === 0 ? (
          <Text style={styles.empty}>Nenhuma tarefa neste dia.</Text>
        ) : (
          draft.tasks.map((task, index) => (
            <View key={task.id} style={styles.taskRow}>
              <View style={styles.taskCopy}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskMeta}>
                  {formatPriorityLabel(task.priority)} · {formatTaskScheduleLabel(task)}
                </Text>
              </View>
              <View style={styles.actions}>
                <Pressable
                  disabled={index === 0}
                  onPress={() => moveTask(index, -1)}
                  style={[styles.iconBtn, index === 0 && styles.iconBtnDisabled]}
                >
                  <Ionicons name="chevron-up" size={16} color={colors.text} />
                </Pressable>
                <Pressable
                  disabled={index === draft.tasks.length - 1}
                  onPress={() => moveTask(index, 1)}
                  style={[
                    styles.iconBtn,
                    index === draft.tasks.length - 1 && styles.iconBtnDisabled,
                  ]}
                >
                  <Ionicons name="chevron-down" size={16} color={colors.text} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    void Haptics.selectionAsync()
                    handleTogglePriority(task)
                  }}
                  style={styles.priorityBtn}
                >
                  <Text style={styles.priorityBtnText}>Prioridade</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>
    </RunWalkSheetDrawer>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  content: { gap: 8 },
  empty: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  taskRow: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  taskCopy: { gap: 2 },
  taskTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  taskMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  iconBtnDisabled: { opacity: 0.35 },
  priorityBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(217, 70, 239, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.25)',
  },
  priorityBtnText: {
    color: ACCENT_LIGHT,
    fontSize: 11,
    fontWeight: '800',
  },
  footerBtn: { marginTop: 0 },
}
}

