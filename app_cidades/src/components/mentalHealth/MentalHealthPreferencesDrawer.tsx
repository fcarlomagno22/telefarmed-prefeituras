import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  loadMentalHealthOnboardingRecord,
  saveMentalHealthOnboardingRecord,
} from '../../data/mentalHealthOnboardingStorage'
import { recalculateClinicalEngine } from '../../mentalHealthEngine'
import { colors } from '../../theme/colors'
import {
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
} from '../../types/mentalHealth'
import type { UserClinicalState } from '../../types/mentalHealthEngine'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { MentalHealthPrivacyPolicyDrawer } from './MentalHealthPrivacyPolicyDrawer'

const EDIT_STEPS = [
  { id: 1, title: 'Consentimentos', subtitle: 'Privacidade e uso dos dados' },
  { id: 2, title: 'Preferências', subtitle: 'Focos e frequência' },
  { id: 3, title: 'Espiritualidade', subtitle: 'Conteúdo opcional' },
] as const

type MentalHealthPreferencesDrawerProps = {
  visible: boolean
  patientCpf: string
  initialRecord: MentalHealthOnboardingRecord
  onClose: () => void
  onSaved: (record: MentalHealthOnboardingRecord, clinicalState: UserClinicalState | null) => void
}

export function MentalHealthPreferencesDrawer({
  visible,
  patientCpf,
  initialRecord,
  onClose,
  onSaved,
}: MentalHealthPreferencesDrawerProps) {
  const [step, setStep] = useState(1)
  const [record, setRecord] = useState<MentalHealthOnboardingRecord>(initialRecord)
  const [consentError, setConsentError] = useState<string | null>(null)
  const [preferencesError, setPreferencesError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [policyVisible, setPolicyVisible] = useState(false)

  useEffect(() => {
    if (!visible) return
    void loadMentalHealthOnboardingRecord(patientCpf).then(setRecord)
    setStep(1)
    setConsentError(null)
    setPreferencesError(null)
  }, [patientCpf, visible])

  const allConsentsAccepted = useMemo(
    () => MENTAL_HEALTH_CONSENT_ITEMS.every((item) => record.consents[item.id]),
    [record.consents],
  )

  const canContinuePreferences = useMemo(() => {
    return record.preferences.careFocus.length > 0 && record.preferences.trackingFrequency != null
  }, [record.preferences.careFocus, record.preferences.trackingFrequency])

  const currentStepMeta = EDIT_STEPS[step - 1] ?? EDIT_STEPS[0]

  function toggleConsent(id: keyof MentalHealthConsentAcceptances) {
    setRecord((current) => ({
      ...current,
      consents: { ...current.consents, [id]: !current.consents[id] },
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
      if (selected.length >= MAX_MENTAL_HEALTH_CARE_FOCUS) return current
      return {
        ...current,
        preferences: { ...current.preferences, careFocus: [...selected, id] },
      }
    })
    setPreferencesError(null)
  }

  async function handleSave() {
    if (record.preferences.spiritualityPreference == null) return

    setIsSaving(true)
    try {
      const nextRecord: MentalHealthOnboardingRecord = {
        ...record,
        completed: true,
        completedAt: record.completedAt ?? new Date().toISOString(),
      }
      await saveMentalHealthOnboardingRecord(patientCpf, nextRecord)
      const result = await recalculateClinicalEngine(patientCpf, 'manual')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onSaved(nextRecord, result.state)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const footer = (
    <View style={styles.footerCol}>
      {step < 3 ? (
        <PrimaryButton
          label="Continuar"
          onPress={() => {
            if (step === 1) {
              if (!allConsentsAccepted) {
                setConsentError('Aceite todas as confirmações para continuar.')
                return
              }
              setConsentError(null)
              setStep(2)
              return
            }
            if (!canContinuePreferences) {
              setPreferencesError(
                'Selecione ao menos uma área de cuidado e a frequência de acompanhamento.',
              )
              return
            }
            setPreferencesError(null)
            setStep(3)
          }}
          disabled={step === 1 ? !allConsentsAccepted : !canContinuePreferences}
        />
      ) : (
        <PrimaryButton
          label="Salvar alterações"
          onPress={() => void handleSave()}
          loading={isSaving}
          disabled={record.preferences.spiritualityPreference == null}
        />
      )}
      <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
        <Text style={styles.closeBtnText}>Cancelar</Text>
      </Pressable>
    </View>
  )

  return (
    <>
      <RunWalkSheetDrawer
        visible={visible}
        title={currentStepMeta.title}
        subtitle={currentStepMeta.subtitle}
        onClose={onClose}
        fullScreen
        footer={footer}
      >
        <View style={styles.progressRow}>
          {EDIT_STEPS.map((item) => (
            <View
              key={item.id}
              style={[styles.progressDot, item.id <= step && styles.progressDotActive]}
            />
          ))}
        </View>

        {step === 1 ? (
          <View style={styles.stepContent}>
            <View style={styles.privacyNotes}>
              {MENTAL_HEALTH_PRIVACY_INFO_CARDS.map((note) => (
                <View key={note} style={styles.privacyNoteRow}>
                  <View style={styles.privacyBullet} />
                  <Text style={styles.privacyNoteText}>{note}</Text>
                </View>
              ))}
            </View>

            {consentError ? <Text style={styles.errorText}>{consentError}</Text> : null}

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

            <Pressable onPress={() => setPolicyVisible(true)} style={styles.linkBtn}>
              <Text style={styles.linkBtnText}>Ler política completa</Text>
            </Pressable>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.stepContent}>
            <Text style={styles.questionTitle}>O que você gostaria de cuidar neste momento?</Text>
            <Text style={styles.questionHint}>Selecione até {MAX_MENTAL_HEALTH_CARE_FOCUS} opções</Text>
            <View style={styles.chipsWrap}>
              {MENTAL_HEALTH_CARE_FOCUS_OPTIONS.map((option) => {
                const selected = record.preferences.careFocus.includes(option.id)
                const limitReached =
                  !selected && record.preferences.careFocus.length >= MAX_MENTAL_HEALTH_CARE_FOCUS
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => toggleCareFocus(option.id)}
                    disabled={limitReached}
                    style={[
                      styles.chip,
                      selected && styles.chipSelected,
                      limitReached && styles.chipDisabled,
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
                    onPress={() =>
                      setRecord((current) => ({
                        ...current,
                        preferences: { ...current.preferences, trackingFrequency: option.id },
                      }))
                    }
                    style={[styles.optionRow, selected && styles.optionRowSelected]}
                  >
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            {preferencesError ? <Text style={styles.errorText}>{preferencesError}</Text> : null}
          </View>
        ) : null}

        {step === 3 ? (
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
                    onPress={() =>
                      setRecord((current) => ({
                        ...current,
                        preferences: {
                          ...current.preferences,
                          spiritualityPreference: option.id as MentalHealthSpiritualityPreferenceId,
                        },
                      }))
                    }
                    style={[styles.optionRow, selected && styles.optionRowSelected]}
                  >
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        ) : null}
      </RunWalkSheetDrawer>

      <MentalHealthPrivacyPolicyDrawer visible={policyVisible} onClose={() => setPolicyVisible(false)} />
    </>
  )
}

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  progressDotActive: {
    backgroundColor: '#0891b2',
  },
  stepContent: {
    gap: 12,
  },
  privacyNotes: { gap: 10 },
  privacyNoteRow: { flexDirection: 'row', gap: 10 },
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
    lineHeight: 19,
  },
  consentRow: {
    flexDirection: 'row',
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
    lineHeight: 22,
  },
  questionHint: {
    color: colors.textSubtle,
    fontSize: 12,
    marginTop: -6,
  },
  questionSpacing: { marginTop: 8 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  chipDisabled: { opacity: 0.45 },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: '#67e8f9', fontWeight: '700' },
  optionsCol: { gap: 8 },
  optionRow: {
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
  optionLabel: { color: colors.text, fontSize: 14, fontWeight: '600' },
  optionLabelSelected: { color: '#a5f3fc' },
  errorText: { color: colors.error, fontSize: 12, fontWeight: '600' },
  linkBtn: { alignSelf: 'flex-start', paddingVertical: 8 },
  linkBtnText: {
    color: colors.textMuted,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  footerCol: { gap: 8 },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  closeBtnText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.88 },
})
