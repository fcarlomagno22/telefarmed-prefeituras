import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MenuDrawer } from '../components/MenuDrawer'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScheduleConfirmStep } from '../components/schedule/ScheduleConfirmStep'
import { ScheduleDateStep } from '../components/schedule/ScheduleDateStep'
import { ScheduleDoctorStep } from '../components/schedule/ScheduleDoctorStep'
import { ScheduleModeStep } from '../components/schedule/ScheduleModeStep'
import { ScheduleSpecialtyStep } from '../components/schedule/ScheduleSpecialtyStep'
import { ScheduleSuccessStep } from '../components/schedule/ScheduleSuccessStep'
import { ScheduleTimeStep } from '../components/schedule/ScheduleTimeStep'
import { ScheduleTimeline } from '../components/schedule/ScheduleTimeline'
import { ScheduleUbtStep } from '../components/schedule/ScheduleUbtStep'
import { appEnv } from '../config/env'
import { createAppointmentFromDraft } from '../data/mockMyAppointments'
import {
  fetchDoctorScheduleOverview,
  submitScheduleAppointment,
} from '../data/mockScheduleCatalog'
import { scheduleUbts } from '../data/mockScheduleUbts'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'
import {
  ScheduleAppointmentDraft,
  ScheduleAppointmentStep,
  ScheduleViewMode,
} from '../types/scheduleAppointment'
import { playSuccessSound } from '../utils/appSounds'
import {
  getScheduleStartDate,
  SCHEDULE_DAY_COUNT,
  toDateKey,
} from '../utils/scheduleDate'
import { resolveBrandImage } from '../utils/resolveBrandImage'
import { consumeScheduleUbtPrefill } from '../utils/schedulePrefill'

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')
const SCHEDULE_FOOTER_HEIGHT = 82

