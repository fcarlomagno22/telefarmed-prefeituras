import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { MenuDrawer } from '../components/MenuDrawer'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScheduleCareModeStep } from '../components/schedule/ScheduleCareModeStep'
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
  ScheduleCareMode,
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
const TAB_BAR_DOCK_HEIGHT = 74
const SCHEDULE_FOOTER_HEIGHT = 80

export function ScheduleAppointmentScreen() {
  const insets = useSafeAreaInsets()
  const { user, navigateTo, logout } = useAuth()

  const [step, setStep] = useState<ScheduleAppointmentStep>('care_mode')
  const [careMode, setCareMode] = useState<ScheduleCareMode | ''>('')
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
  const [bottomTab, setBottomTab] = useState<BottomTabId | null>('agendar')
  const [skipUbtStep, setSkipUbtStep] = useState(false)

  useEffect(() => {
    const prefill = consumeScheduleUbtPrefill()
    if (!prefill) return

    setSelectedUbtId(prefill.ubtId)
    setSelectedUbtName(prefill.ubtName)
    setSelectedUbtAddress(prefill.ubtAddress)
    setSkipUbtStep(true)
  }, [])

  const tabBarOffset = TAB_BAR_DOCK_HEIGHT + Math.max(insets.bottom, 8)

  const showFooter = step === 'confirm' || step === 'success'

  const bottomContentPadding = showFooter
    ? SCHEDULE_FOOTER_HEIGHT + tabBarOffset + 16
    : tabBarOffset + 16

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
      setStep('care_mode')
      return
    }

    if (step === 'care_mode') {
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

    if (step === 'specialty') {
      setStep('care_mode')
      return true
    }

    if (step === 'care_mode') {
      navigateTo('home')
      return true
    }

    return false
  })

  async function prepareDateAfterDoctorSelection(doctorId: string) {
    const scheduleStart = getScheduleStartDate()
    const overview = await fetchDoctorScheduleOverview(
      doctorId,
      scheduleStart,
      SCHEDULE_DAY_COUNT,
    )
    const nextDay = overview.find((d) => d.worksThisDay && d.availableSlots > 0)?.date
    if (nextDay) setSelectedDate(nextDay)
  }

  function handleCareModeSelect(mode: ScheduleCareMode) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setCareMode(mode)
    if (mode === 'in_person') {
      setStep('specialty')
    }
  }

  function handleSpecialtySelect(id: string, name: string) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSpecialtyId(id)
    setSpecialtyName(name)
    resetSchedulingState()

    if (skipUbtStep && selectedUbtId) {
      setStep('schedule_mode')
      return
    }

    resetUbtSelection()
    setStep('ubt')
  }

  function handleUbtSelect(id: string, name: string) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedUbtId(id)
    setSelectedUbtName(name)
    const ubt = scheduleUbts.find((item) => item.id === id)
    if (ubt) {
      setSelectedUbtAddress(`${ubt.address} · ${ubt.neighborhood}`)
    }
    resetSchedulingState()
    setStep('schedule_mode')
  }

  function handleScheduleModeSelect(mode: ScheduleViewMode) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setScheduleMode(mode)
    setSelectedDoctorId('')
    setSelectedDoctorName('')
    setSelectedTime('')
    setSelectedDate(getScheduleStartDate())
    setStep(mode === 'by_day' ? 'schedule_date' : 'schedule_doctor')
  }

  function handleDateSelect(date: Date) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedDate(date)
    if (scheduleMode === 'by_day') {
      setSelectedDoctorId('')
      setSelectedDoctorName('')
    }
    setSelectedTime('')
    setStep(scheduleMode === 'by_day' ? 'schedule_doctor' : 'schedule_time')
  }

  async function handleDoctorSelect(id: string, name: string) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedDoctorId(id)
    setSelectedDoctorName(name)
    setSelectedTime('')

    if (scheduleMode === 'by_doctor') {
      await prepareDateAfterDoctorSelection(id)
      setStep('schedule_date')
      return
    }

    setStep('schedule_time')
  }

  function handleTimeSelect(time: string) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedTime(time)
    setSubmitError(null)
    setStep('confirm')
  }

  async function handlePrimaryAction() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

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

  function handleTabPress(tab: BottomTabId) {
    if (tab === 'home') {
      closeMenu()
      navigateTo('home')
      return
    }

    if (tab === 'menu') {
      setMenuVisible(true)
      setBottomTab('menu')
      return
    }

    if (tab === 'agendar') {
      closeMenu()
      setBottomTab('agendar')
      return
    }

    if (tab === 'my-metrics') {
      closeMenu()
      navigateTo('my-metrics')
      return
    }

    if (tab === 'pos-consulta') {
      closeMenu()
      navigateTo('post-consultation')
      return
    }

    closeMenu()
    setBottomTab(tab)
  }

  function closeMenu() {
    setMenuVisible(false)
    setBottomTab('agendar')
  }

  function handleLogout() {
    closeMenu()
    void logout()
  }

  function getPrimaryLabel(): string {
    if (step === 'confirm') return isSubmitting ? 'Agendando…' : 'Confirmar consulta'
    if (step === 'success') return 'Ir ao início'
    return 'Continuar'
  }

  const primaryDisabled = step === 'confirm' ? isSubmitting : false

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
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Agendar consulta</Text>
            <Text style={styles.headerSubtitle}>
              Modalidade · Especialidade · Unidade · Agendamento · Confirmação
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
          {step === 'care_mode' ? (
            <ScheduleCareModeStep
              selectedMode={careMode}
              onSelectMode={handleCareModeSelect}
              onBack={handleBack}
            />
          ) : null}

          {step === 'specialty' ? (
            <ScheduleSpecialtyStep
              selectedId={specialtyId}
              onSelect={handleSpecialtySelect}
              onBack={handleBack}
            />
          ) : null}

          {step === 'ubt' && user ? (
            <ScheduleUbtStep
              specialtyName={specialtyName}
              userAddress={user.address}
              selectedId={selectedUbtId}
              onSelect={handleUbtSelect}
              onBack={handleBack}
            />
          ) : null}

          {step === 'schedule_mode' ? (
            <ScheduleModeStep
              specialtyName={specialtyName}
              selectedMode={scheduleMode}
              onSelectMode={handleScheduleModeSelect}
              onBack={handleBack}
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
              onSelectDate={handleDateSelect}
              onBack={handleBack}
            />
          ) : null}

          {step === 'schedule_doctor' ? (
            <ScheduleDoctorStep
              specialtyId={specialtyId}
              specialtyName={specialtyName}
              mode={scheduleMode}
              selectedDate={scheduleMode === 'by_day' ? selectedDate : undefined}
              selectedDoctorId={selectedDoctorId}
              onSelectDoctor={(id, name) => void handleDoctorSelect(id, name)}
              onBack={handleBack}
            />
          ) : null}

          {step === 'schedule_time' ? (
            <ScheduleTimeStep
              selectedDate={selectedDate}
              selectedDoctorId={selectedDoctorId}
              selectedDoctorName={selectedDoctorName}
              selectedTime={selectedTime}
              onSelectTime={handleTimeSelect}
              onBack={handleBack}
            />
          ) : null}

          {step === 'confirm' && user ? (
            <>
              <ScheduleConfirmStep user={user} draft={draft} onBack={handleBack} />
              {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
            </>
          ) : null}

          {step === 'success' && user ? (
            <ScheduleSuccessStep draft={draft} patientName={user.name} />
          ) : null}
        </ScrollView>

        {showFooter ? (
          <View style={[styles.footer, { bottom: tabBarOffset }]}>
            <LinearGradient
              colors={['#1a1a22', '#111116', colors.background]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.footerBackdrop}
            >
              <PrimaryButton
                label={getPrimaryLabel()}
                onPress={() => void handlePrimaryAction()}
                loading={isSubmitting}
                disabled={primaryDisabled}
                style={styles.footerPrimaryButton}
              />
            </LinearGradient>
          </View>
        ) : null}

        <BottomTabBar
          activeTab={menuVisible ? 'menu' : bottomTab}
          onTabPress={handleTabPress}
        />
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
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTextCol: {
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
    paddingBottom: 12,
    overflow: 'hidden',
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
