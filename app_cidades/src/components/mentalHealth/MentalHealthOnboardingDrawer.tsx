import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'
import {
  completeMentalHealthOnboarding,
  loadMentalHealthOnboardingRecord,
} from '../../data/mentalHealthOnboardingStorage'
import { useMentalHealthAnamnesisActions } from '../../hooks/useMentalHealthAnamnesisActions'
import { colors } from '../../theme/colors'
import {
  emptyMentalHealthOnboardingRecord,
  MAX_MENTAL_HEALTH_CARE_FOCUS,
  MENTAL_HEALTH_CARE_FOCUS_OPTIONS,
  MENTAL_HEALTH_CONSENT_ITEMS,
  MENTAL_HEALTH_PRIVACY_INFO_CARDS,
  MENTAL_HEALTH_SPIRITUALITY_OPTIONS,
  MENTAL_HEALTH_TRACKING_FREQUENCY_OPTIONS,
  type MentalHealthCareFocusId,
  type MentalHealthConsentAcceptances,
  type MentalHealthOnboardingRecord,
  type MentalHealthSpiritualityPreferenceId,
  type MentalHealthTrackingFrequencyId,
} from '../../types/mentalHealth'
import type { UserClinicalState } from '../../types/mentalHealthEngine'
import { LottiePlayer } from '../LottiePlayer'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { MentalHealthHowItWorksDrawer } from './MentalHealthHowItWorksDrawer'
import { MentalHealthAnamnesisDrawer } from './MentalHealthAnamnesisDrawer'
import { MentalHealthPrivacyPolicyDrawer } from './MentalHealthPrivacyPolicyDrawer'

const welcomeAnimation = require('../../../assets/avatar.json')

const ONBOARDING_STEPS = [
  { id: 1, title: 'Boas-vindas', subtitle: 'Seu espaço de cuidado emocional' },
  { id: 2, title: 'Privacidade', subtitle: 'Proteção e consentimento' },
  { id: 3, title: 'Preferências', subtitle: 'O que você quer cuidar agora' },
  { id: 4, title: 'Espiritualidade', subtitle: 'Conteúdo cristão opcional' },
] as const

type OnboardingFlowPhase = 'setup' | 'anamnesis'

type MentalHealthOnboardingDrawerProps = {
  visible: boolean
  patientCpf: string
  onSetupComplete: (record: MentalHealthOnboardingRecord) => void
  onFlowComplete: (clinicalState?: UserClinicalState | null) => void
  onRequestBack: () => void
}

