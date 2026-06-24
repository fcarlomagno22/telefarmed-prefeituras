import { useCallback, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ActionToast } from '../ActionToast'
import { AppModal } from '../AppModal'
import { useAuth } from '../../contexts/AuthContext'
import { useGuestAuth } from '../../contexts/GuestAuthContext'
import { useMyRoutineTodayPlan } from '../../hooks/useMyRoutineTodayPlan'
import type { MyRoutineOnboardingRecord, MyRoutineTask } from '../../types/myRoutine'
import { PrimaryButton } from '../PrimaryButton'
import { MyRoutineDayClosureDrawer } from './MyRoutineDayClosureDrawer'
import { MyRoutineDayDisruptionDrawer } from './MyRoutineDayDisruptionDrawer'
import { MyRoutineDayMapDrawer } from './MyRoutineDayMapDrawer'
import { MyRoutineEditTaskDrawer } from './MyRoutineEditTaskDrawer'
import { MyRoutineFab } from './MyRoutineFab'
import { MyRoutineFabPopover } from './MyRoutineFabPopover'
import { MyRoutineMinimalRoutineExplainDrawer } from './MyRoutineMinimalRoutineExplainDrawer'
import { MyRoutineQuickTaskDrawer } from './MyRoutineQuickTaskDrawer'
import { MyRoutineReminderDrawer } from './MyRoutineReminderDrawer'
import { MyRoutineSkipDrawer } from './MyRoutineSkipDrawer'
import { MyRoutineSnoozeDrawer } from './MyRoutineSnoozeDrawer'
import { MyRoutineTaskDetailDrawer } from './MyRoutineTaskDetailDrawer'
import { MyRoutineTodayTab } from './MyRoutineTodayTab'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

type DrawerKey =
  | 'dayMap'
  | 'minimalExplain'
  | 'taskDetail'
  | 'snooze'
  | 'skip'
  | 'quickTask'
  | 'reminder'
  | 'disruption'
  | 'dayClosure'
  | 'editTask'

type MyRoutineTodayShellProps = {
  bottomPadding: number
  patientCpf: string
  record: MyRoutineOnboardingRecord
  refreshKey?: number
}

