import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { saveTdahTodSession } from '../../data/tdahTodInfantilStorage'
import { runTdahTodEngine } from '../../tdahTodInfantil/engine'
import {
  buildTdahTodFlowQuestions,
  getTdahTodConsentDisclaimer,
  getTdahTodConsentItems,
  getTdahTodDataCollectionNotice,
  getTdahTodInformantOptions,
  getTdahTodStepLabel,
  TDAH_TOD_FLOW_STEPS,
} from '../../tdahTodInfantil/flowBuilder'
import type {
  TdahTodAnswers,
  TdahTodConsentItem,
  TdahTodEngineResult,
  TdahTodFlowStepId,
  TdahTodInformantTypeId,
} from '../../tdahTodInfantil/types'
import { colors } from '../../theme/colors'
import { keyboardAvoidingBehavior } from '../../utils/keyboardLayout'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { TdahTodConsentTermDrawer } from './TdahTodConsentTermDrawer'
import { TdahTodInfantilResultView } from './TdahTodInfantilResultView'

type TdahTodInfantilFlowProps = {
  visible: boolean
  patientCpf: string
  onClose: () => void
  onCompleted: () => void
}

function createSessionId() {
  return `tdah_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function ConsentRow({
  item,
  accepted,
  onPress,
}: {
  item: TdahTodConsentItem
  accepted: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.consentRow, pressed && styles.consentRowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.label}. ${accepted ? 'Aceito' : 'Toque para ler o termo'}`}
    >
      <Ionicons
        name={accepted ? 'checkmark-circle' : 'ellipse-outline'}
        size={20}
        color={accepted ? '#a78bfa' : colors.textSubtle}
      />
      <View style={styles.consentRowBody}>
        <Text style={styles.consentRowLabel}>{item.label}</Text>
        <Text style={styles.consentRowHint}>
          {accepted ? 'Aceito · toque para reler' : 'Toque para ler e aceitar'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
    </Pressable>
  )
}

