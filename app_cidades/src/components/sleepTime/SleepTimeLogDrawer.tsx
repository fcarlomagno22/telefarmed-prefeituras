import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import LottieView from 'lottie-react-native'
import { useEffect, useRef, useState } from 'react'
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { saveSleepLog } from '../../data/sleepLogStorage'
import { colors } from '../../theme/colors'
import type { SleepLogDraft, SleepQualityScore } from '../../types/sleepLog'
import { playSuccessSound } from '../../utils/appSounds'
import {
  adjustSleepTimeMinutes,
  buildSleepLogEntryFromDraft,
  formatSleepLogDateLabel,
  formatSleepTimeMinutes,
  getDefaultSleepLogDraft,
  getSleepQualityLabel,
  isFutureSleepDateIso,
  shiftSleepDateIso,
} from '../../utils/sleepLogFormat'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { MetricLogSuccessContent } from '../metrics/MetricLogSuccessContent'
import { EatWellLevelSlider } from '../eatWell/menuWizard/EatWellLevelSlider'
import { SleepTimeStarfield } from './SleepTimeStarfield'

const sleepinessAnimation = require('../../../assets/sleepiness.json')

const ACCENT = '#6366f1'
const ACCENT_GRADIENT = ['#a5b4fc', '#6366f1', '#4338ca'] as const
const SUCCESS_DISMISS_MS = 2600

type SleepTimeLogDrawerProps = {
  visible: boolean
  patientCpf: string
  onClose: () => void
  onRegistered: () => void
}

type TimeStepperProps = {
  label: string
  valueMinutes: number
  onChange: (nextMinutes: number) => void
}

function TimeStepper({ label, valueMinutes, onChange }: TimeStepperProps) {
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
          <Ionicons name="remove" size={20} color="#fff" />
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
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  )
}

type WakeCountStepperProps = {
  value: number
  onChange: (next: number) => void
}

