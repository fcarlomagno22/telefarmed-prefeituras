import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RemoteCareRequestCard } from '../components/appointments/RemoteCareRequestCard'
import { AppointmentCancelDrawer } from '../components/appointments/AppointmentCancelDrawer'
import { AppointmentCard } from '../components/appointments/AppointmentCard'
import { AppointmentDetailDrawer } from '../components/appointments/AppointmentDetailDrawer'
import { AppointmentDirectionsDrawer } from '../components/appointments/AppointmentDirectionsDrawer'
import { AppointmentDocumentsDrawer } from '../components/appointments/AppointmentDocumentsDrawer'
import { AppointmentEmptyState } from '../components/appointments/AppointmentEmptyState'
import { AppointmentPostConsultationDrawer } from '../components/appointments/AppointmentPostConsultationDrawer'
import { AppointmentSegmentTabs } from '../components/appointments/AppointmentSegmentTabs'
import { PosConsultaCheckinDrawer } from '../components/postConsultation/PosConsultaCheckinDrawer'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { MenuDrawer } from '../components/MenuDrawer'
import { MetricsPeriodDrawer } from '../components/metrics/MetricsPeriodDrawer'
import { SkeletonBone } from '../components/SkeletonBone'
import { appEnv } from '../config/env'
import {
  cancelMyAppointment,
  fetchMyAppointments,
} from '../data/mockMyAppointments'
import {
  fetchRemoteCareRequests,
  getActiveRemoteCareRequests,
} from '../data/mockRemoteCareRequests'
import { useAuth } from '../contexts/AuthContext'
import { useGuestAuth } from '../contexts/GuestAuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { useSimulatedPageSkeleton } from '../hooks/useSimulatedPageSkeleton'
import { colors } from '../theme/colors'
import { PeriodSelection } from '../types/metrics'
import type {
  AppointmentPosConsultaCheckinItem,
  AppointmentPosConsultaPlan,
} from '../types/appointmentPostConsultation'
import { MyAppointmentsTab, StoredAppointment } from '../types/myAppointments'
import type { RemoteCareRequest } from '../types/remoteCareRequest'
import {
  NavigationApp,
  openAppointmentDirections,
} from '../utils/appointmentMaps'
import { playSuccessSound } from '../utils/appSounds'
import {
  filterAppointmentsByTab,
  getAppointmentDateTime,
  getNextUpcomingAppointment,
} from '../utils/myAppointments'
import { buildPeriodSelection, formatPeriodLabel } from '../utils/metricsPeriod'
import { resolveBrandImage } from '../utils/resolveBrandImage'
import { addScheduleAppointmentToDeviceCalendar } from '../utils/scheduleCalendarEvent'

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')
const TAB_BAR_ESTIMATED_HEIGHT = 78
const APPOINTMENT_SEGMENT_PAGES: MyAppointmentsTab[] = ['upcoming', 'history']