export function TdahTodInfantilFlow({
  visible,
  patientCpf,
  onClose,
  onCompleted,
}: TdahTodInfantilFlowProps) {
  const insets = useSafeAreaInsets()
  const consentItems = useMemo(() => getTdahTodConsentItems(), [])
  const consentDisclaimer = useMemo(() => getTdahTodConsentDisclaimer(), [])
  const dataCollectionNotice = useMemo(() => getTdahTodDataCollectionNotice(), [])
  const informantOptions = useMemo(() => getTdahTodInformantOptions(), [])

  const [stepIndex, setStepIndex] = useState(0)
  const [acceptedConsents, setAcceptedConsents] = useState<Record<string, boolean>>({})
  const [activeConsentItem, setActiveConsentItem] = useState<TdahTodConsentItem | null>(null)
  const [dataNoticeVisible, setDataNoticeVisible] = useState(false)
  const [childName, setChildName] = useState('')
  const [childAgeYears, setChildAgeYears] = useState('')
  const [informantTypeId, setInformantTypeId] = useState<TdahTodInformantTypeId | null>(null)
  const [answers, setAnswers] = useState<TdahTodAnswers>({})
  const [questionIndex, setQuestionIndex] = useState(0)
  const [result, setResult] = useState<TdahTodEngineResult | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const progressAnimated = useRef(new Animated.Value(0)).current
  const isAdvancingRef = useRef(false)

  const requiredConsentItems = useMemo(
    () => consentItems.filter((item) => item.required),
    [consentItems],
  )
  const optionalConsentItems = useMemo(
    () => consentItems.filter((item) => !item.required),
    [consentItems],
  )

  const currentStep = TDAH_TOD_FLOW_STEPS[stepIndex] ?? 'consent'
  const parsedAge = Number(childAgeYears.replace(/\D/g, ''))
  const flowQuestions = useMemo(
    () => (parsedAge > 0 ? buildTdahTodFlowQuestions(parsedAge, 'responsavel') : []),
    [parsedAge],
  )

  const questionsForStep = useMemo(
    () => flowQuestions.filter((item) => item.step === currentStep),
    [flowQuestions, currentStep],
  )

  const currentQuestion = questionsForStep[questionIndex]
  const isQuestionStep = ['snap_iv', 'functional', 'red_flags', 'differential'].includes(currentStep)

  const stepProgress = useMemo(() => {
    if (currentStep === 'consent') {
      const accepted = requiredConsentItems.filter((item) => acceptedConsents[item.id]).length
      return requiredConsentItems.length > 0 ? accepted / requiredConsentItems.length : 1
    }
    if (isQuestionStep) {
      return questionsForStep.length > 0 ? (questionIndex + 1) / questionsForStep.length : 1
    }
    return 1
  }, [acceptedConsents, currentStep, isQuestionStep, questionIndex, questionsForStep.length, requiredConsentItems])

  const reset = useCallback(() => {
    setStepIndex(0)
    setAcceptedConsents({})
    setActiveConsentItem(null)
    setDataNoticeVisible(false)
    setChildName('')
    setChildAgeYears('')
    setInformantTypeId(null)
    setAnswers({})
    setQuestionIndex(0)
    setResult(null)
    setIsSaving(false)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [onClose, reset])

  const goNextStep = useCallback(() => {
    setQuestionIndex(0)
    setStepIndex((current) => Math.min(current + 1, TDAH_TOD_FLOW_STEPS.length))
  }, [])

  const finalize = useCallback(
    async (nextAnswers: TdahTodAnswers) => {
      if (!informantTypeId || !parsedAge) return
      const engineResult = runTdahTodEngine(nextAnswers, {
        childAgeYears: parsedAge,
        childName: childName.trim() || undefined,
        informantTypeId,
        respondentId: 'responsavel',
      })
      setResult(engineResult)
      setIsSaving(true)
      try {
        await saveTdahTodSession(patientCpf, {
          id: createSessionId(),
          childName: childName.trim() || undefined,
          childAgeYears: parsedAge,
          informantTypeId,
          completedAt: new Date().toISOString(),
          answers: nextAnswers,
          consentsAccepted: Object.keys(acceptedConsents).filter((key) => acceptedConsents[key]),
          result: engineResult,
        })
        onCompleted()
      } finally {
        setIsSaving(false)
      }
    },
    [acceptedConsents, childName, informantTypeId, onCompleted, parsedAge, patientCpf],
  )

  const handleContinue = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    if (currentStep === 'consent') {
      goNextStep()
      return
    }

    if (currentStep === 'profile') {
      if (!parsedAge || parsedAge < 1 || parsedAge > 17) return
      goNextStep()
      return
    }

    if (currentStep === 'informant') {
      if (!informantTypeId) return
      goNextStep()
      return
    }

    if (isQuestionStep) {
      if (!currentQuestion) return
      if (questionIndex < questionsForStep.length - 1) {
        setQuestionIndex((current) => current + 1)
        return
      }
      if (stepIndex < TDAH_TOD_FLOW_STEPS.length - 1) {
        goNextStep()
        return
      }
      void finalize(answers)
    }
  }, [
    answers,
    currentQuestion,
    currentStep,
    finalize,
    goNextStep,
    informantTypeId,
    isQuestionStep,
    parsedAge,
    questionIndex,
    questionsForStep.length,
    stepIndex,
  ])

  const handleBack = useCallback(() => {
    if (result) {
      handleClose()
      return
    }
    if (isQuestionStep && questionIndex > 0) {
      setQuestionIndex((current) => current - 1)
      return
    }
    if (stepIndex > 0) {
      setStepIndex((current) => current - 1)
      setQuestionIndex(0)
      return
    }
    handleClose()
  }, [handleClose, isQuestionStep, questionIndex, result, stepIndex])

  const commitAnswer = useCallback(
    (value: number | string, autoAdvance = true) => {
      if (!currentQuestion || isAdvancingRef.current) return
      const next = { ...answers, [currentQuestion.id]: value }
      setAnswers(next)
      if (!autoAdvance) return
      isAdvancingRef.current = true
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setTimeout(() => {
        if (questionIndex < questionsForStep.length - 1) {
          setQuestionIndex((current) => current + 1)
          isAdvancingRef.current = false
          return
        }
        if (stepIndex < TDAH_TOD_FLOW_STEPS.length - 1) {
          goNextStep()
          isAdvancingRef.current = false
          return
        }
        void finalize(next)
        isAdvancingRef.current = false
      }, 220)
    },
    [answers, currentQuestion, finalize, goNextStep, questionIndex, questionsForStep.length, stepIndex],
  )

  const canContinue = useMemo(() => {
    if (currentStep === 'consent') {
      return requiredConsentItems.every((item) => acceptedConsents[item.id])
    }
    if (currentStep === 'profile') {
      return parsedAge >= 4 && parsedAge <= 17
    }
    if (currentStep === 'informant') {
      return informantTypeId != null
    }
    if (isQuestionStep && currentQuestion) {
      return answers[currentQuestion.id] !== undefined
    }
    return false
  }, [
    acceptedConsents,
    answers,
    currentQuestion,
    currentStep,
    informantTypeId,
    isQuestionStep,
    parsedAge,
    requiredConsentItems,
  ])

  const shouldShowContinueButton = useMemo(() => {
    if (isQuestionStep) return false
    return currentStep === 'consent' || currentStep === 'profile'
  }, [currentStep, isQuestionStep])

  const handleInformantSelect = useCallback(
    (id: TdahTodInformantTypeId) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setInformantTypeId(id)
      setTimeout(() => goNextStep(), 220)
    },
    [goNextStep],
  )

  useEffect(() => {
    Animated.timing(progressAnimated, {
      toValue: stepProgress,
      duration: 420,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start()
  }, [progressAnimated, stepProgress])

  if (!visible) return null

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleBack}>
      <View style={[styles.root, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Voltar">
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Atenção e comportamento</Text>
            <Text style={styles.headerSubtitle}>
              {result ? 'Resultado' : getTdahTodStepLabel(currentStep)}
            </Text>
          </View>
        </View>

        {!result ? (
          <KeyboardAvoidingView style={styles.body} behavior={keyboardAvoidingBehavior}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnimated.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              {currentStep === 'consent' ? (
                <View style={styles.section}>
                  <Text style={styles.lead}>{consentDisclaimer}</Text>

                  <Text style={styles.consentGroupLabel}>Obrigatório</Text>
                  <View style={styles.consentList}>
                    {requiredConsentItems.map((item, index) => (
                      <View key={item.id}>
                        <ConsentRow
                          item={item}
                          accepted={Boolean(acceptedConsents[item.id])}
                          onPress={() => setActiveConsentItem(item)}
                        />
                        {index < requiredConsentItems.length - 1 ? (
                          <View style={styles.consentDivider} />
                        ) : null}
                      </View>
                    ))}
                  </View>

                  {optionalConsentItems.length > 0 ? (
                    <>
                      <Text style={styles.consentGroupLabel}>Opcional</Text>
                      <View style={styles.consentList}>
                        {optionalConsentItems.map((item, index) => (
                          <View key={item.id}>
                            <ConsentRow
                              item={item}
                              accepted={Boolean(acceptedConsents[item.id])}
                              onPress={() => setActiveConsentItem(item)}
                            />
                            {index < optionalConsentItems.length - 1 ? (
                              <View style={styles.consentDivider} />
                            ) : null}
                          </View>
                        ))}
                      </View>
                    </>
                  ) : null}

                  <Pressable
                    onPress={() => setDataNoticeVisible(true)}
                    style={({ pressed }) => [styles.dataNoticeLink, pressed && styles.consentRowPressed]}
                  >
                    <Ionicons name="document-text-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.dataNoticeLinkText}>{dataCollectionNotice.title}</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.textSubtle} />
                  </Pressable>
                </View>
              ) : null}

              {currentStep === 'profile' ? (
                <View style={styles.section}>
                  <Text style={styles.lead}>Informe a idade da criança ou adolescente (4 a 17 anos).</Text>
                  <Text style={styles.fieldLabel}>Nome (opcional)</Text>
                  <TextInput
                    value={childName}
                    onChangeText={setChildName}
                    placeholder="Ex.: Ana"
                    placeholderTextColor={colors.textSubtle}
                    style={styles.input}
                  />
                  <Text style={styles.fieldLabel}>Idade em anos completos</Text>
                  <TextInput
                    value={childAgeYears}
                    onChangeText={setChildAgeYears}
                    keyboardType="number-pad"
                    placeholder="Ex.: 9"
                    placeholderTextColor={colors.textSubtle}
                    style={styles.input}
                  />
                  {parsedAge > 0 && (parsedAge < 4 || parsedAge > 17) ? (
                    <Text style={styles.warning}>
                      Este módulo é para crianças e adolescentes de 4 a 17 anos.
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {currentStep === 'informant' ? (
                <View style={styles.section}>
                  <Text style={styles.lead}>Quem está respondendo por ela agora?</Text>
                  {informantOptions.map((option) => {
                    const selected = informantTypeId === option.id
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => handleInformantSelect(option.id as TdahTodInformantTypeId)}
                        style={[styles.choiceBtn, selected && styles.choiceSelected]}
                      >
                        <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              ) : null}

              {isQuestionStep && currentQuestion ? (
                <View style={styles.section}>
                  {currentQuestion.preamble ? (
                    <Text style={styles.preamble}>{currentQuestion.preamble}</Text>
                  ) : null}
                  <Text style={styles.question}>{currentQuestion.text}</Text>
                  <View style={styles.optionsList}>
                    {currentQuestion.options.map((option) => {
                      const selected = answers[currentQuestion.id] === option.value
                      return (
                        <Pressable
                          key={String(option.value)}
                          onPress={() => commitAnswer(option.value)}
                          style={[styles.choiceBtn, selected && styles.choiceSelected]}
                        >
                          <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                            {option.label}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                </View>
              ) : null}
            </ScrollView>

            {shouldShowContinueButton ? (
              <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <PrimaryButton
                  label="Continuar"
                  onPress={handleContinue}
                  disabled={!canContinue || isSaving}
                />
              </View>
            ) : null}
          </KeyboardAvoidingView>
        ) : (
          <TdahTodInfantilResultView
            result={result}
            bottomPadding={Math.max(insets.bottom, 16) + 80}
            onClose={handleClose}
          />
        )}
      </View>

      <TdahTodConsentTermDrawer
        visible={activeConsentItem != null}
        item={activeConsentItem}
        accepted={activeConsentItem ? Boolean(acceptedConsents[activeConsentItem.id]) : false}
        onClose={() => setActiveConsentItem(null)}
        onAcceptChange={(next) => {
          if (!activeConsentItem) return
          setAcceptedConsents((current) => ({
            ...current,
            [activeConsentItem.id]: next,
          }))
        }}
      />

      <RunWalkSheetDrawer
        visible={dataNoticeVisible}
        title={dataCollectionNotice.title}
        onClose={() => setDataNoticeVisible(false)}
        footer={<PrimaryButton label="Entendi" onPress={() => setDataNoticeVisible(false)} />}
      >
        <Text style={styles.dataNoticeText}>{dataCollectionNotice.plainText}</Text>
      </RunWalkSheetDrawer>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    flex: 1,
  },
  progressTrack: {
    height: 6,
    marginHorizontal: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#8b5cf6',
  },
  scroll: {
    padding: 16,
    paddingBottom: 24,
  },
  section: {
    gap: 12,
  },
  lead: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  fieldLabel: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  warning: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
  },
  consentGroupLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 4,
  },
  consentList: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  consentRowPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  consentRowBody: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  consentRowLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  consentRowHint: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  consentDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: 46,
  },
  dataNoticeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  dataNoticeLinkText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  dataNoticeText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    paddingBottom: 8,
  },
  preamble: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  question: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
  },
  optionsList: {
    gap: 10,
  },
  choiceBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  choiceSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.22)',
    borderColor: 'rgba(196, 181, 253, 0.55)',
  },
  choiceText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  choiceTextSelected: {
    color: colors.text,
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
})