export function MyRoutineTodayShell({
  bottomPadding,
  patientCpf,
  record,
  refreshKey = 0,
}: MyRoutineTodayShellProps) {
  const styles = useThemedStyles(createStyles)
  const { navigateTo } = useAuth()
  const { requireAuth } = useGuestAuth()
  const guardRoutine = (action: () => void) => {
    requireAuth('vida:my-routine', action)
  }
  const fabBottom = Math.max(bottomPadding - 72, 88)

  const {
    dayPlan,
    dayPhase,
    dayClosure,
    essentialSkipCount,
    isLoading,
    markTaskDone,
    snoozeTask,
    skipTask,
    simplifyDay,
    addQuickTask,
    addReminderTask,
    saveEditedTask,
    saveDayClosure,
  } = useMyRoutineTodayPlan({ patientCpf, record, refreshKey })

  const [activeDrawer, setActiveDrawer] = useState<DrawerKey | null>(null)
  const [selectedTask, setSelectedTask] = useState<MyRoutineTask | null>(null)
  const [fabPopoverVisible, setFabPopoverVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [weeklyReviewPromptVisible, setWeeklyReviewPromptVisible] = useState(false)
  const [weeklyReviewPromptDismissed, setWeeklyReviewPromptDismissed] = useState(false)

  const openTask = useCallback((task: MyRoutineTask) => {
    guardRoutine(() => {
      setSelectedTask(task)
      setActiveDrawer('taskDetail')
    })
  }, [])

  const closeDrawers = useCallback(() => {
    setActiveDrawer(null)
  }, [])

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
  }, [])

  const maybePromptWeeklyReview = useCallback(
    (nextCount: number) => {
      if (nextCount >= 3 && !weeklyReviewPromptDismissed) {
        setWeeklyReviewPromptVisible(true)
      }
    },
    [weeklyReviewPromptDismissed],
  )

  const handleMarkDone = useCallback(
    async (taskId: string) => {
      guardRoutine(() => {
        void (async () => {
          await markTaskDone(taskId)
          closeDrawers()
          showToast('Tarefa concluída!')
        })()
      })
    },
    [closeDrawers, markTaskDone, showToast],
  )

  const handleSkipConfirm = useCallback(
    async (reason?: string) => {
      if (!selectedTask) return
      const wasEssential = selectedTask.priority === 'essential'
      await skipTask(selectedTask.id, reason)
      closeDrawers()
      showToast('Tudo bem pular — amanhã recomeçamos.')
      if (wasEssential) {
        maybePromptWeeklyReview(essentialSkipCount + 1)
      }
    },
    [closeDrawers, essentialSkipCount, maybePromptWeeklyReview, selectedTask, showToast, skipTask],
  )

  const handleSnoozeConfirm = useCallback(
    async (minutes: number) => {
      if (!selectedTask) return
      await snoozeTask(selectedTask.id, minutes)
      closeDrawers()
      showToast(`Adiado por ${minutes} min`)
    },
    [closeDrawers, selectedTask, showToast, snoozeTask],
  )

  const drawerVisible = useMemo(
    () => ({
      dayMap: activeDrawer === 'dayMap',
      minimalExplain: activeDrawer === 'minimalExplain',
      taskDetail: activeDrawer === 'taskDetail',
      snooze: activeDrawer === 'snooze',
      skip: activeDrawer === 'skip',
      quickTask: activeDrawer === 'quickTask',
      reminder: activeDrawer === 'reminder',
      disruption: activeDrawer === 'disruption',
      dayClosure: activeDrawer === 'dayClosure',
      editTask: activeDrawer === 'editTask',
    }),
    [activeDrawer],
  )

  return (
    <View style={styles.root}>
      <MyRoutineTodayTab
        bottomPadding={bottomPadding}
        isLoading={isLoading}
        dayPlan={dayPlan}
        dayPhase={dayPhase}
        hasDayClosure={dayClosure != null}
        onOpenDayMap={() => guardRoutine(() => setActiveDrawer('dayMap'))}
        onOpenMinimalExplain={() => guardRoutine(() => setActiveDrawer('minimalExplain'))}
        onOpenTaskDetail={openTask}
        onMarkDone={(taskId) => void handleMarkDone(taskId)}
        onSnoozeTask={(task) => {
          guardRoutine(() => {
            setSelectedTask(task)
            setActiveDrawer('snooze')
          })
        }}
        onSkipTask={(task) => {
          guardRoutine(() => {
            setSelectedTask(task)
            setActiveDrawer('skip')
          })
        }}
        onOpenDayClosure={() => guardRoutine(() => setActiveDrawer('dayClosure'))}
        onNavigateModule={(route) => navigateTo(route)}
      />

      <MyRoutineFab bottom={fabBottom} onPress={() => guardRoutine(() => setFabPopoverVisible(true))} />

      <MyRoutineFabPopover
        visible={fabPopoverVisible}
        fabBottom={fabBottom}
        onClose={() => setFabPopoverVisible(false)}
        onAction={(action) => {
          guardRoutine(() => {
            if (action === 'quick-task') setActiveDrawer('quickTask')
            if (action === 'reminder') setActiveDrawer('reminder')
            if (action === 'disruption') setActiveDrawer('disruption')
          })
        }}
      />

      <MyRoutineDayMapDrawer
        visible={drawerVisible.dayMap}
        dayPlan={dayPlan}
        onClose={closeDrawers}
        onTaskPress={(task) => openTask(task)}
      />

      <MyRoutineMinimalRoutineExplainDrawer
        visible={drawerVisible.minimalExplain}
        onClose={closeDrawers}
      />

      <MyRoutineTaskDetailDrawer
        visible={drawerVisible.taskDetail}
        task={selectedTask}
        onClose={closeDrawers}
        onDone={() => selectedTask && void handleMarkDone(selectedTask.id)}
        onSnooze={() => setActiveDrawer('snooze')}
        onSkip={() => setActiveDrawer('skip')}
        onEdit={() => setActiveDrawer('editTask')}
      />

      <MyRoutineSnoozeDrawer
        visible={drawerVisible.snooze}
        taskTitle={selectedTask?.title}
        onClose={() => setActiveDrawer(selectedTask ? 'taskDetail' : null)}
        onConfirm={(minutes) => void handleSnoozeConfirm(minutes)}
      />

      <MyRoutineSkipDrawer
        visible={drawerVisible.skip}
        taskTitle={selectedTask?.title}
        onClose={() => setActiveDrawer(selectedTask ? 'taskDetail' : null)}
        onConfirm={(reason) => void handleSkipConfirm(reason)}
      />

      <MyRoutineQuickTaskDrawer
        visible={drawerVisible.quickTask}
        onClose={closeDrawers}
        onConfirm={(title, block) => {
          void addQuickTask(title, block).then(() => showToast('Tarefa adicionada ao dia'))
        }}
      />

      <MyRoutineReminderDrawer
        visible={drawerVisible.reminder}
        onClose={closeDrawers}
        onConfirm={(title, time) => {
          void addReminderTask(title, time).then(() => showToast('Lembrete criado'))
        }}
      />

      <MyRoutineDayDisruptionDrawer
        visible={drawerVisible.disruption}
        onClose={closeDrawers}
        onConfirm={() => {
          void simplifyDay().then(() => showToast('Dia simplificado — só essenciais'))
        }}
      />

      <MyRoutineDayClosureDrawer
        visible={drawerVisible.dayClosure}
        onClose={closeDrawers}
        onConfirm={(payload) => {
          void saveDayClosure(payload).then(() => showToast('Dia encerrado. Até amanhã!'))
        }}
      />

      <MyRoutineEditTaskDrawer
        visible={drawerVisible.editTask}
        task={selectedTask}
        onClose={() => setActiveDrawer('taskDetail')}
        onConfirm={(patch) => {
          if (!selectedTask) return
          void saveEditedTask(selectedTask.id, patch).then(() => showToast('Tarefa atualizada'))
        }}
      />

      <ActionToast
        message={toastMessage}
        onHidden={() => setToastMessage(null)}
        bottomOffset={fabBottom + 64}
      />

      <AppModal
        visible={weeklyReviewPromptVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWeeklyReviewPromptVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Quer simplificar a rotina?</Text>
            <Text style={styles.modalBody}>
              Você pulou 3 essenciais hoje. Na aba Semana, a revisão de 5 minutos ajuda a ajustar o
              plano para ficar mais realista.
            </Text>
            <PrimaryButton
              label="Entendi"
              onPress={() => {
                setWeeklyReviewPromptVisible(false)
                setWeeklyReviewPromptDismissed(true)
              }}
              style={styles.modalBtn}
            />
            <Pressable
              onPress={() => {
                setWeeklyReviewPromptVisible(false)
                setWeeklyReviewPromptDismissed(true)
                navigateTo('my-routine')
              }}
              style={styles.modalLinkWrap}
            >
              <Text style={styles.modalLink}>Ir para Semana depois</Text>
            </Pressable>
          </View>
        </View>
      </AppModal>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  root: { flex: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 18,
    padding: 18,
    gap: 12,
    backgroundColor: 'rgba(22, 16, 28, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.22)',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  modalBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  modalBtn: { marginTop: 4 },
  modalLinkWrap: { alignSelf: 'center', paddingVertical: 8 },
  modalLink: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
}
}