export function MyAppointmentsScreen() {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const { user, navigateTo, logout } = useAuth()
  const { requireAuth } = useGuestAuth()

  const [segmentTab, setSegmentTab] = useState<MyAppointmentsTab>('upcoming')
  const segmentPagerRef = useRef<FlatList<MyAppointmentsTab>>(null)
  const segmentPagerProgrammaticScrollRef = useRef(false)
  const [bottomTab, setBottomTab] = useState<BottomTabId | null>(null)
  const [appointments, setAppointments] = useState<StoredAppointment[]>([])
  const [remoteCareRequests, setRemoteCareRequests] = useState<RemoteCareRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<StoredAppointment | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<StoredAppointment | null>(null)
  const [cancelVisible, setCancelVisible] = useState(false)
  const [directionsTarget, setDirectionsTarget] = useState<StoredAppointment | null>(null)
  const [directionsVisible, setDirectionsVisible] = useState(false)
  const [documentsTarget, setDocumentsTarget] = useState<StoredAppointment | null>(null)
  const [documentsVisible, setDocumentsVisible] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [historyPeriod, setHistoryPeriod] = useState<PeriodSelection | null>(null)
  const [historyPeriodDrawerVisible, setHistoryPeriodDrawerVisible] = useState(false)
  const [postConsultationTarget, setPostConsultationTarget] =
    useState<StoredAppointment | null>(null)
  const [postConsultationVisible, setPostConsultationVisible] = useState(false)
  const [postConsultationPlan, setPostConsultationPlan] =
    useState<AppointmentPosConsultaPlan | null>(null)
  const [checkinTarget, setCheckinTarget] =
    useState<AppointmentPosConsultaCheckinItem | null>(null)
  const [checkinVisible, setCheckinVisible] = useState(false)
  const [postConsultationRefreshKey, setPostConsultationRefreshKey] = useState(0)

  const showSkeleton = useSimulatedPageSkeleton(isLoading)

  const bottomContentPadding =
    TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 24

  const loadAppointments = useCallback(async (refresh = false) => {
    if (!user) {
      setAppointments([])
      setRemoteCareRequests([])
      setIsLoading(false)
      setIsRefreshing(false)
      return
    }

    if (refresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      const [data, remoteData] = await Promise.all([
        fetchMyAppointments(user.cpf),
        fetchRemoteCareRequests(user.cpf),
      ])
      setAppointments(data)
      setRemoteCareRequests(remoteData)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [user])

  useEffect(() => {
    void loadAppointments()
  }, [loadAppointments])

  const upcomingAppointments = useMemo(
    () => filterAppointmentsByTab(appointments, 'upcoming'),
    [appointments],
  )
  const historyAppointments = useMemo(
    () => filterAppointmentsByTab(appointments, 'history'),
    [appointments],
  )
  const filteredHistoryAppointments = useMemo(() => {
    if (!historyPeriod) return historyAppointments

    const startTime = historyPeriod.start.getTime()
    const endTime = historyPeriod.end.getTime()

    return historyAppointments.filter((appointment) => {
      const appointmentTime = getAppointmentDateTime(appointment).getTime()
      return appointmentTime >= startTime && appointmentTime <= endTime
    })
  }, [historyAppointments, historyPeriod])
  const activeRemoteCareRequests = useMemo(
    () => getActiveRemoteCareRequests(remoteCareRequests),
    [remoteCareRequests],
  )
  const historyFilterActive = historyPeriod !== null
  const historyPeriodDraft = historyPeriod ?? buildPeriodSelection('last30days')
  const nextAppointment = useMemo(
    () => getNextUpcomingAppointment(appointments),
    [appointments],
  )
  const otherUpcomingAppointments = useMemo(
    () =>
      upcomingAppointments.filter((item) =>
        nextAppointment ? item.id !== nextAppointment.id : true,
      ),
    [nextAppointment, upcomingAppointments],
  )
  const showUpcomingEmptyState =
    !nextAppointment &&
    activeRemoteCareRequests.length === 0 &&
    otherUpcomingAppointments.length === 0

  const scrollSegmentPagerTo = useCallback(
    (tab: MyAppointmentsTab, animated = true) => {
      const index = APPOINTMENT_SEGMENT_PAGES.indexOf(tab)
      if (index < 0) return

      segmentPagerProgrammaticScrollRef.current = animated
      segmentPagerRef.current?.scrollToOffset({
        offset: index * screenWidth,
        animated,
      })

      if (!animated) {
        segmentPagerProgrammaticScrollRef.current = false
      }
    },
    [screenWidth],
  )

  const handleSegmentTabChange = useCallback(
    (tab: MyAppointmentsTab) => {
      setSegmentTab(tab)
      scrollSegmentPagerTo(tab)
    },
    [scrollSegmentPagerTo],
  )

  const handleSegmentPagerIndexChange = useCallback(
    (nextIndex: number, options?: { haptic?: boolean }) => {
      const clampedIndex = Math.min(
        Math.max(nextIndex, 0),
        APPOINTMENT_SEGMENT_PAGES.length - 1,
      )
      const nextTab = APPOINTMENT_SEGMENT_PAGES[clampedIndex] ?? 'upcoming'

      setSegmentTab((current) => {
        if (current === nextTab) return current
        if (options?.haptic) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }
        return nextTab
      })
    },
    [],
  )

  const handleSegmentPagerScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (segmentPagerProgrammaticScrollRef.current) return

      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
      handleSegmentPagerIndexChange(nextIndex)
    },
    [handleSegmentPagerIndexChange, screenWidth],
  )

  const handleSegmentPagerScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const wasProgrammatic = segmentPagerProgrammaticScrollRef.current
      segmentPagerProgrammaticScrollRef.current = false

      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
      handleSegmentPagerIndexChange(nextIndex, { haptic: !wasProgrammatic })
    },
    [handleSegmentPagerIndexChange, screenWidth],
  )

  useEffect(() => {
    scrollSegmentPagerTo(segmentTab, false)
  }, [screenWidth, scrollSegmentPagerTo, segmentTab])

  function handleBack() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    navigateTo('home')
  }

  useAndroidBackHandler(() => {
    if (cancelVisible) {
      closeCancelFlow()
      return true
    }

    if (directionsVisible) {
      closeDirectionsDrawer()
      return true
    }

    if (documentsVisible) {
      closeDocumentsDrawer()
      return true
    }

    if (detailVisible) {
      closeDetail()
      return true
    }

    if (checkinVisible) {
      closeCheckinDrawer()
      return true
    }

    if (postConsultationVisible) {
      closePostConsultationDrawer()
      return true
    }

    if (historyPeriodDrawerVisible) {
      setHistoryPeriodDrawerVisible(false)
      return true
    }

    if (menuVisible) {
      closeMenu()
      return true
    }

    return false
  })

  function openDetail(appointment: StoredAppointment) {
    requireAuth('quick:my-appointments', () => {
      setSelectedAppointment(appointment)
      setDetailVisible(true)
    })
  }

  function closeDetail() {
    setDetailVisible(false)
    setSelectedAppointment(null)
  }

  function openCancelFlow(appointment: StoredAppointment) {
    requireAuth('quick:my-appointments', () => {
      setDetailVisible(false)
      setCancelTarget(appointment)
      setCancelVisible(true)
    })
  }

  function closeCancelFlow() {
    setCancelVisible(false)
    setCancelTarget(null)
  }

  function openDirectionsDrawer(appointment: StoredAppointment) {
    requireAuth('quick:my-appointments', () => {
      setDirectionsTarget(appointment)
      setDirectionsVisible(true)
    })
  }

  function closeDirectionsDrawer() {
    setDirectionsVisible(false)
    setDirectionsTarget(null)
  }

  async function handleSelectNavigationApp(app: NavigationApp) {
    if (!directionsTarget) return

    await openAppointmentDirections(directionsTarget.selectedUbtId, app)
    closeDirectionsDrawer()
  }

  function openDocumentsDrawer(appointment: StoredAppointment) {
    requireAuth('quick:my-appointments', () => {
      setDocumentsTarget(appointment)
      setDocumentsVisible(true)
    })
  }

  function closeDocumentsDrawer() {
    setDocumentsVisible(false)
    setDocumentsTarget(null)
  }

  function handlePrescriptionsPress(appointment: StoredAppointment) {
    openDocumentsDrawer(appointment)
  }

  async function handleAddToCalendar(appointment: StoredAppointment) {
    requireAuth('quick:my-appointments', () => {
      void (async () => {
        if (!user) return

        const dateOnly = getAppointmentDateTime(appointment)
        dateOnly.setHours(12, 0, 0, 0)

        await addScheduleAppointmentToDeviceCalendar({
          specialtyName: appointment.specialtyName,
          doctorName: appointment.selectedDoctorName,
          selectedDate: dateOnly,
          selectedTime: appointment.selectedTime,
          patientName: user.name,
          ubtName: appointment.selectedUbtName,
          ubtAddress: appointment.selectedUbtAddress,
        })
      })()
    })
  }

  function handleDirections(appointment: StoredAppointment) {
    openDirectionsDrawer(appointment)
  }

  function handleReschedule() {
    requireAuth('quick:my-appointments', () => {
      closeDetail()
      closeCancelFlow()
      navigateTo('schedule-appointment')
    })
  }

  function openPostConsultationDrawer(appointment: StoredAppointment) {
    requireAuth('quick:my-appointments', () => {
      closeDetail()
      setPostConsultationTarget(appointment)
      setPostConsultationVisible(true)
    })
  }

  function closePostConsultationDrawer() {
    setPostConsultationVisible(false)
    setPostConsultationTarget(null)
    setPostConsultationPlan(null)
  }

  function openCheckinDrawer(
    appointment: StoredAppointment,
    plan: AppointmentPosConsultaPlan,
    checkin: AppointmentPosConsultaCheckinItem,
  ) {
    setPostConsultationPlan(plan)
    setPostConsultationTarget(appointment)
    setCheckinTarget(checkin)
    setCheckinVisible(true)
  }

  function closeCheckinDrawer() {
    setCheckinVisible(false)
    setCheckinTarget(null)
  }

  function handleCheckinSubmitted() {
    setPostConsultationRefreshKey((value) => value + 1)
  }

  function openCheckinFromPlanDrawer(
    checkin: AppointmentPosConsultaCheckinItem,
    plan: AppointmentPosConsultaPlan,
  ) {
    if (!postConsultationTarget) return
    openCheckinDrawer(postConsultationTarget, plan, checkin)
  }

  function handlePostConsultationPress(appointment: StoredAppointment) {
    openPostConsultationDrawer(appointment)
  }

  async function handleConfirmCancel(reason: string) {
    requireAuth('quick:my-appointments', () => {
      void (async () => {
        if (!user || !cancelTarget) return

        setIsCancelling(true)

        try {
          await cancelMyAppointment(user.cpf, cancelTarget.id, reason)
          void playSuccessSound()
          closeCancelFlow()
          await loadAppointments(true)
        } finally {
          setIsCancelling(false)
        }
      })()
    })
  }

  function handleTabPress(tab: BottomTabId) {
    if (tab === 'home') {
      setMenuVisible(false)
      navigateTo('home')
      return
    }

    if (tab === 'menu') {
      setMenuVisible(true)
      setBottomTab('menu')
      return
    }

    if (tab === 'agendar') {
      setMenuVisible(false)
      navigateTo('schedule-appointment')
      return
    }

    setMenuVisible(false)
    setBottomTab(tab)
  }

  function closeMenu() {
    setMenuVisible(false)
    setBottomTab(null)
  }

  function handleLogout() {
    closeMenu()
    void logout()
  }

  const renderAppointmentSegmentPage = useCallback(
    (tab: MyAppointmentsTab) => {
      if (tab === 'upcoming') {
        return (
          <ScrollView
            style={styles.pageScroll}
            contentContainerStyle={[
              styles.pageContent,
              { paddingBottom: bottomContentPadding },
            ]}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => void loadAppointments(true)}
                tintColor={colors.primaryLight}
              />
            }
          >
            {activeRemoteCareRequests.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Consultas online</Text>
                <View style={styles.list}>
                  {activeRemoteCareRequests.map((request) => (
                    <RemoteCareRequestCard key={request.id} request={request} />
                  ))}
                </View>
              </>
            ) : null}

            {nextAppointment ? (
              <View style={styles.section}>
                <AppointmentCard
                  appointment={nextAppointment}
                  highlighted
                  onCalendarPress={() => void handleAddToCalendar(nextAppointment)}
                  onDirectionsPress={() => handleDirections(nextAppointment)}
                  onReschedulePress={handleReschedule}
                  onCancelPress={() => openCancelFlow(nextAppointment)}
                  onPostConsultationPress={handlePostConsultationPress}
                  onPrescriptionsPress={() => handlePrescriptionsPress(nextAppointment)}
                />
              </View>
            ) : null}

            {upcomingAppointments.length > 1 ? (
              <Text style={styles.sectionTitle}>Outras consultas</Text>
            ) : null}

            {showUpcomingEmptyState ? (
              <AppointmentEmptyState
                tab="upcoming"
                filtered={false}
                onSchedulePress={() => navigateTo('schedule-appointment')}
              />
            ) : (
              <View style={styles.list}>
                {otherUpcomingAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onCalendarPress={() => void handleAddToCalendar(appointment)}
                    onDirectionsPress={() => handleDirections(appointment)}
                    onReschedulePress={handleReschedule}
                    onCancelPress={() => openCancelFlow(appointment)}
                    onPostConsultationPress={handlePostConsultationPress}
                    onPrescriptionsPress={() => handlePrescriptionsPress(appointment)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )
      }

      return (
        <ScrollView
          style={styles.pageScroll}
          contentContainerStyle={[
            styles.pageContent,
            { paddingBottom: bottomContentPadding },
          ]}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void loadAppointments(true)}
              tintColor={colors.primaryLight}
            />
          }
        >
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleCol}>
              <Text style={styles.sectionTitleText}>Realizadas e canceladas</Text>
              {historyFilterActive ? (
                <Text style={styles.sectionPeriod}>{formatPeriodLabel(historyPeriod)}</Text>
              ) : null}
            </View>

            <Pressable
              onPress={() => setHistoryPeriodDrawerVisible(true)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.calendarButton,
                pressed && styles.calendarButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Filtrar histórico por período"
            >
              <Ionicons name="calendar-outline" size={19} color={colors.textMuted} />
            </Pressable>
          </View>

          {filteredHistoryAppointments.length === 0 ? (
            <AppointmentEmptyState
              tab="history"
              filtered={historyFilterActive}
              onSchedulePress={() => navigateTo('schedule-appointment')}
            />
          ) : (
            <View style={styles.list}>
              {filteredHistoryAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onCalendarPress={() => void handleAddToCalendar(appointment)}
                  onDirectionsPress={() => handleDirections(appointment)}
                  onReschedulePress={handleReschedule}
                  onCancelPress={() => openCancelFlow(appointment)}
                  onPostConsultationPress={handlePostConsultationPress}
                  onPrescriptionsPress={() => handlePrescriptionsPress(appointment)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )
    },
    [
      activeRemoteCareRequests,
      bottomContentPadding,
      filteredHistoryAppointments,
      handleAddToCalendar,
      handleDirections,
      handlePostConsultationPress,
      handlePrescriptionsPress,
      handleReschedule,
      historyFilterActive,
      historyPeriod,
      isRefreshing,
      loadAppointments,
      navigateTo,
      nextAppointment,
      openCancelFlow,
      otherUpcomingAppointments,
      showUpcomingEmptyState,
      upcomingAppointments.length,
    ],
  )

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
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>

          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Minhas Consultas</Text>
            <Text style={styles.headerSubtitle}>
              Agendadas · Realizadas · Canceladas
            </Text>
          </View>

          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.body}>
          {showSkeleton ? (
            <ScrollView
              contentContainerStyle={[
                styles.skeletonBlock,
                { paddingBottom: bottomContentPadding },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <SkeletonBone width="100%" height={46} borderRadius={14} />
              <SkeletonBone width="100%" height={180} borderRadius={18} />
              <SkeletonBone width="100%" height={180} borderRadius={18} />
            </ScrollView>
          ) : (
            <>
              <AppointmentSegmentTabs
                activeTab={segmentTab}
                upcomingCount={upcomingAppointments.length + activeRemoteCareRequests.length}
                historyCount={historyAppointments.length}
                onChange={handleSegmentTabChange}
              />

              <FlatList
                ref={segmentPagerRef}
                data={APPOINTMENT_SEGMENT_PAGES}
                keyExtractor={(item) => item}
                horizontal
                pagingEnabled
                nestedScrollEnabled
                bounces={false}
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                scrollEventThrottle={16}
                onScroll={handleSegmentPagerScroll}
                onMomentumScrollEnd={handleSegmentPagerScrollEnd}
                onScrollEndDrag={handleSegmentPagerScrollEnd}
                getItemLayout={(_, index) => ({
                  length: screenWidth,
                  offset: screenWidth * index,
                  index,
                })}
                style={styles.segmentPager}
                renderItem={({ item }) => (
                  <View style={[styles.segmentPage, { width: screenWidth }]}>
                    {renderAppointmentSegmentPage(item)}
                  </View>
                )}
              />
            </>
          )}
        </View>

        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            navigateTo('schedule-appointment')
          }}
          style={({ pressed }) => [
            styles.fab,
            {
              bottom: TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 14,
            },
            pressed && styles.fabPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Agendar nova consulta"
        >
          <View style={styles.fabShadow}>
            <LinearGradient
              colors={['#ffb366', '#ff6b00', '#e55f00']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.fabGradient}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0.06)', 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.55 }}
                style={styles.fabGloss}
                pointerEvents="none"
              />
              <Ionicons name="add" size={30} color="#fff" />
            </LinearGradient>
          </View>
        </Pressable>

        <BottomTabBar
          activeTab={menuVisible ? 'menu' : bottomTab}
          onTabPress={handleTabPress}
        />
      </View>

      <AppointmentDetailDrawer
        visible={detailVisible}
        appointment={selectedAppointment}
        onClose={closeDetail}
        onCalendarPress={() => {
          if (selectedAppointment) void handleAddToCalendar(selectedAppointment)
        }}
        onDirectionsPress={() => {
          if (selectedAppointment) handleDirections(selectedAppointment)
        }}
        onReschedulePress={handleReschedule}
        onCancelPress={() => {
          if (selectedAppointment) openCancelFlow(selectedAppointment)
        }}
        onPostConsultationPress={() => {
          if (selectedAppointment) handlePostConsultationPress(selectedAppointment)
        }}
      />

      <AppointmentPostConsultationDrawer
        visible={postConsultationVisible}
        appointment={postConsultationTarget}
        patientCpf={user?.cpf}
        patientName={user?.name}
        refreshKey={postConsultationRefreshKey}
        onClose={closePostConsultationDrawer}
        onRespondCheckin={openCheckinFromPlanDrawer}
      />

      <PosConsultaCheckinDrawer
        visible={checkinVisible}
        appointment={postConsultationTarget}
        plan={postConsultationPlan}
        checkin={checkinTarget}
        patientCpf={user?.cpf}
        onClose={closeCheckinDrawer}
        onSubmitted={handleCheckinSubmitted}
      />

      <AppointmentDirectionsDrawer
        visible={directionsVisible}
        appointment={directionsTarget}
        onClose={closeDirectionsDrawer}
        onSelectApp={(app) => void handleSelectNavigationApp(app)}
      />

      <AppointmentDocumentsDrawer
        visible={documentsVisible}
        appointment={documentsTarget}
        patientName={user?.name}
        onClose={closeDocumentsDrawer}
      />

      <AppointmentCancelDrawer
        visible={cancelVisible}
        appointment={cancelTarget}
        loading={isCancelling}
        onClose={closeCancelFlow}
        onConfirm={(reason) => void handleConfirmCancel(reason)}
      />

      <MetricsPeriodDrawer
        visible={historyPeriodDrawerVisible}
        period={historyPeriodDraft}
        subtitle="Filtre consultas realizadas e canceladas por data"
        onClose={() => setHistoryPeriodDrawerVisible(false)}
        onApply={setHistoryPeriod}
      />

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
  headerPlaceholder: {
    width: 40,
    height: 40,
  },
  backButtonPressed: {
    opacity: 0.82,
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
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
  segmentPager: {
    flex: 1,
  },
  segmentPage: {
    flex: 1,
  },
  pageScroll: {
    flex: 1,
  },
  pageContent: {
    gap: 14,
    paddingTop: 4,
  },
  skeletonBlock: {
    paddingHorizontal: 16,
    gap: 12,
    paddingTop: 4,
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
  },
  sectionTitleCol: {
    flex: 1,
    gap: 2,
  },
  sectionTitleText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sectionPeriod: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '600',
  },
  calendarButton: {
    padding: 2,
  },
  calendarButtonPressed: {
    opacity: 0.55,
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  fab: {
    position: 'absolute',
    right: 18,
    zIndex: 20,
  },
  fabPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.96 }],
  },
  fabShadow: {
    shadowColor: 'rgba(255, 107, 0, 0.5)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 10,
  },
  fabGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  fabGloss: {
    ...StyleSheet.absoluteFillObject,
  },
})