export function MentalHealthOnboardingDrawer({
  visible,
  patientCpf,
  onSetupComplete,
  onFlowComplete,
  onRequestBack,
}: MentalHealthOnboardingDrawerProps) {
  const [phase, setPhase] = useState<OnboardingFlowPhase>('setup')
  const [step, setStep] = useState(1)
  const [record, setRecord] = useState<MentalHealthOnboardingRecord>(
    emptyMentalHealthOnboardingRecord(),
  )
  const [howItWorksVisible, setHowItWorksVisible] = useState(false)
  const [policyVisible, setPolicyVisible] = useState(false)
  const [consentError, setConsentError] = useState<string | null>(null)
  const [preferencesError, setPreferencesError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [anamnesisInitialAnswers, setAnamnesisInitialAnswers] = useState<
    Record<string, import('../../types/mentalHealthEngine').AnamnesisAnswerRecord>
  >({})

  const {
    loadInitialAnswers,
    persistAnswers,
    completeModule,
    completeAnamnesis,
  } = useMentalHealthAnamnesisActions(patientCpf)

  const currentStepMeta = ONBOARDING_STEPS[step - 1] ?? ONBOARDING_STEPS[0]

  useEffect(() => {
    if (!visible) return

    void loadMentalHealthOnboardingRecord(patientCpf).then((stored) => {
      if (!stored.completed) {
        setRecord(stored)
      }
    })
  }, [patientCpf, visible])

  useEffect(() => {
    if (!visible) {
      setPhase('setup')
      setStep(1)
      setConsentError(null)
      setPreferencesError(null)
      setHowItWorksVisible(false)
      setPolicyVisible(false)
      setAnamnesisInitialAnswers({})
    }
  }, [visible])

  const allConsentsAccepted = useMemo(
    () => MENTAL_HEALTH_CONSENT_ITEMS.every((item) => record.consents[item.id]),
    [record.consents],
  )

  const canContinuePreferences = useMemo(() => {
    const hasFocus = record.preferences.careFocus.length > 0
    const hasFrequency = record.preferences.trackingFrequency != null
    return hasFocus && hasFrequency
  }, [record.preferences.careFocus, record.preferences.trackingFrequency])

  const handleBack = useCallback(() => {
    if (phase === 'anamnesis') {
      return
    }

    if (howItWorksVisible) {
      setHowItWorksVisible(false)
      return
    }

    if (policyVisible) {
      setPolicyVisible(false)
      return
    }

    if (step > 1) {
      setStep((current) => current - 1)
      setConsentError(null)
      setPreferencesError(null)
      return
    }

    onRequestBack()
  }, [howItWorksVisible, onRequestBack, phase, policyVisible, step])

  useAndroidBackHandler(
    useCallback(() => {
      if (!visible || phase === 'anamnesis') return false
      handleBack()
      return true
    }, [handleBack, phase, visible]),
  )

  function toggleConsent(id: keyof MentalHealthConsentAcceptances) {
    setRecord((current) => ({
      ...current,
      consents: {
        ...current.consents,
        [id]: !current.consents[id],
      },
    }))
    setConsentError(null)
  }

  function toggleCareFocus(id: MentalHealthCareFocusId) {
    setRecord((current) => {
      const selected = current.preferences.careFocus
      const isSelected = selected.includes(id)

      if (isSelected) {
        return {
          ...current,
          preferences: {
            ...current.preferences,
            careFocus: selected.filter((item) => item !== id),
          },
        }
      }

      if (selected.length >= MAX_MENTAL_HEALTH_CARE_FOCUS) {
        return current
      }

      return {
        ...current,
        preferences: {
          ...current.preferences,
          careFocus: [...selected, id],
        },
      }
    })
    setPreferencesError(null)
  }

  function selectTrackingFrequency(id: MentalHealthTrackingFrequencyId) {
    setRecord((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        trackingFrequency: id,
      },
    }))
    setPreferencesError(null)
  }

  function selectSpirituality(id: MentalHealthSpiritualityPreferenceId) {
    setRecord((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        spiritualityPreference: id,
      },
    }))
  }

  async function handleContinueFromSpirituality() {
    if (record.preferences.spiritualityPreference == null) return

    setIsSaving(true)

    try {
      const completedRecord: MentalHealthOnboardingRecord = {
        ...record,
        completed: true,
        completedAt: new Date().toISOString(),
      }

      await completeMentalHealthOnboarding(patientCpf, completedRecord)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onSetupComplete(completedRecord)

      const answers = await loadInitialAnswers()
      setAnamnesisInitialAnswers(answers)
      setPhase('anamnesis')
    } finally {
      setIsSaving(false)
    }
  }

  function handleAnamnesisBackToSpirituality() {
    setPhase('setup')
    setStep(4)
  }

  function handleAnamnesisFlowComplete(clinicalState?: UserClinicalState | null) {
    onFlowComplete(clinicalState ?? null)
  }

  function handleContinueFromConsent() {
    if (!allConsentsAccepted) {
      setConsentError('Aceite todas as confirmações para continuar.')
      return
    }

    setConsentError(null)
    setStep(3)
  }

  function handleContinueFromPreferences() {
    if (!canContinuePreferences) {
      setPreferencesError('Selecione ao menos uma área de cuidado e a frequência de acompanhamento.')
      return
    }

    setPreferencesError(null)
    setStep(4)
  }

  const footer = (() => {
    if (step === 1) {
      return (
        <View style={styles.footerCol}>
          <PrimaryButton
            label="Configurar meu cuidado"
            onPress={() => setStep(2)}
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

    if (step === 2) {
      return (
        <View style={styles.footerCol}>
          <PrimaryButton
            label="Continuar"
            onPress={handleContinueFromConsent}
            disabled={!allConsentsAccepted}
            style={styles.footerPrimaryButton}
          />
          <Pressable
            onPress={() => setPolicyVisible(true)}
            hitSlop={8}
            style={({ pressed }) => [styles.footerTextLinkWrap, pressed && styles.footerTextLinkPressed]}
          >
            <Text style={styles.footerTextLink}>Ler política completa</Text>
          </Pressable>
        </View>
      )
    }

    if (step === 3) {
      return (
        <View style={styles.footerCol}>
          <PrimaryButton
            label="Continuar"
            onPress={handleContinueFromPreferences}
            disabled={!canContinuePreferences}
            style={styles.footerPrimaryButton}
          />
        </View>
      )
    }

    return (
      <View style={styles.footerCol}>
        <PrimaryButton
          label="Continuar"
          onPress={() => void handleContinueFromSpirituality()}
          loading={isSaving}
          disabled={record.preferences.spiritualityPreference == null}
          style={styles.footerPrimaryButton}
        />
      </View>
    )
  })()

  if (phase === 'anamnesis') {
    return (
      <>
        <MentalHealthAnamnesisDrawer
          visible={visible}
          mode="initial"
          initialAnswers={anamnesisInitialAnswers}
          onClose={() => void handleAnamnesisFlowComplete()}
          onBackAtFirstQuestion={handleAnamnesisBackToSpirituality}
          onPersistAnswers={persistAnswers}
          onModuleComplete={(_moduleId, moduleAnswers, completionRatio, completedModuleIds) =>
            completeModule(moduleAnswers, completionRatio, completedModuleIds)
          }
          onComplete={(allAnswers, completionRatio, completedModuleIds) =>
            completeAnamnesis(allAnswers, completionRatio, completedModuleIds).then((state) => {
              handleAnamnesisFlowComplete(state)
            })
          }
        />

        <MentalHealthHowItWorksDrawer
          visible={howItWorksVisible}
          onClose={() => setHowItWorksVisible(false)}
        />

        <MentalHealthPrivacyPolicyDrawer
          visible={policyVisible}
          onClose={() => setPolicyVisible(false)}
        />
      </>
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
            {ONBOARDING_STEPS.map((item) => (
              <View
                key={item.id}
                style={[styles.progressDot, item.id <= step && styles.progressDotActive]}
              />
            ))}
          </View>

          <View style={styles.backBtnPlaceholder} />
        </View>

        {step === 1 ? (
          <View style={styles.stepContent}>
            <LottiePlayer
              source={welcomeAnimation}
              animationStyle={styles.welcomeLottie}
              style={styles.welcomeLottieWrap}
            />

            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>Jornada de cuidado</Text>
              <View style={styles.heroTitleBlock}>
                <Text style={styles.heroTitleLine}>Seu bem-estar</Text>
                <Text style={styles.heroTitleAccent}>em primeiro lugar</Text>
              </View>
            </View>
            <Text style={styles.heroBody}>
              A Telefarmed ajuda você a acompanhar suas emoções, entender mudanças no seu dia a dia
              e se aproximar de profissionais quando necessário.
            </Text>

            <View style={styles.disclaimerCard}>
              <Ionicons name="alert-circle-outline" size={18} color="#67e8f9" />
              <Text style={styles.disclaimerText}>
                Este recurso complementa o cuidado em saúde mental. Ele não substitui avaliação,
                diagnóstico ou tratamento profissional.
              </Text>
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.stepContent}>
            <View style={styles.privacyNotes}>
              {MENTAL_HEALTH_PRIVACY_INFO_CARDS.map((note) => (
                <View key={note} style={styles.privacyNoteRow}>
                  <View style={styles.privacyBullet} />
                  <Text style={styles.privacyNoteText}>{note}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Confirmações</Text>

            {consentError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{consentError}</Text>
              </View>
            ) : null}

            {MENTAL_HEALTH_CONSENT_ITEMS.map((item) => {
              const checked = record.consents[item.id]

              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggleConsent(item.id)}
                  style={[styles.consentRow, checked && styles.consentRowChecked]}
                >
                  <Ionicons
                    name={checked ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={checked ? '#0891b2' : colors.textMuted}
                  />
                  <Text style={styles.consentLabel}>{item.label}</Text>
                </Pressable>
              )
            })}
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.stepContent}>
            <Text style={styles.questionTitle}>O que você gostaria de cuidar neste momento?</Text>
            <Text style={styles.questionHint}>
              Selecione até {MAX_MENTAL_HEALTH_CARE_FOCUS} opções
            </Text>

            <View style={styles.chipsWrap}>
              {MENTAL_HEALTH_CARE_FOCUS_OPTIONS.map((option) => {
                const selected = record.preferences.careFocus.includes(option.id)
                const limitReached =
                  !selected &&
                  record.preferences.careFocus.length >= MAX_MENTAL_HEALTH_CARE_FOCUS

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => toggleCareFocus(option.id)}
                    disabled={limitReached}
                    style={({ pressed }) => [
                      styles.chip,
                      selected && styles.chipSelected,
                      limitReached && styles.chipDisabled,
                      pressed && !limitReached && styles.chipPressed,
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
              Com que frequência você deseja acompanhar como está?
            </Text>

            <View style={styles.optionsCol}>
              {MENTAL_HEALTH_TRACKING_FREQUENCY_OPTIONS.map((option) => {
                const selected = record.preferences.trackingFrequency === option.id

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => selectTrackingFrequency(option.id)}
                    style={({ pressed }) => [
                      styles.optionRow,
                      selected && styles.optionRowSelected,
                      pressed && styles.optionRowPressed,
                    ]}
                  >
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {option.label}
                    </Text>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={18} color="#67e8f9" />
                    ) : null}
                  </Pressable>
                )
              })}
            </View>

            {preferencesError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{preferencesError}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.stepContent}>
            <Text style={styles.questionTitle}>
              Deseja incluir conteúdo cristão na sua jornada de cuidado?
            </Text>

            <View style={styles.optionsCol}>
              {MENTAL_HEALTH_SPIRITUALITY_OPTIONS.map((option) => {
                const selected = record.preferences.spiritualityPreference === option.id

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => selectSpirituality(option.id)}
                    style={({ pressed }) => [
                      styles.optionRow,
                      selected && styles.optionRowSelected,
                      pressed && styles.optionRowPressed,
                    ]}
                  >
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {option.label}
                    </Text>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={18} color="#67e8f9" />
                    ) : null}
                  </Pressable>
                )
              })}
            </View>

            <View style={styles.disclaimerCard}>
              <Ionicons name="information-circle-outline" size={18} color="#67e8f9" />
              <Text style={styles.disclaimerText}>
                Essa escolha não interfere em sua avaliação emocional e pode ser alterada a
                qualquer momento.
              </Text>
            </View>
          </View>
        ) : null}
      </RunWalkSheetDrawer>

      <MentalHealthHowItWorksDrawer
        visible={howItWorksVisible}
        onClose={() => setHowItWorksVisible(false)}
      />

      <MentalHealthPrivacyPolicyDrawer
        visible={policyVisible}
        onClose={() => setPolicyVisible(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
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
    gap: 8,
  },
  progressDot: {
    width: 28,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  progressDotActive: {
    backgroundColor: '#0891b2',
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
    color: '#67e8f9',
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
    color: '#a5f3fc',
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
  introLead: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(8, 145, 178, 0.22)',
  },
  disclaimerText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  privacyNotes: {
    gap: 10,
    paddingVertical: 4,
  },
  privacyNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingRight: 4,
  },
  privacyBullet: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(103, 232, 249, 0.45)',
    marginTop: 7,
  },
  privacyNoteText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    paddingTop: 4,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  consentRowChecked: {
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
    borderColor: 'rgba(8, 145, 178, 0.28)',
  },
  consentLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
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
    backgroundColor: 'rgba(8, 145, 178, 0.16)',
    borderColor: 'rgba(103, 232, 249, 0.42)',
  },
  chipDisabled: {
    opacity: 0.45,
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
    color: '#67e8f9',
    fontWeight: '700',
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
    backgroundColor: 'rgba(8, 145, 178, 0.12)',
    borderColor: 'rgba(103, 232, 249, 0.35)',
  },
  optionRowPressed: {
    opacity: 0.88,
  },
  optionLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  optionLabelSelected: {
    color: '#a5f3fc',
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
})
