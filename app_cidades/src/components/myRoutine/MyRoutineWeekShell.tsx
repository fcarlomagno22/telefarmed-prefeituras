import { useCallback, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ActionToast } from '../ActionToast'
import { AppModal } from '../AppModal'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'
import { useGuestAuth } from '../../contexts/GuestAuthContext'
import { useMyRoutineWeekPlan } from '../../hooks/useMyRoutineWeekPlan'
import type {
  MyRoutineDayPlan,
  MyRoutineOnboardingRecord,
  MyRoutineTask,
  MyRoutineTemplateId,
  MyRoutineWeeklyReview,
  MyRoutineWeekDayPreview,
} from '../../types/myRoutine'
import { PrimaryButton } from '../PrimaryButton'
import { MyRoutineDayPlanDrawer } from './MyRoutineDayPlanDrawer'
import { MyRoutineRecurringHabitDrawer } from './MyRoutineRecurringHabitDrawer'
import { MyRoutineTemplatePickerDrawer } from './MyRoutineTemplatePickerDrawer'
import { MyRoutineWeekPickerDrawer } from './MyRoutineWeekPickerDrawer'
import { MyRoutineWeekTab } from './MyRoutineWeekTab'
import { MyRoutineWeekendModeDrawer } from './MyRoutineWeekendModeDrawer'
import { MyRoutineWeeklyReviewDrawer } from './MyRoutineWeeklyReviewDrawer'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

type DrawerKey =
  | 'weekPicker'
  | 'dayPlan'
  | 'recurring'
  | 'weeklyReview'
  | 'weekendMode'
  | 'template'

type MyRoutineWeekShellProps = {
  bottomPadding: number
  patientCpf: string
  record: MyRoutineOnboardingRecord
  refreshKey?: number
}

