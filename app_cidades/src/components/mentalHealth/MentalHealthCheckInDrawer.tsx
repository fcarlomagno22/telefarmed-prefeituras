import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'
import { colors } from '../../theme/colors'
import {
  getCheckInEmotionsForMood,
  getCheckInInfluencesForMood,
  getCheckInMaxStep,
  isPositiveCheckInMood,
  MENTAL_HEALTH_CHECKIN_MOOD_LABELS,
  MENTAL_HEALTH_CHECKIN_REACTIONS,
  MENTAL_HEALTH_INFLUENCE_VALENCE_OPTIONS,
  MENTAL_HEALTH_MOOD_OPTIONS,
  type MentalHealthCheckInSaveInput,
  type MentalHealthInfluenceValence,
  type MentalHealthMoodLevelId,
} from '../../types/mentalHealth'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { MentalHealthMoodIcon } from './MentalHealthMoodIcon'

const CHECKIN_STEPS = [
  { id: 1, title: 'Humor', subtitle: 'Como você está agora?' },
  { id: 2, title: 'Emoções', subtitle: 'Quais emoções estão mais presentes?' },
  { id: 3, title: 'Influência do dia', subtitle: 'O que mais influenciou como você está?' },
  { id: 4, title: 'Reação', subtitle: 'Como você lidou com isso?' },
] as const

const OPTIONAL_TEXT_LIMIT = 200

type CheckInHintTarget = 'mood' | 'influence' | 'valence'

const EMPTY_HINT_PULSE: Record<CheckInHintTarget, number> = {
  mood: 0,
  influence: 0,
  valence: 0,
}

function AttentionHighlight({
  pulseKey,
  children,
  style,
}: {
  pulseKey: number
  children: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const shakeX = useRef(new Animated.Value(0)).current
  const glow = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (pulseKey === 0) return

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)

    const animation = Animated.parallel([
      Animated.sequence([
        Animated.timing(shakeX, { toValue: 10, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -10, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 8, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -8, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 45, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 220, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0.35, duration: 220, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 1, duration: 220, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 280, useNativeDriver: false }),
      ]),
    ])

    animation.start()
    return () => animation.stop()
  }, [glow, pulseKey, shakeX])

  const borderColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(103, 232, 249, 0)', 'rgba(103, 232, 249, 0.7)'],
  })

  return (
    <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
      <Animated.View
        style={[
          style,
          {
            borderColor,
            borderWidth: 2,
            borderRadius: 16,
            padding: 2,
            margin: -2,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Animated.View>
  )
}

type CheckInDraft = {
  mood: MentalHealthMoodLevelId | null
  moodReason: string
  emotions: string[]
  emotionIntensity: number | null
  mainInfluence: string | null
  influenceValence: MentalHealthInfluenceValence | null
  influenceDetail: string
  reactions: string[]
  reactionHelp: string
}

type MentalHealthCheckInDrawerProps = {
  visible: boolean
  initialMood?: MentalHealthMoodLevelId | null
  initialStep?: 1 | 2 | 3 | 4
  onClose: () => void
  onSave: (input: MentalHealthCheckInSaveInput) => Promise<void> | void
}

function emptyDraft(initialMood: MentalHealthMoodLevelId | null = null): CheckInDraft {
  return {
    mood: initialMood,
    moodReason: '',
    emotions: [],
    emotionIntensity: null,
    mainInfluence: null,
    influenceValence: null,
    influenceDetail: '',
    reactions: [],
    reactionHelp: '',
  }
}

function clampCheckInStep(
  step: 1 | 2 | 3 | 4,
  mood: MentalHealthMoodLevelId | null,
): 1 | 2 | 3 | 4 {
  const maxStep = getCheckInMaxStep(mood)
  return step > maxStep ? maxStep : step
}

function resetDraftForMoodChange(
  current: CheckInDraft,
  mood: MentalHealthMoodLevelId,
): CheckInDraft {
  const wasPositive = isPositiveCheckInMood(current.mood)
  const isPositive = isPositiveCheckInMood(mood)
  const moodPathChanged = wasPositive !== isPositive

  if (!moodPathChanged && current.mood === mood) {
    return { ...current, mood }
  }

  const allowedEmotions = new Set<string>(getCheckInEmotionsForMood(mood))
  const emotions = moodPathChanged
    ? []
    : current.emotions.filter((emotion) => allowedEmotions.has(emotion))

  return {
    ...current,
    mood,
    emotions,
    emotionIntensity: emotions.length === 0 ? null : current.emotionIntensity,
    mainInfluence: moodPathChanged ? null : current.mainInfluence,
    influenceValence: moodPathChanged ? null : current.influenceValence,
    influenceDetail: moodPathChanged ? '' : current.influenceDetail,
    reactions: moodPathChanged ? [] : current.reactions,
    reactionHelp: moodPathChanged ? '' : current.reactionHelp,
  }
}

function OptionalTextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <View style={styles.optionalField}>
      <Text style={styles.optionalLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        multiline
        maxLength={OPTIONAL_TEXT_LIMIT}
        style={styles.optionalInput}
      />
      <Text style={styles.optionalCounter}>
        {value.length}/{OPTIONAL_TEXT_LIMIT}
      </Text>
    </View>
  )
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  )
}

