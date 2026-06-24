import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import {
  completeMyRoutineOnboarding,
  loadMyRoutineOnboardingRecord,
  saveMyRoutineOnboardingRecord,
} from '../../data/myRoutineOnboardingStorage'
import { saveMyRoutineWeekPlan } from '../../data/myRoutinePlanStorage'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'
import {
  emptyMyRoutineOnboardingRecord,
  MY_ROUTINE_CURRENT_ACTIVITY_OPTIONS,
  MY_ROUTINE_DEFAULT_SLEEP_TIME,
  MY_ROUTINE_DEFAULT_WAKE_TIME,
  MY_ROUTINE_IDEAL_ACTIVITY_OPTIONS,
  MY_ROUTINE_LIFE_CONTEXT_OPTIONS,
  MY_ROUTINE_ONBOARDING_STEPS,
  MY_ROUTINE_TIME_BLOCK_OPTIONS,
  MY_ROUTINE_WEEKEND_MODE_OPTIONS,
  type MyRoutineLifeContextId,
  type MyRoutineOnboardingRecord,
  type MyRoutineRoutineBlockEntry,
  type MyRoutineTaskPriority,
  type MyRoutineTemplateId,
  type MyRoutineTimeBlock,
  type MyRoutineWeekendMode,
} from '../../types/myRoutine'
import {
  adjustSleepTimeMinutes,
  formatSleepTimeMinutes,
} from '../../utils/sleepLogFormat'
import {
  generateWeekPlanFromOnboarding,
  getTodayPlan,
} from '../../utils/myRoutinePlanEngine'
import { MY_ROUTINE_TEMPLATES } from '../../utils/myRoutineTemplates'
import { toLocalDateIso } from '../../utils/runWalkWeeklyChart'
import { LottiePlayer } from '../LottiePlayer'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { MyRoutineHowItWorksDrawer } from './MyRoutineHowItWorksDrawer'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import type { ThemeColors } from '../../theme/palettes'
import { useTheme } from '../../contexts/ThemeContext'

const welcomeAnimation = require('../../../assets/avatar.json')

const ACCENT = '#d946ef'
const ACCENT_LIGHT = '#f0abfc'
const ACCENT_BG = 'rgba(217, 70, 239, 0.12)'
const ACCENT_BORDER = 'rgba(240, 171, 252, 0.35)'

type IdealTierTarget = 'weekday' | 'weekend'

type MyRoutineOnboardingDrawerProps = {
  visible: boolean
  patientCpf: string
  onFlowComplete: (record: MyRoutineOnboardingRecord) => void
  onRequestBack: () => void
}

function parseTimeStringToMinutes(value: string | null, fallbackMinutes: number): number {
  if (!value?.trim()) return fallbackMinutes
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim())
  if (!match) return fallbackMinutes
  return Number(match[1]) * 60 + Number(match[2])
}

function getBlockEntry(
  blocks: MyRoutineRoutineBlockEntry[],
  block: MyRoutineTimeBlock,
): MyRoutineRoutineBlockEntry {
  return (
    blocks.find((entry) => entry.block === block) ?? {
      block,
      activityIds: [],
      notes: '',
    }
  )
}

function upsertBlockEntry(
  blocks: MyRoutineRoutineBlockEntry[],
  nextEntry: MyRoutineRoutineBlockEntry,
): MyRoutineRoutineBlockEntry[] {
  const without = blocks.filter((entry) => entry.block !== nextEntry.block)
  const hasContent = nextEntry.activityIds.length > 0 || (nextEntry.notes?.trim()?.length ?? 0) > 0
  if (!hasContent) return without
  return [...without, nextEntry]
}

type TimeStepperProps = {
  label: string
  valueMinutes: number
  onChange: (minutes: number) => void
}