function WakeCountStepper({ value, onChange }: WakeCountStepperProps) {
  function adjust(delta: number) {
    void Haptics.selectionAsync()
    onChange(Math.min(20, Math.max(0, value + delta)))
  }

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>Vezes que acordou durante a noite</Text>
      <View style={styles.timeRow}>
        <Pressable
          onPress={() => adjust(-1)}
          disabled={value <= 0}
          style={({ pressed }) => [
            styles.stepperButton,
            value <= 0 && styles.stepperDisabled,
            pressed && styles.stepperPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Diminuir quantidade de despertares"
        >
          <Ionicons name="remove" size={20} color="#fff" />
        </Pressable>

        <View style={styles.timeValueCard}>
          <Text style={styles.timeValue}>{value}</Text>
        </View>

        <Pressable
          onPress={() => adjust(1)}
          disabled={value >= 20}
          style={({ pressed }) => [
            styles.stepperButton,
            value >= 20 && styles.stepperDisabled,
            pressed && styles.stepperPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Aumentar quantidade de despertares"
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  )
}

export function SleepTimeLogDrawer({
  visible,
  patientCpf,
  onClose,
  onRegistered,
}: SleepTimeLogDrawerProps) {
  const [draft, setDraft] = useState<SleepLogDraft>(() => getDefaultSleepLogDraft())
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearSuccessTimer() {
    if (!successTimerRef.current) return
    clearTimeout(successTimerRef.current)
    successTimerRef.current = null
  }

  useEffect(() => {
    return () => clearSuccessTimer()
  }, [])

  useEffect(() => {
    if (!visible) {
      clearSuccessTimer()
      setShowSuccess(false)
      return
    }

    setDraft(getDefaultSleepLogDraft())
    setIsSaving(false)
    setShowSuccess(false)
  }, [visible])

  function handleClose() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Keyboard.dismiss()
    clearSuccessTimer()
    setShowSuccess(false)
    onClose()
  }

  function handleSuccessDismiss() {
    clearSuccessTimer()
    setShowSuccess(false)
    onClose()
  }

  function shiftBedDate(deltaDays: number) {
    const nextDateIso = shiftSleepDateIso(draft.bedDateIso, deltaDays)
    if (deltaDays > 0 && isFutureSleepDateIso(nextDateIso)) return
    void Haptics.selectionAsync()
    setDraft((current) => ({ ...current, bedDateIso: nextDateIso }))
  }

  async function handleRegister() {
    if (isSaving || showSuccess) return

    Keyboard.dismiss()
    setIsSaving(true)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    void playSuccessSound()

    try {
      const entry = buildSleepLogEntryFromDraft(draft)
      await saveSleepLog(patientCpf, entry)
      onRegistered()
      setShowSuccess(true)
      clearSuccessTimer()
      successTimerRef.current = setTimeout(() => {
        handleSuccessDismiss()
      }, SUCCESS_DISMISS_MS)
    } finally {
      setIsSaving(false)
    }
  }

  const canGoNextDate = !isFutureSleepDateIso(shiftSleepDateIso(draft.bedDateIso, 1))

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={showSuccess ? '' : 'Registrar sono'}
      subtitle={showSuccess ? undefined : 'Conte como foi a sua noite de descanso'}
      onClose={handleClose}
      fullScreen
      dense
      scrollable={!showSuccess}
      keyboardAware={!showSuccess}
      sheetBackground={
        <>
          <LinearGradient
            colors={['#070812', '#0a1220', '#050508']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <SleepTimeStarfield active={visible} />
        </>
      }
      footer={
        showSuccess ? undefined : (
          <Pressable
            onPress={() => void handleRegister()}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.submitButton,
              (pressed || isSaving) && styles.submitPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Registrar sono"
          >
            <LinearGradient
              colors={[...ACCENT_GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitGradient}
            >
              <Text style={styles.submitLabel}>{isSaving ? 'Registrando...' : 'Registrar'}</Text>
            </LinearGradient>
          </Pressable>
        )
      }
    >
      {showSuccess ? (
        <View style={styles.successWrap}>
          <MetricLogSuccessContent
            title="Noite registrada!"
            message="Suas horas de descanso foram salvas. Acompanhe sua evolução na aba Histórico e continue cuidando do seu sono."
          />
        </View>
      ) : (
        <View style={styles.content}>
        <View style={styles.hero}>
          <LottieView source={sleepinessAnimation} autoPlay loop style={styles.lottie} />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Data que deitou</Text>
          <View style={styles.dateRow}>
            <Pressable
              onPress={() => shiftBedDate(-1)}
              style={({ pressed }) => [styles.dateNavButton, pressed && styles.stepperPressed]}
              accessibilityRole="button"
              accessibilityLabel="Dia anterior"
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>

            <View style={styles.dateValueCard}>
              <Text style={styles.dateValue}>{formatSleepLogDateLabel(draft.bedDateIso)}</Text>
            </View>

            <Pressable
              onPress={() => shiftBedDate(1)}
              disabled={!canGoNextDate}
              style={({ pressed }) => [
                styles.dateNavButton,
                !canGoNextDate && styles.stepperDisabled,
                pressed && styles.stepperPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Próximo dia"
            >
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <TimeStepper
          label="Hora que deitou"
          valueMinutes={draft.bedTimeMinutes}
          onChange={(bedTimeMinutes) => setDraft((current) => ({ ...current, bedTimeMinutes }))}
        />

        <TimeStepper
          label="Hora que acordou"
          valueMinutes={draft.wakeTimeMinutes}
          onChange={(wakeTimeMinutes) => setDraft((current) => ({ ...current, wakeTimeMinutes }))}
        />

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Como foi a noite?</Text>
          <Text style={styles.qualityHint}>{getSleepQualityLabel(draft.quality)}</Text>
          <EatWellLevelSlider
            value={draft.quality}
            min={1}
            max={5}
            minLabel="Muito mal"
            maxLabel="Muito bem"
            accent={ACCENT}
            onChange={(quality) =>
              setDraft((current) => ({ ...current, quality: quality as SleepQualityScore }))
            }
          />
        </View>

        <WakeCountStepper
          value={draft.wakeCount}
          onChange={(wakeCount) => setDraft((current) => ({ ...current, wakeCount }))}
        />

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Observações (opcional)</Text>
          <TextInput
            value={draft.notes}
            onChangeText={(notes) => setDraft((current) => ({ ...current, notes }))}
            placeholder="Ex.: acordei com dor de cabeça, dormi melhor com chuva..."
            placeholderTextColor={colors.textSubtle}
            multiline
            textAlignVertical="top"
            style={styles.notesInput}
            selectionColor={ACCENT}
          />
        </View>
        </View>
      )}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  successWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 24,
  },
  content: {
    gap: 14,
    paddingTop: 0,
    paddingBottom: 8,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
    marginBottom: -10,
    overflow: 'hidden',
  },
  lottie: {
    width: 220,
    height: 96,
  },
  fieldBlock: {
    gap: 10,
  },
  fieldLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateNavButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dateValueCard: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.24)',
  },
  dateValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.28)',
  },
  stepperDisabled: {
    opacity: 0.35,
  },
  stepperPressed: {
    opacity: 0.86,
  },
  timeValueCard: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timeValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  qualityHint: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  notesInput: {
    minHeight: 96,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  submitButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitPressed: {
    opacity: 0.9,
  },
  submitGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
})