export function MentalHealthCheckInDrawer({
  visible,
  initialMood = null,
  initialStep = 1,
  onClose,
  onSave,
}: MentalHealthCheckInDrawerProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [phase, setPhase] = useState<'steps' | 'result'>('steps')
  const [draft, setDraft] = useState<CheckInDraft>(() => emptyDraft(initialMood))
  const [isSaving, setIsSaving] = useState(false)
  const [hintPulse, setHintPulse] = useState(EMPTY_HINT_PULSE)

  const isPositivePath = isPositiveCheckInMood(draft.mood)
  const maxStep = getCheckInMaxStep(draft.mood)
  const availableEmotions = getCheckInEmotionsForMood(draft.mood)
  const availableInfluences = getCheckInInfluencesForMood(draft.mood)
  const activeSteps = CHECKIN_STEPS.slice(0, maxStep)
  const currentStepMeta = CHECKIN_STEPS[step - 1] ?? CHECKIN_STEPS[0]

  useEffect(() => {
    if (!visible) return
    setPhase('steps')
    setStep(clampCheckInStep(initialStep, initialMood))
    setDraft(emptyDraft(initialMood))
    setIsSaving(false)
    setHintPulse(EMPTY_HINT_PULSE)
  }, [initialMood, initialStep, visible])

  const triggerHints = useCallback((targets: CheckInHintTarget[]) => {
    if (targets.length === 0) return

    setHintPulse((current) => {
      const next = { ...current }
      for (const target of targets) {
        next[target] += 1
      }
      return next
    })
  }, [])

  const handleContinueStep1 = useCallback(() => {
    if (!draft.mood) {
      triggerHints(['mood'])
      return
    }

    setStep(2)
  }, [draft.mood, triggerHints])

  const handleContinueStep3 = useCallback(() => {
    const missing: CheckInHintTarget[] = []

    if (!draft.mainInfluence) {
      missing.push('influence')
    }

    if (!isPositivePath && !draft.influenceValence) {
      missing.push('valence')
    }

    if (missing.length > 0) {
      triggerHints(missing)
      return
    }

    setStep((current) => clampCheckInStep((current + 1) as 2 | 3 | 4, draft.mood))
  }, [draft.influenceValence, draft.mainInfluence, draft.mood, isPositivePath, triggerHints])

  const handleBack = useCallback(() => {
    if (phase === 'result') {
      onClose()
      return
    }

    if (step > 1) {
      setStep((current) => (current - 1) as 1 | 2 | 3 | 4)
      return
    }

    onClose()
  }, [onClose, phase, step])

  useAndroidBackHandler(
    useCallback(() => {
      if (!visible) return false
      handleBack()
      return true
    }, [handleBack, visible]),
  )

  function selectEmotionAndAdvance(label: string) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setDraft((current) => ({
      ...current,
      emotions: [label],
      emotionIntensity: 3,
    }))
    setStep(3)
  }

  function toggleReaction(label: string) {
    setDraft((current) => ({
      ...current,
      reactions: current.reactions.includes(label)
        ? current.reactions.filter((item) => item !== label)
        : [...current.reactions, label],
    }))
  }

  async function handleFinalize() {
    const missing: CheckInHintTarget[] = []

    if (!draft.mainInfluence) {
      missing.push('influence')
    }

    if (!isPositivePath && !draft.influenceValence) {
      missing.push('valence')
    }

    if (!draft.mood || missing.length > 0) {
      triggerHints(missing)
      return
    }

    setIsSaving(true)

    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      await onSave({
        mood: draft.mood,
        moodReason: draft.moodReason.trim() || null,
        emotions: draft.emotions,
        emotionIntensity: draft.emotionIntensity,
        mainInfluence: draft.mainInfluence,
        influenceValence: isPositivePath ? null : draft.influenceValence,
        influenceDetail: draft.influenceDetail.trim() || null,
        reactions: isPositivePath ? [] : draft.reactions,
        reactionHelp: isPositivePath ? null : draft.reactionHelp.trim() || null,
        isQuickEntry: false,
      })
      setPhase('result')
    } finally {
      setIsSaving(false)
    }
  }


  const footer =
    phase === 'result' ? (
      <PrimaryButton label="Registrar como está meu dia" onPress={onClose} />
    ) : step === 1 ? (
      <PrimaryButton label="Continuar" onPress={handleContinueStep1} />
    ) : step === 2 ? undefined : step === 4 || (step === 3 && isPositivePath) ? (
      <View style={styles.footerPair}>
        <Pressable
          onPress={() => setStep(step === 4 ? 3 : 2)}
          style={({ pressed }) => [styles.footerSecondary, pressed && styles.buttonPressed]}
        >
          <Text style={styles.footerSecondaryText}>Voltar</Text>
        </Pressable>
        <View style={styles.footerPrimaryWrap}>
          <PrimaryButton
            label="Finalizar check-in"
            onPress={() => void handleFinalize()}
            loading={isSaving}
          />
        </View>
      </View>
    ) : (
      <View style={styles.footerPair}>
        <Pressable
          onPress={() => setStep((current) => (current - 1) as 1 | 2 | 3 | 4)}
          style={({ pressed }) => [styles.footerSecondary, pressed && styles.buttonPressed]}
        >
          <Text style={styles.footerSecondaryText}>Voltar</Text>
        </Pressable>
        <View style={styles.footerPrimaryWrap}>
          <PrimaryButton label="Continuar" onPress={handleContinueStep3} />
        </View>
      </View>
    )

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={phase === 'result' ? 'Check-in registrado' : currentStepMeta.title}
      subtitle={
        phase === 'result'
          ? 'Seu momento foi salvo com carinho.'
          : currentStepMeta.subtitle
      }
      onClose={handleBack}
      fullScreen
      hideCloseButton
      footer={footer}
      keyboardAware
    >
      {phase === 'steps' ? (
        <View style={styles.topBar}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel={step > 1 ? 'Voltar para etapa anterior' : 'Fechar check-in'}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>

          <View style={styles.progressRow}>
            {activeSteps.map((item) => (
              <View
                key={item.id}
                style={[styles.progressDot, item.id <= step && styles.progressDotActive]}
              />
            ))}
          </View>

          <View style={styles.backBtnPlaceholder} />
        </View>
      ) : null}

      {phase === 'result' ? (
        <View style={styles.stepContent}>
          <View style={styles.resultBadge}>
            <Ionicons name="checkmark-circle" size={22} color="#67e8f9" />
            <Text style={styles.resultBadgeText}>Registro concluído</Text>
          </View>

          <Text style={styles.resultMessage}>
            Seu check-in foi salvo. Toque abaixo para registrar como está seu dia.
          </Text>
        </View>
      ) : null}

      {phase === 'steps' && step === 1 ? (
        <View style={styles.stepContent}>
          <Text style={styles.question}>Como você está agora?</Text>

          <AttentionHighlight pulseKey={hintPulse.mood}>
            <View style={styles.moodList}>
              {MENTAL_HEALTH_MOOD_OPTIONS.map((option) => {
                const selected = draft.mood === option.id

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      setDraft((current) => resetDraftForMoodChange(current, option.id))
                      setStep((current) => clampCheckInStep(current, option.id))
                    }}
                    style={({ pressed }) => [
                      styles.moodOption,
                      { backgroundColor: selected ? option.tint : 'rgba(255, 255, 255, 0.04)' },
                      selected && styles.moodOptionSelected,
                      pressed && styles.moodOptionPressed,
                    ]}
                  >
                    <MentalHealthMoodIcon mood={option.id} size="large" />
                    <Text style={[styles.moodOptionLabel, selected && styles.moodOptionLabelSelected]}>
                      {MENTAL_HEALTH_CHECKIN_MOOD_LABELS[option.id]}
                    </Text>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={20} color="#67e8f9" />
                    ) : (
                      <View style={styles.moodOptionCheckPlaceholder} />
                    )}
                  </Pressable>
                )
              })}
            </View>
          </AttentionHighlight>

          <OptionalTextField
            label="Quer contar rapidamente o motivo?"
            value={draft.moodReason}
            onChange={(value) => setDraft((current) => ({ ...current, moodReason: value }))}
            placeholder="Opcional — o que está por trás desse humor?"
          />
        </View>
      ) : null}

      {phase === 'steps' && step === 2 ? (
        <View style={styles.stepContent}>
          <Text style={styles.question}>Quais emoções estão mais presentes?</Text>
          <Text style={styles.helper}>Toque na emoção que mais combina com você agora.</Text>

          <View style={styles.chipsWrap}>
            {availableEmotions.map((emotion) => (
              <Chip
                key={emotion}
                label={emotion}
                selected={draft.emotions.includes(emotion)}
                onPress={() => selectEmotionAndAdvance(emotion)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {phase === 'steps' && step === 3 ? (
        <View style={styles.stepContent}>
          <Text style={styles.question}>O que mais influenciou como você está?</Text>

          <AttentionHighlight pulseKey={hintPulse.influence}>
            <View style={styles.chipsWrap}>
              {availableInfluences.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={draft.mainInfluence === item}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setDraft((current) => ({ ...current, mainInfluence: item }))
                  }}
                />
              ))}
            </View>
          </AttentionHighlight>

          {draft.mainInfluence ? (
            <>
              {!isPositivePath ? (
                <AttentionHighlight pulseKey={hintPulse.valence} style={styles.valenceBlock}>
                  <Text style={styles.question}>Esse acontecimento foi:</Text>
                  <View style={styles.chipsWrap}>
                    {MENTAL_HEALTH_INFLUENCE_VALENCE_OPTIONS.map((item) => (
                      <Chip
                        key={item.id}
                        label={item.label}
                        selected={draft.influenceValence === item.id}
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                          setDraft((current) => ({ ...current, influenceValence: item.id }))
                        }}
                      />
                    ))}
                  </View>
                </AttentionHighlight>
              ) : null}

              <OptionalTextField
                label="Conte brevemente o que aconteceu"
                value={draft.influenceDetail}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, influenceDetail: value }))
                }
                placeholder="Opcional — em poucas palavras"
              />
            </>
          ) : null}
        </View>
      ) : null}

      {phase === 'steps' && step === 4 && !isPositivePath ? (
        <View style={styles.stepContent}>
          <Text style={styles.question}>Como você lidou com isso?</Text>
          <Text style={styles.helper}>Você pode escolher mais de uma opção.</Text>

          <View style={styles.chipsWrap}>
            {MENTAL_HEALTH_CHECKIN_REACTIONS.map((reaction) => (
              <Chip
                key={reaction}
                label={reaction}
                selected={draft.reactions.includes(reaction)}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  toggleReaction(reaction)
                }}
              />
            ))}
          </View>

          <OptionalTextField
            label="Algo ajudou você a se sentir melhor?"
            value={draft.reactionHelp}
            onChange={(value) => setDraft((current) => ({ ...current, reactionHelp: value }))}
            placeholder="Opcional — o que fez diferença?"
          />
        </View>
      ) : null}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtnPressed: {
    opacity: 0.85,
  },
  backBtnPlaceholder: {
    width: 40,
    height: 40,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    width: 28,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  progressDotActive: {
    backgroundColor: '#67e8f9',
  },
  stepContent: {
    gap: 16,
    paddingBottom: 12,
  },
  question: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  helper: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: -8,
  },
  moodList: {
    gap: 8,
  },
  moodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  moodOptionSelected: {
    borderColor: 'rgba(103, 232, 249, 0.42)',
  },
  moodOptionPressed: {
    opacity: 0.92,
  },
  moodOptionLabel: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  moodOptionLabelSelected: {
    color: colors.text,
  },
  moodOptionCheckPlaceholder: {
    width: 20,
    height: 20,
  },
  optionalField: {
    gap: 8,
  },
  optionalLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  optionalInput: {
    minHeight: 88,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  optionalCounter: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  valenceBlock: {
    gap: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipSelected: {
    backgroundColor: 'rgba(8, 145, 178, 0.16)',
    borderColor: 'rgba(103, 232, 249, 0.42)',
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#67e8f9',
    fontWeight: '700',
  },
  intensityBlock: {
    gap: 12,
    paddingTop: 4,
  },
  intensityList: {
    gap: 8,
  },
  intensityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  intensityOptionSelected: {
    backgroundColor: 'rgba(8, 145, 178, 0.16)',
    borderColor: 'rgba(103, 232, 249, 0.42)',
  },
  intensityValue: {
    width: 24,
    color: '#67e8f9',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  intensityLabel: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  intensityLabelSelected: {
    color: colors.text,
  },
  footerPair: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  footerSecondary: {
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerSecondaryText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  footerPrimaryWrap: {
    flex: 1,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(8, 145, 178, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(103, 232, 249, 0.24)',
  },
  resultBadgeText: {
    color: '#a5f3fc',
    fontSize: 13,
    fontWeight: '700',
  },
  resultMessage: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  summaryCard: {
    gap: 2,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryLine: {
    gap: 4,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  summaryLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  activityHeading: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    paddingTop: 4,
  },
  activityCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(8, 145, 178, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(103, 232, 249, 0.22)',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 145, 178, 0.18)',
  },
  activityCopy: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  activityMeta: {
    color: '#a5f3fc',
    fontSize: 12,
    fontWeight: '700',
  },
  activitySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    paddingTop: 2,
  },
  resultActions: {
    gap: 10,
  },
  secondaryWideButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  secondaryWideButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  ghostWideButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostWideButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
})