function TimeStepper({ label, valueMinutes, onChange }: TimeStepperProps) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  function adjust(deltaMinutes: number) {
    void Haptics.selectionAsync()
    onChange(adjustSleepTimeMinutes(valueMinutes, deltaMinutes))
  }

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.timeRow}>
        <Pressable
          onPress={() => adjust(-15)}
          style={({ pressed }) => [styles.stepperButton, pressed && styles.stepperPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Diminuir ${label}`}
        >
          <Ionicons name="remove" size={20} color={colors.text} />
        </Pressable>

        <View style={styles.timeValueCard}>
          <Text style={styles.timeValue}>{formatSleepTimeMinutes(valueMinutes)}</Text>
        </View>

        <Pressable
          onPress={() => adjust(15)}
          style={({ pressed }) => [styles.stepperButton, pressed && styles.stepperPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${label}`}
        >
          <Ionicons name="add" size={20} color={colors.text} />
        </Pressable>
      </View>
    </View>
  )
}

export function MyRoutineOnboardingDrawer({
  visible,
  patientCpf,
  onFlowComplete,
  onRequestBack,
}: MyRoutineOnboardingDrawerProps) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const [step, setStep] = useState(1)
  const [record, setRecord] = useState<MyRoutineOnboardingRecord>(emptyMyRoutineOnboardingRecord())
  const [howItWorksVisible, setHowItWorksVisible] = useState(false)
  const [idealTierTarget, setIdealTierTarget] = useState<IdealTierTarget>('weekday')
  const [stepError, setStepError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const currentStepMeta = MY_ROUTINE_ONBOARDING_STEPS[step - 1] ?? MY_ROUTINE_ONBOARDING_STEPS[0]

  const wakeMinutes = parseTimeStringToMinutes(
    record.wakeTime,
    parseTimeStringToMinutes(MY_ROUTINE_DEFAULT_WAKE_TIME, 7 * 60),
  )
  const sleepMinutes = parseTimeStringToMinutes(
    record.sleepTime,
    parseTimeStringToMinutes(MY_ROUTINE_DEFAULT_SLEEP_TIME, 22 * 60 + 30),
  )

  const previewPlan = useMemo(
    () =>
      generateWeekPlanFromOnboarding({
        ...record,
        wakeTime: record.wakeTime ?? MY_ROUTINE_DEFAULT_WAKE_TIME,
        sleepTime: record.sleepTime ?? MY_ROUTINE_DEFAULT_SLEEP_TIME,
        selectedTemplateId: record.selectedTemplateId ?? 'day-busy',
      }),
    [record],
  )

  const todayPreview = useMemo(
    () => getTodayPlan(previewPlan, toLocalDateIso(new Date())),
    [previewPlan],
  )

  const templateCards = useMemo(
    () => Object.values(MY_ROUTINE_TEMPLATES),
    [],
  )

  useEffect(() => {
    if (!visible) return

    void loadMyRoutineOnboardingRecord(patientCpf).then((stored) => {
      if (!stored.completed) {
        setRecord({
          ...stored,
          wakeTime: stored.wakeTime ?? MY_ROUTINE_DEFAULT_WAKE_TIME,
          sleepTime: stored.sleepTime ?? MY_ROUTINE_DEFAULT_SLEEP_TIME,
        })
      }
    })
  }, [patientCpf, visible])

  useEffect(() => {
    if (!visible) {
      setStep(1)
      setStepError(null)
      setHowItWorksVisible(false)
      setIdealTierTarget('weekday')
    }
  }, [visible])

  const persistRecord = useCallback(
    async (next: MyRoutineOnboardingRecord) => {
      setRecord(next)
      await saveMyRoutineOnboardingRecord(patientCpf, next)
    },
    [patientCpf],
  )

  const handleBack = useCallback(() => {
    if (howItWorksVisible) {
      setHowItWorksVisible(false)
      return
    }

    if (step > 1) {
      setStep((current) => current - 1)
      setStepError(null)
      return
    }

    onRequestBack()
  }, [howItWorksVisible, onRequestBack, step])

  useAndroidBackHandler(
    useCallback(() => {
      if (!visible) return false
      handleBack()
      return true
    }, [handleBack, visible]),
  )

  function toggleLifeContext(id: MyRoutineLifeContextId) {
    setRecord((current) => {
      const selected = current.lifeContext
      const next = selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id]
      return { ...current, lifeContext: next }
    })
    setStepError(null)
  }

  function toggleBlockActivity(block: MyRoutineTimeBlock, activityId: string) {
    setRecord((current) => {
      const entry = getBlockEntry(current.currentRoutineBlocks, block)
      const isSelected = entry.activityIds.includes(activityId)
      const activityIds = isSelected
        ? entry.activityIds.filter((id) => id !== activityId)
        : [...entry.activityIds, activityId]

      return {
        ...current,
        currentRoutineBlocks: upsertBlockEntry(current.currentRoutineBlocks, {
          ...entry,
          activityIds,
        }),
      }
    })
    setStepError(null)
  }

  function setBlockNotes(block: MyRoutineTimeBlock, notes: string) {
    setRecord((current) => {
      const entry = getBlockEntry(current.currentRoutineBlocks, block)
      return {
        ...current,
        currentRoutineBlocks: upsertBlockEntry(current.currentRoutineBlocks, {
          ...entry,
          notes,
        }),
      }
    })
  }

  function toggleIdealChip(tier: MyRoutineTaskPriority, label: string) {
    setRecord((current) => {
      const tierKey = idealTierTarget === 'weekday' ? 'weekday' : 'weekend'
      const tierData = current.idealRoutine[tierKey]
      const selected = tierData[tier]
      const nextLabels = selected.includes(label)
        ? selected.filter((item) => item !== label)
        : [...selected, label]

      return {
        ...current,
        idealRoutine: {
          ...current.idealRoutine,
          [tierKey]: {
            ...tierData,
            [tier]: nextLabels,
          },
        },
      }
    })
    setStepError(null)
  }

  function selectTemplate(id: MyRoutineTemplateId) {
    setRecord((current) => ({ ...current, selectedTemplateId: id }))
    setStepError(null)
  }

  function selectWeekendMode(id: MyRoutineWeekendMode) {
    setRecord((current) => ({ ...current, weekendMode: id }))
  }

  function validateStep(currentStep: number): string | null {
    if (currentStep === 2) {
      if (record.lifeContext.length === 0) {
        return 'Selecione ao menos um contexto da sua vida hoje.'
      }
    }

    if (currentStep === 3) {
      const hasActivity = record.currentRoutineBlocks.some(
        (entry) => entry.activityIds.length > 0,
      )
      const hasNotes = record.obstructionNotes.trim().length > 0
      if (!hasActivity && !hasNotes) {
        return 'Marque o que você já faz ou conte o que atrapalha sua rotina.'
      }
    }

    if (currentStep === 4) {
      const weekdayEssentials = record.idealRoutine.weekday.essential.length
      const weekendEssentials = record.idealRoutine.weekend.essential.length
      if (weekdayEssentials === 0 && weekendEssentials === 0) {
        return 'Escolha ao menos um hábito essencial (semana ou fim de semana).'
      }
    }

    if (currentStep === 5) {
      if (!record.selectedTemplateId) {
        return 'Escolha um template para começar.'
      }
    }

    return null
  }

  async function handleContinueFromStep(currentStep: number) {
    const error = validateStep(currentStep)
    if (error) {
      setStepError(error)
      return
    }

    setStepError(null)

    const nextRecord: MyRoutineOnboardingRecord = {
      ...record,
      wakeTime: formatSleepTimeMinutes(wakeMinutes),
      sleepTime: formatSleepTimeMinutes(sleepMinutes),
    }

    if (currentStep >= MY_ROUTINE_ONBOARDING_STEPS.length) {
      await handleFinish(nextRecord)
      return
    }

    await persistRecord(nextRecord)
    setStep(currentStep + 1)
  }

  async function handleFinish(finalRecord: MyRoutineOnboardingRecord) {
    setIsSaving(true)

    try {
      const completedRecord: MyRoutineOnboardingRecord = {
        ...finalRecord,
        completed: true,
        completedAt: new Date().toISOString(),
      }

      const weekPlan = generateWeekPlanFromOnboarding(completedRecord)
      await saveMyRoutineWeekPlan(patientCpf, weekPlan)
      await completeMyRoutineOnboarding(patientCpf, completedRecord)

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onFlowComplete(completedRecord)
    } finally {
      setIsSaving(false)
    }
  }

  const footer = (() => {
    if (step === 1) {
      return (
        <View style={styles.footerCol}>
          <PrimaryButton
            label="Montar minha rotina"
            onPress={() => void handleContinueFromStep(1)}
            style={styles.footerPrimaryButton}
          />
          <Pressable
            onPress={() => setHowItWorksVisible(true)}
            hitSlop={8}
            style={({ pressed }) => [styles.footerTextLinkWrap, pressed && styles.footerTextLinkPressed]}
          >
            <Text style={styles.footerTextLink}>Como funciona</Text>
          </Pressable>
        </View>
      )
    }

    if (step === MY_ROUTINE_ONBOARDING_STEPS.length) {
      return (
        <View style={styles.footerCol}>
          <PrimaryButton
            label="Começar minha rotina"
            onPress={() => void handleContinueFromStep(step)}
            loading={isSaving}
            style={styles.footerPrimaryButton}
          />
        </View>
      )
    }

    return (
      <View style={styles.footerCol}>
        <PrimaryButton
          label="Continuar"
          onPress={() => void handleContinueFromStep(step)}
          loading={isSaving}
          style={styles.footerPrimaryButton}
        />
      </View>
    )
  })()

  function renderIdealTierChips(tier: MyRoutineTaskPriority, title: string) {
    const tierKey = idealTierTarget === 'weekday' ? 'weekday' : 'weekend'
    const selected = record.idealRoutine[tierKey][tier]
    const options = MY_ROUTINE_IDEAL_ACTIVITY_OPTIONS.filter((option) => option.tier === tier)

    return (
      <View style={styles.idealTierBlock}>
        <Text style={styles.idealTierTitle}>{title}</Text>
        <View style={styles.chipsWrap}>
          {options.map((option) => {
            const isSelected = selected.includes(option.label)

            return (
              <Pressable
                key={option.id}
                onPress={() => toggleIdealChip(tier, option.label)}
                style={({ pressed }) => [
                  styles.chip,
                  isSelected && styles.chipSelected,
                  pressed && styles.chipPressed,
                ]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    )
  }

  return (
    <>
      <RunWalkSheetDrawer
        visible={visible}
        title={currentStepMeta.title}
        subtitle={currentStepMeta.subtitle}
        onClose={handleBack}
        fullScreen
        hideCloseButton
        footer={footer}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel={step > 1 ? 'Voltar para etapa anterior' : 'Sair do módulo'}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>

          <View style={styles.progressRow}>
            {MY_ROUTINE_ONBOARDING_STEPS.map((item) => (
              <View
                key={item.id}
                style={[styles.progressDot, item.id <= step && styles.progressDotActive]}
              />
            ))}
          </View>

          <View style={styles.backBtnPlaceholder} />
        </View>

        {stepError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{stepError}</Text>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.stepContent}>
            <LottiePlayer
              source={welcomeAnimation}
              animationStyle={styles.welcomeLottie}
              style={styles.welcomeLottieWrap}
            />

            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>Minha Rotina</Text>
              <View style={styles.heroTitleBlock}>
                <Text style={styles.heroTitleLine}>Organize seu dia</Text>
                <Text style={styles.heroTitleAccent}>sem pressão</Text>
              </View>
            </View>

            <Text style={styles.heroBody}>
              Em poucos passos montamos uma rotina mínima saudável — com o essencial em destaque e
              espaço para simplificar quando a vida apertar.
            </Text>

            <View style={styles.disclaimerCard}>
              <Ionicons name="sparkles-outline" size={18} color={ACCENT_LIGHT} />
              <Text style={styles.disclaimerText}>
                Você pode ajustar tudo depois. O objetivo agora é ter um ponto de partida realista.
              </Text>
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.stepContent}>
            <Text style={styles.questionTitle}>Como é sua vida hoje?</Text>
            <Text style={styles.questionHint}>Selecione tudo que se aplica</Text>

            <View style={styles.chipsWrap}>
              {MY_ROUTINE_LIFE_CONTEXT_OPTIONS.map((option) => {
                const selected = record.lifeContext.includes(option.id)

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => toggleLifeContext(option.id)}
                    style={({ pressed }) => [
                      styles.chip,
                      selected && styles.chipSelected,
                      pressed && styles.chipPressed,
                    ]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            <Text style={[styles.questionTitle, styles.questionSpacing]}>
              Quando você costuma acordar e dormir?
            </Text>

            <TimeStepper
              label="Acordar"
              valueMinutes={wakeMinutes}
              onChange={(minutes) =>
                setRecord((current) => ({
                  ...current,
                  wakeTime: formatSleepTimeMinutes(minutes),
                }))
              }
            />

            <TimeStepper
              label="Dormir"
              valueMinutes={sleepMinutes}
              onChange={(minutes) =>
                setRecord((current) => ({
                  ...current,
                  sleepTime: formatSleepTimeMinutes(minutes),
                }))
              }
            />
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.stepContent}>
            <Text style={styles.questionTitle}>Como é sua rotina hoje?</Text>
            <Text style={styles.questionHint}>
              Marque o que você já faz em cada parte do dia
            </Text>

            {MY_ROUTINE_TIME_BLOCK_OPTIONS.map((blockOption) => {
              const entry = getBlockEntry(record.currentRoutineBlocks, blockOption.id)
              const blockActivities = MY_ROUTINE_CURRENT_ACTIVITY_OPTIONS.filter(
                (option) => option.block === blockOption.id,
              )

              return (
                <View key={blockOption.id} style={styles.blockSection}>
                  <Text style={styles.blockTitle}>{blockOption.label}</Text>
                  <View style={styles.chipsWrap}>
                    {blockActivities.map((activity) => {
                      const selected = entry.activityIds.includes(activity.id)

                      return (
                        <Pressable
                          key={activity.id}
                          onPress={() => toggleBlockActivity(blockOption.id, activity.id)}
                          style={({ pressed }) => [
                            styles.chip,
                            selected && styles.chipSelected,
                            pressed && styles.chipPressed,
                          ]}
                        >
                          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                            {activity.label}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                </View>
              )
            })}

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>O que mais atrapalha sua rotina? (opcional)</Text>
              <TextInput
                value={record.obstructionNotes}
                onChangeText={(text) =>
                  setRecord((current) => ({ ...current, obstructionNotes: text }))
                }
                placeholder="Ex.: reuniões imprevistas, cansaço, falta de tempo..."
                placeholderTextColor={colors.textSubtle}
                multiline
                textAlignVertical="top"
                style={styles.notesInput}
                selectionColor={ACCENT}
              />
            </View>
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.stepContent}>
            <Text style={styles.questionTitle}>Como você gostaria que fosse?</Text>
            <Text style={styles.questionHint}>
              Essencial = não abro mão · Desejável = quero cultivar · Bônus = se sobrar tempo
            </Text>

            <View style={styles.segmentToggleRow}>
              {(['weekday', 'weekend'] as IdealTierTarget[]).map((target) => {
                const selected = idealTierTarget === target

                return (
                  <Pressable
                    key={target}
                    onPress={() => setIdealTierTarget(target)}
                    style={({ pressed }) => [
                      styles.segmentToggle,
                      selected && styles.segmentToggleSelected,
                      pressed && styles.chipPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentToggleText,
                        selected && styles.segmentToggleTextSelected,
                      ]}
                    >
                      {target === 'weekday' ? 'Semana' : 'Fim de semana'}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            {renderIdealTierChips('essential', 'Essencial')}
            {renderIdealTierChips('desirable', 'Desejável')}
            {renderIdealTierChips('bonus', 'Bônus')}

            <Text style={[styles.questionTitle, styles.questionSpacing]}>
              Fins de semana
            </Text>
            <View style={styles.optionsCol}>
              {MY_ROUTINE_WEEKEND_MODE_OPTIONS.map((option) => {
                const selected = record.weekendMode === option.id

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => selectWeekendMode(option.id)}
                    style={({ pressed }) => [
                      styles.optionRow,
                      selected && styles.optionRowSelected,
                      pressed && styles.optionRowPressed,
                    ]}
                  >
                    <View style={styles.optionCopy}>
                      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                        {option.label}
                      </Text>
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={18} color={ACCENT_LIGHT} />
                    ) : null}
                  </Pressable>
                )
              })}
            </View>
          </View>
        ) : null}

        {step === 5 ? (
          <View style={styles.stepContent}>
            <Text style={styles.questionTitle}>Escolha um ponto de partida</Text>
            <Text style={styles.questionHint}>
              Você pode personalizar tudo depois — o template só acelera o início
            </Text>

            <View style={styles.templateCol}>
              {templateCards.map((template) => {
                const selected = record.selectedTemplateId === template.id

                return (
                  <Pressable
                    key={template.id}
                    onPress={() => selectTemplate(template.id)}
                    style={({ pressed }) => [
                      styles.templateCard,
                      selected && styles.templateCardSelected,
                      pressed && styles.optionRowPressed,
                    ]}
                  >
                    <LinearGradient
                      colors={
                        selected
                          ? ['rgba(240, 171, 252, 0.18)', 'rgba(217, 70, 239, 0.08)']
                          : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']
                      }
                      style={styles.templateCardInner}
                    >
                      <View style={styles.templateHeader}>
                        <Text
                          style={[styles.templateTitle, selected && styles.templateTitleSelected]}
                        >
                          {template.label}
                        </Text>
                        {selected ? (
                          <Ionicons name="checkmark-circle" size={20} color={ACCENT_LIGHT} />
                        ) : null}
                      </View>
                      <Text style={styles.templateDescription}>{template.description}</Text>
                      <Text style={styles.templateMeta}>
                        {template.baseTasks.length} tarefas base ·{' '}
                        {template.baseTasks.filter((task) => task.priority === 'essential').length}{' '}
                        essenciais
                      </Text>
                    </LinearGradient>
                  </Pressable>
                )
              })}
            </View>
          </View>
        ) : null}

        {step === 6 ? (
          <View style={styles.stepContent}>
            <Text style={styles.questionTitle}>Seu plano da semana</Text>
            <Text style={styles.questionHint}>
              Prévia gerada com base no que você contou — ajustável a qualquer momento
            </Text>

            <View style={styles.previewCard}>
              <Text style={styles.previewEyebrow}>Template</Text>
              <Text style={styles.previewTitle}>
                {MY_ROUTINE_TEMPLATES[record.selectedTemplateId ?? 'day-busy'].label}
              </Text>
              <Text style={styles.previewMeta}>
                {Object.keys(previewPlan.days).length} dias ·{' '}
                {todayPreview.minimalRoutineTaskIds.length} essenciais hoje
              </Text>
            </View>

            <View style={styles.previewCard}>
              <Text style={styles.previewEyebrow}>Hoje</Text>
              {todayPreview.tasks.length === 0 ? (
                <Text style={styles.previewEmpty}>Nenhuma tarefa para hoje.</Text>
              ) : (
                todayPreview.tasks.slice(0, 6).map((task) => (
                  <View key={task.id} style={styles.previewTaskRow}>
                    <View
                      style={[
                        styles.previewPriorityDot,
                        task.priority === 'essential' && styles.previewPriorityEssential,
                        task.priority === 'desirable' && styles.previewPriorityDesirable,
                        task.priority === 'bonus' && styles.previewPriorityBonus,
                      ]}
                    />
                    <View style={styles.previewTaskCopy}>
                      <Text style={styles.previewTaskTitle}>{task.title}</Text>
                      <Text style={styles.previewTaskMeta}>
                        {task.scheduleType === 'fixed' && task.time
                          ? `Horário fixo · ${task.time}`
                          : task.scheduleType === 'window'
                            ? `Janela · ${task.windowStart ?? '—'} – ${task.windowEnd ?? '—'}`
                            : task.triggerLabel ?? 'Gatilho'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
              {todayPreview.tasks.length > 6 ? (
                <Text style={styles.previewMore}>
                  +{todayPreview.tasks.length - 6} tarefas no plano de hoje
                </Text>
              ) : null}
            </View>

            <View style={styles.disclaimerCard}>
              <Ionicons name="information-circle-outline" size={18} color={ACCENT_LIGHT} />
              <Text style={styles.disclaimerText}>
                Na aba Hoje você vê a próxima tarefa e pode pular, adiar ou simplificar o dia sem
                culpa.
              </Text>
            </View>
          </View>
        ) : null}
      </RunWalkSheetDrawer>

      <MyRoutineHowItWorksDrawer
        visible={howItWorksVisible}
        onClose={() => setHowItWorksVisible(false)}
      />
    </>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  backBtnPressed: {
    opacity: 0.85,
  },
  backBtnPlaceholder: {
    width: 36,
    height: 36,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  progressDot: {
    width: 22,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  progressDotActive: {
    backgroundColor: ACCENT,
  },
  stepContent: {
    gap: 12,
    paddingBottom: 8,
  },
  welcomeLottieWrap: {
    marginBottom: 0,
  },
  welcomeLottie: {
    width: 200,
    height: 160,
  },
  heroCopy: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  heroEyebrow: {
    color: ACCENT_LIGHT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitleBlock: {
    alignItems: 'center',
    gap: 0,
  },
  heroTitleLine: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 36,
    textAlign: 'center',
  },
  heroTitleAccent: {
    color: ACCENT_LIGHT,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 34,
    textAlign: 'center',
  },
  heroBody: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
    textAlign: 'center',
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: ACCENT_BG,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
  },
  disclaimerText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  questionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  questionHint: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
    marginTop: -6,
  },
  questionSpacing: {
    marginTop: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipSelected: {
    backgroundColor: ACCENT_BG,
    borderColor: ACCENT_BORDER,
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: ACCENT_LIGHT,
    fontWeight: '700',
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stepperPressed: {
    opacity: 0.88,
  },
  timeValueCard: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timeValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  blockSection: {
    gap: 8,
  },
  blockTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  notesInput: {
    minHeight: 88,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  segmentToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentToggle: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentToggleSelected: {
    backgroundColor: ACCENT_BG,
    borderColor: ACCENT_BORDER,
  },
  segmentToggleText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  segmentToggleTextSelected: {
    color: ACCENT_LIGHT,
  },
  idealTierBlock: {
    gap: 8,
  },
  idealTierTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  optionsCol: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionRowSelected: {
    backgroundColor: ACCENT_BG,
    borderColor: ACCENT_BORDER,
  },
  optionRowPressed: {
    opacity: 0.88,
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  optionLabelSelected: {
    color: ACCENT_LIGHT,
  },
  optionDescription: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  templateCol: {
    gap: 10,
  },
  templateCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  templateCardSelected: {
    borderColor: ACCENT_BORDER,
  },
  templateCardInner: {
    padding: 16,
    gap: 6,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  templateTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  templateTitleSelected: {
    color: ACCENT_LIGHT,
  },
  templateDescription: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  templateMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  previewCard: {
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  previewEyebrow: {
    color: ACCENT_LIGHT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  previewTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  previewMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  previewEmpty: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  previewTaskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  previewPriorityDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 6,
    backgroundColor: colors.textSubtle,
  },
  previewPriorityEssential: {
    backgroundColor: ACCENT,
  },
  previewPriorityDesirable: {
    backgroundColor: '#a78bfa',
  },
  previewPriorityBonus: {
    backgroundColor: colors.textSubtle,
  },
  previewTaskCopy: {
    flex: 1,
    gap: 2,
  },
  previewTaskTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  previewTaskMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  previewMore: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.errorBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.25)',
    marginBottom: 8,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  footerCol: {
    width: '100%',
    gap: 4,
    alignItems: 'stretch',
  },
  footerPrimaryButton: {
    width: '100%',
    alignSelf: 'stretch',
    marginTop: 0,
  },
  footerTextLinkWrap: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  footerTextLinkPressed: {
    opacity: 0.72,
  },
  footerTextLink: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
}
}