export function ScheduleAppointmentScreen() {
  const insets = useSafeAreaInsets()
  const { user, navigateTo, logout } = useAuth()

  const [step, setStep] = useState<ScheduleAppointmentStep>('specialty')
  const [scheduleMode, setScheduleMode] = useState<ScheduleViewMode>('by_day')
  const [specialtyId, setSpecialtyId] = useState('')
  const [specialtyName, setSpecialtyName] = useState('')
  const [selectedUbtId, setSelectedUbtId] = useState('')
  const [selectedUbtName, setSelectedUbtName] = useState('')
  const [selectedUbtAddress, setSelectedUbtAddress] = useState('')
  const [selectedDate, setSelectedDate] = useState(() => getScheduleStartDate())
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedDoctorName, setSelectedDoctorName] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [menuVisible, setMenuVisible] = useState(false)
  const [skipUbtStep, setSkipUbtStep] = useState(false)

  useEffect(() => {
    const prefill = consumeScheduleUbtPrefill()
    if (!prefill) return

    setSelectedUbtId(prefill.ubtId)
    setSelectedUbtName(prefill.ubtName)
    setSelectedUbtAddress(prefill.ubtAddress)
    setSkipUbtStep(true)
  }, [])

  const bottomContentPadding =
    SCHEDULE_FOOTER_HEIGHT + Math.max(insets.bottom, 12) + 16

  const draft: ScheduleAppointmentDraft = {
    specialtyId,
    specialtyName,
    selectedUbtId,
    selectedUbtName,
    selectedUbtAddress,
    selectedDate,
    selectedDoctorId,
    selectedDoctorName,
    selectedTime,
  }

  function resetUbtSelection() {
    setSelectedUbtId('')
    setSelectedUbtName('')
    setSelectedUbtAddress('')
  }

  function resetSchedulingState() {
    setScheduleMode('by_day')
    setSelectedDate(getScheduleStartDate())
    setSelectedDoctorId('')
    setSelectedDoctorName('')
    setSelectedTime('')
  }

  function handleBack() {
    if (step === 'success') {
      navigateTo('home')
      return
    }

    if (step === 'confirm') {
      setStep('schedule_time')
      return
    }

    if (step === 'schedule_time') {
      setStep(scheduleMode === 'by_day' ? 'schedule_doctor' : 'schedule_date')
      return
    }

    if (step === 'schedule_doctor') {
      setStep(scheduleMode === 'by_day' ? 'schedule_date' : 'schedule_mode')
      return
    }

    if (step === 'schedule_date') {
      setStep(scheduleMode === 'by_day' ? 'schedule_mode' : 'schedule_doctor')
      return
    }

    if (step === 'schedule_mode') {
      setStep(skipUbtStep ? 'specialty' : 'ubt')
      return
    }

    if (step === 'ubt') {
      setStep('specialty')
      return
    }

    if (step === 'specialty') {
      navigateTo('home')
    }
  }

  useAndroidBackHandler(() => {
    if (menuVisible) {
      closeMenu()
      return true
    }

    if (step === 'success') {
      navigateTo('home')
      return true
    }

    if (step === 'confirm') {
      setStep('schedule_time')
      return true
    }

    if (step === 'schedule_time') {
      setStep(scheduleMode === 'by_day' ? 'schedule_doctor' : 'schedule_date')
      return true
    }

    if (step === 'schedule_doctor') {
      setStep(scheduleMode === 'by_day' ? 'schedule_date' : 'schedule_mode')
      return true
    }

    if (step === 'schedule_date') {
      setStep(scheduleMode === 'by_day' ? 'schedule_mode' : 'schedule_doctor')
      return true
    }

    if (step === 'schedule_mode') {
      setStep(skipUbtStep ? 'specialty' : 'ubt')
      return true
    }

    if (step === 'ubt') {
      setStep('specialty')
      return true
    }

    return false
  })

  async function prepareDateAfterDoctorSelection() {
    if (!selectedDoctorId) return
    const scheduleStart = getScheduleStartDate()
    const overview = await fetchDoctorScheduleOverview(
      selectedDoctorId,
      scheduleStart,
      SCHEDULE_DAY_COUNT,
    )
    const nextDay = overview.find((d) => d.worksThisDay && d.availableSlots > 0)?.date
    if (nextDay) setSelectedDate(nextDay)
  }

  async function handlePrimaryAction() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    if (step === 'specialty' && specialtyId) {
      resetSchedulingState()
      if (skipUbtStep && selectedUbtId) {
        setStep('schedule_mode')
        return
      }
      resetUbtSelection()
      setStep('ubt')
      return
    }

    if (step === 'ubt' && selectedUbtId) {
      resetSchedulingState()
      setStep('schedule_mode')
      return
    }

    if (step === 'schedule_mode') {
      setStep(scheduleMode === 'by_day' ? 'schedule_date' : 'schedule_doctor')
      return
    }

    if (step === 'schedule_date') {
      setStep(scheduleMode === 'by_day' ? 'schedule_doctor' : 'schedule_time')
      return
    }

    if (step === 'schedule_doctor' && selectedDoctorId) {
      if (scheduleMode === 'by_doctor') {
        await prepareDateAfterDoctorSelection()
        setSelectedTime('')
        setStep('schedule_date')
      } else {
        setStep('schedule_time')
      }
      return
    }

    if (step === 'schedule_time' && selectedTime) {
      setSubmitError(null)
      setStep('confirm')
      return
    }

    if (step === 'confirm') {
      void confirmSchedule()
      return
    }

    if (step === 'success') {
      navigateTo('home')
    }
  }

  async function confirmSchedule() {
    if (!user || !selectedDoctorId || !selectedTime || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await submitScheduleAppointment({
        pacienteId: user.cpf,
        profissionalId: selectedDoctorId,
        especialidadeId: specialtyId,
        data: toDateKey(selectedDate),
        hora: selectedTime,
        telefoneContato: user.phone,
      })
      await createAppointmentFromDraft(user.cpf, {
        specialtyId,
        specialtyName,
        selectedUbtId,
        selectedUbtName,
        selectedUbtAddress,
        selectedDate: toDateKey(selectedDate),
        selectedDoctorId,
        selectedDoctorName,
        selectedTime,
      })
      void playSuccessSound()
      setStep('success')
    } catch {
      setSubmitError('Não foi possível agendar a consulta. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function closeMenu() {
    setMenuVisible(false)
  }

  function handleLogout() {
    closeMenu()
    void logout()
  }

  function getPrimaryLabel(): string {
    if (step === 'specialty') return 'Continuar'
    if (step === 'ubt') return 'Continuar'
    if (step === 'schedule_mode') return 'Continuar'
    if (step === 'schedule_date') return 'Continuar'
    if (step === 'schedule_doctor') return 'Continuar'
    if (step === 'schedule_time') return 'Revisar agendamento'
    if (step === 'confirm') return isSubmitting ? 'Agendando…' : 'Confirmar consulta'
    if (step === 'success') return 'Ir ao início'
    return 'Continuar'
  }

  const primaryDisabled =
    step === 'specialty'
      ? !specialtyId
      : step === 'ubt'
        ? !selectedUbtId
        : step === 'schedule_doctor'
        ? !selectedDoctorId
        : step === 'schedule_time'
          ? !selectedTime
          : step === 'confirm'
            ? isSubmitting
            : false

  return (
    <>
      <View style={styles.root}>
        <ImageBackground
          source={backgroundSource}
          style={styles.background}
          resizeMode="cover"
          imageStyle={styles.backgroundImage}
        />

        <LinearGradient
          colors={['rgba(10, 10, 12, 0.55)', 'transparent', 'rgba(10, 10, 12, 0.75)']}
          locations={[0, 0.35, 1]}
          style={styles.screenOverlay}
          pointerEvents="none"
        />

        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
          {step !== 'success' ? (
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}

          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Agendar consulta</Text>
            <Text style={styles.headerSubtitle}>
              Especialidade · UBT · Agendamento · Confirmação
            </Text>
          </View>
        </View>

        {step !== 'success' ? <ScheduleTimeline step={step} /> : null}

        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            { paddingBottom: bottomContentPadding },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'specialty' ? (
            <ScheduleSpecialtyStep
              selectedId={specialtyId}
              onSelect={(id, name) => {
                setSpecialtyId(id)
                setSpecialtyName(name)
                resetUbtSelection()
              }}
            />
          ) : null}

          {step === 'ubt' && user ? (
            <ScheduleUbtStep
              specialtyName={specialtyName}
              userAddress={user.address}
              selectedId={selectedUbtId}
              onSelect={(id, name) => {
                setSelectedUbtId(id)
                setSelectedUbtName(name)
                const ubt = scheduleUbts.find((item) => item.id === id)
                if (ubt) {
                  setSelectedUbtAddress(`${ubt.address} · ${ubt.neighborhood}`)
                }
              }}
            />
          ) : null}

          {step === 'schedule_mode' ? (
            <ScheduleModeStep
              specialtyName={specialtyName}
              selectedMode={scheduleMode}
              onSelectMode={(mode) => {
                setScheduleMode(mode)
                setSelectedDoctorId('')
                setSelectedDoctorName('')
                setSelectedTime('')
                setSelectedDate(getScheduleStartDate())
              }}
            />
          ) : null}

          {step === 'schedule_date' ? (
            <ScheduleDateStep
              specialtyId={specialtyId}
              specialtyName={specialtyName}
              mode={scheduleMode}
              selectedDoctorId={scheduleMode === 'by_doctor' ? selectedDoctorId : undefined}
              selectedDoctorName={scheduleMode === 'by_doctor' ? selectedDoctorName : undefined}
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date)
                if (scheduleMode === 'by_day') {
                  setSelectedDoctorId('')
                  setSelectedDoctorName('')
                }
                setSelectedTime('')
              }}
            />
          ) : null}

          {step === 'schedule_doctor' ? (
            <ScheduleDoctorStep
              specialtyId={specialtyId}
              specialtyName={specialtyName}
              mode={scheduleMode}
              selectedDate={scheduleMode === 'by_day' ? selectedDate : undefined}
              selectedDoctorId={selectedDoctorId}
              onSelectDoctor={(id, name) => {
                setSelectedDoctorId(id)
                setSelectedDoctorName(name)
                setSelectedTime('')
              }}
            />
          ) : null}

          {step === 'schedule_time' ? (
            <ScheduleTimeStep
              selectedDate={selectedDate}
              selectedDoctorId={selectedDoctorId}
              selectedDoctorName={selectedDoctorName}
              selectedTime={selectedTime}
              onSelectTime={setSelectedTime}
            />
          ) : null}

          {step === 'confirm' && user ? (
            <>
              <ScheduleConfirmStep user={user} draft={draft} />
              {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
            </>
          ) : null}

          {step === 'success' && user ? (
            <ScheduleSuccessStep draft={draft} patientName={user.name} />
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <LinearGradient
            colors={['#1a1a22', '#111116', colors.background]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[
              styles.footerBackdrop,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            {step === 'success' ? (
              <PrimaryButton
                label="Ir ao início"
                onPress={() => navigateTo('home')}
                style={styles.footerPrimaryButton}
              />
            ) : (
              <View style={styles.footerRow}>
                <Pressable
                  onPress={handleBack}
                  style={({ pressed }) => [
                    styles.footerBackButton,
                    pressed && styles.footerBackButtonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Voltar"
                >
                  <Text style={styles.footerBackText}>Voltar</Text>
                </Pressable>

                <View style={styles.footerPrimarySlot}>
                  <PrimaryButton
                    label={getPrimaryLabel()}
                    onPress={() => void handlePrimaryAction()}
                    loading={isSubmitting}
                    disabled={primaryDisabled}
                    style={styles.footerPrimaryButton}
                  />
                </View>
              </View>
            )}
          </LinearGradient>
        </View>
      </View>

      <MenuDrawer
        visible={menuVisible}
        userName={user?.name}
        selfieUri={user?.selfieUri}
        onClose={closeMenu}
        onLogoutPress={handleLogout}
      />

    </>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  screenOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButtonPressed: {
    opacity: 0.82,
  },
  backButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  footerBackdrop: {
    paddingHorizontal: 16,
    paddingTop: 16,
    overflow: 'hidden',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerBackButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: colors.backgroundElevated,
  },
  footerBackButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  footerBackText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  footerPrimarySlot: {
    flex: 3,
  },
  footerPrimaryButton: {
    marginTop: 0,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
})