export function MyRoutineWeekShell({
  bottomPadding,
  patientCpf,
  record,
  refreshKey = 0,
}: MyRoutineWeekShellProps) {
  const styles = useThemedStyles(createStyles)
  const { requireAuth } = useGuestAuth()
  const guardRoutine = (action: () => void) => {
    requireAuth('vida:my-routine', action)
  }
  const {
    weekStartIso,
    weekPlan,
    summary,
    dayPreviews,
    weekLabel,
    onboardingRecord,
    weeklyReview,
    isLoading,
    navigateWeek,
    selectWeek,
    saveDayPlan,
    addRecurringHabit,
    updateRecurringHabit,
    setWeekendMode,
    applyTemplate,
    previewTemplateChange,
    previewReviewApplication,
    submitWeeklyReview,
    applyWeeklyReview,
  } = useMyRoutineWeekPlan({ patientCpf, record, refreshKey })

  const [activeDrawer, setActiveDrawer] = useState<DrawerKey | null>(null)
  const [selectedDay, setSelectedDay] = useState<MyRoutineWeekDayPreview | null>(null)
  const [editingRecurring, setEditingRecurring] = useState<MyRoutineTask | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [pendingReview, setPendingReview] = useState<MyRoutineWeeklyReview | null>(null)
  const [reviewConfirmVisible, setReviewConfirmVisible] = useState(false)

  const reviewPreview = useMemo(
    () =>
      pendingReview
        ? previewReviewApplication(pendingReview)
        : { beforeTasks: 0, afterTasks: 0, beforeEssentials: 0, afterEssentials: 0 },
    [pendingReview, previewReviewApplication],
  )

  const closeDrawers = useCallback(() => {
    setActiveDrawer(null)
    setSelectedDay(null)
    setEditingRecurring(null)
  }, [])

  const anyDrawerOpen =
    activeDrawer != null || reviewConfirmVisible || pendingReview != null

  useAndroidBackHandler(
    useCallback(() => {
      if (reviewConfirmVisible) {
        setReviewConfirmVisible(false)
        setPendingReview(null)
        return true
      }
      if (activeDrawer) {
        closeDrawers()
        return true
      }
      return false
    }, [activeDrawer, closeDrawers, reviewConfirmVisible]),
    anyDrawerOpen,
  )

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
  }, [])

  return (
    <View style={styles.root}>
      <MyRoutineWeekTab
        bottomPadding={bottomPadding}
        isLoading={isLoading}
        weekLabel={weekLabel}
        summary={summary}
        dayPreviews={dayPreviews}
        weekendMode={onboardingRecord.weekendMode}
        templateId={weekPlan?.templateId ?? null}
        recurringTemplates={weekPlan?.recurringTemplates ?? []}
        reviewApplied={weeklyReview?.appliedAt != null}
        onPrevWeek={() => navigateWeek(-1)}
        onNextWeek={() => navigateWeek(1)}
        onOpenWeekPicker={() => guardRoutine(() => setActiveDrawer('weekPicker'))}
        onOpenWeeklyReview={() => guardRoutine(() => setActiveDrawer('weeklyReview'))}
        onOpenDayPlan={(preview) => {
          guardRoutine(() => {
            setSelectedDay(preview)
            setActiveDrawer('dayPlan')
          })
        }}
        onOpenRecurringHabit={(task) => {
          guardRoutine(() => {
            setEditingRecurring(task ?? null)
            setActiveDrawer('recurring')
          })
        }}
        onOpenWeekendMode={() => guardRoutine(() => setActiveDrawer('weekendMode'))}
        onOpenTemplatePicker={() => guardRoutine(() => setActiveDrawer('template'))}
      />

      <MyRoutineWeekPickerDrawer
        visible={activeDrawer === 'weekPicker'}
        weekStartIso={weekStartIso}
        onClose={closeDrawers}
        onSelect={(next) => {
          selectWeek(next)
          showToast('Semana atualizada')
        }}
      />

      <MyRoutineDayPlanDrawer
        visible={activeDrawer === 'dayPlan'}
        dayPlan={selectedDay?.dayPlan ?? null}
        weekdayLabel={selectedDay?.weekdayShort}
        onClose={closeDrawers}
        onSave={(plan: MyRoutineDayPlan) => {
          void saveDayPlan(plan).then(() => showToast('Dia salvo'))
        }}
      />

      <MyRoutineRecurringHabitDrawer
        visible={activeDrawer === 'recurring'}
        editingTask={editingRecurring}
        onClose={closeDrawers}
        onSave={(title, priority) => {
          if (editingRecurring) {
            void updateRecurringHabit(editingRecurring.id, { title, priority }).then(() =>
              showToast('Hábito atualizado'),
            )
            return
          }
          void addRecurringHabit(title).then(() => showToast('Hábito adicionado'))
        }}
      />

      <MyRoutineWeeklyReviewDrawer
        visible={activeDrawer === 'weeklyReview'}
        onClose={closeDrawers}
        onComplete={(payload) => {
          void submitWeeklyReview(payload).then((review) => {
            if (!review) return
            setPendingReview(review)
            setReviewConfirmVisible(true)
            closeDrawers()
          })
        }}
      />

      <MyRoutineWeekendModeDrawer
        visible={activeDrawer === 'weekendMode'}
        currentMode={onboardingRecord.weekendMode}
        onClose={closeDrawers}
        onApply={(mode) => {
          void setWeekendMode(mode).then(() => showToast('Modo de fim de semana aplicado'))
        }}
      />

      <MyRoutineTemplatePickerDrawer
        visible={activeDrawer === 'template'}
        currentTemplateId={weekPlan?.templateId ?? onboardingRecord.selectedTemplateId}
        previewTaskCount={(templateId) => previewTemplateChange(templateId)}
        onClose={closeDrawers}
        onApply={(templateId: MyRoutineTemplateId) => {
          void applyTemplate(templateId).then(() => showToast('Template aplicado'))
        }}
      />

      <ActionToast
        message={toastMessage}
        onHidden={() => setToastMessage(null)}
        bottomOffset={bottomPadding}
      />

      <AppModal
        visible={reviewConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setReviewConfirmVisible(false)
          setPendingReview(null)
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Aplicar revisão ao plano?</Text>
            <Text style={styles.modalBody}>
              Prévia: {reviewPreview.beforeTasks} tarefas → {reviewPreview.afterTasks} tarefas
              {'\n'}
              Essenciais: {reviewPreview.beforeEssentials} → {reviewPreview.afterEssentials}
            </Text>
            <PrimaryButton
              label="Aplicar ajustes"
              onPress={() => {
                if (!pendingReview) return
                void applyWeeklyReview(pendingReview).then(() => {
                  showToast('Revisão aplicada ao plano')
                  setReviewConfirmVisible(false)
                  setPendingReview(null)
                })
              }}
              style={styles.modalBtn}
            />
            <Pressable
              onPress={() => {
                setReviewConfirmVisible(false)
                setPendingReview(null)
                showToast('Revisão salva sem alterar o plano')
              }}
              style={styles.modalLinkWrap}
            >
              <Text style={styles.modalLink}>Salvar sem aplicar</Text>
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
    lineHeight: 21,
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

