import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppointmentPostConsultationDrawer } from '../components/appointments/AppointmentPostConsultationDrawer'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { MenuDrawer } from '../components/MenuDrawer'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { PosConsultaCheckinDrawer } from '../components/postConsultation/PosConsultaCheckinDrawer'
import { PostConsultationEmptyState } from '../components/postConsultation/PostConsultationEmptyState'
import { PostConsultationHowItWorksCard } from '../components/postConsultation/PostConsultationHowItWorksCard'
import { PostConsultationPlanCard } from '../components/postConsultation/PostConsultationPlanCard'
import { PostConsultationSegmentTabs } from '../components/postConsultation/PostConsultationSegmentTabs'
import { SkeletonBone } from '../components/SkeletonBone'
import { appEnv } from '../config/env'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { useSimulatedPageSkeleton } from '../hooks/useSimulatedPageSkeleton'
import { colors } from '../theme/colors'
import type {
  AppointmentPosConsultaCheckinItem,
  AppointmentPosConsultaPlan,
  PostConsultationPlanEntry,
  PostConsultationTab,
} from '../types/appointmentPostConsultation'
import { StoredAppointment } from '../types/myAppointments'
import {
  fetchPatientPostConsultationPlans,
  getPostConsultationHero,
  splitPostConsultationPlans,
} from '../utils/appointmentPostConsultation'
import { resolveBrandImage } from '../utils/resolveBrandImage'

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')
const TAB_BAR_ESTIMATED_HEIGHT = 78

export function PostConsultationScreen() {
  const insets = useSafeAreaInsets()
  const { user, navigateTo, logout } = useAuth()

  const [entries, setEntries] = useState<PostConsultationPlanEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [segmentTab, setSegmentTab] = useState<PostConsultationTab>('active')
  const [menuVisible, setMenuVisible] = useState(false)
  const [postConsultationTarget, setPostConsultationTarget] =
    useState<StoredAppointment | null>(null)
  const [postConsultationVisible, setPostConsultationVisible] = useState(false)
  const [postConsultationPlan, setPostConsultationPlan] =
    useState<AppointmentPosConsultaPlan | null>(null)
  const [checkinTarget, setCheckinTarget] =
    useState<AppointmentPosConsultaCheckinItem | null>(null)
  const [checkinVisible, setCheckinVisible] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const showSkeleton = useSimulatedPageSkeleton(isLoading)
  const bottomContentPadding =
    TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 24

  const loadPlans = useCallback(
    async (refresh = false) => {
      if (!user) return

      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const data = await fetchPatientPostConsultationPlans(user.cpf, user.name)
        setEntries(data)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [user],
  )

  useEffect(() => {
    void loadPlans()
  }, [loadPlans])

  const { active, closed } = useMemo(() => splitPostConsultationPlans(entries), [entries])
  const hero = useMemo(() => getPostConsultationHero(entries), [entries])
  const activeForList = useMemo(() => {
    if (!hero) return active
    return active.filter((entry) => entry.appointment.id !== hero.entry.appointment.id)
  }, [active, hero])

  function handleBack() {
    navigateTo('home')
  }

  function openPlanDrawer(entry: PostConsultationPlanEntry) {
    setPostConsultationTarget(entry.appointment)
    setPostConsultationVisible(true)
  }

  function closePlanDrawer() {
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
    setRefreshKey((value) => value + 1)
    void loadPlans(true)
  }

  function handleRespondFromHero() {
    if (!hero || hero.kind !== 'pending') return
    openCheckinDrawer(hero.entry.appointment, hero.entry.plan, hero.checkin)
  }

  function openCheckinFromPlanDrawer(
    checkin: AppointmentPosConsultaCheckinItem,
    plan: AppointmentPosConsultaPlan,
  ) {
    if (!postConsultationTarget) return
    openCheckinDrawer(postConsultationTarget, plan, checkin)
  }

  useAndroidBackHandler(() => {
    if (checkinVisible) {
      closeCheckinDrawer()
      return true
    }

    if (postConsultationVisible) {
      closePlanDrawer()
      return true
    }

    if (menuVisible) {
      setMenuVisible(false)
      return true
    }

    handleBack()
    return true
  })

  function handleTabPress(tab: BottomTabId) {
    if (tab === 'home') {
      setMenuVisible(false)
      navigateTo('home')
      return
    }

    if (tab === 'menu') {
      setMenuVisible(true)
      return
    }

    if (tab === 'agendar') {
      setMenuVisible(false)
      navigateTo('schedule-appointment')
      return
    }

    if (tab === 'my-metrics') {
      setMenuVisible(false)
      navigateTo('my-metrics')
      return
    }

    setMenuVisible(false)
  }

  function handleLogout() {
    setMenuVisible(false)
    void logout()
  }

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

        <ScreenStackHeader
          title="Pós-consulta"
          subtitle="Ativos · Encerrados"
          paddingTop={Math.max(insets.top, 12) + 8}
          onBack={handleBack}
        />

        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            { paddingBottom: bottomContentPadding },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void loadPlans(true)}
              tintColor={colors.primaryLight}
            />
          }
        >
          {showSkeleton ? (
            <View style={styles.skeletonBlock}>
              <SkeletonBone width="100%" height={46} borderRadius={14} />
              <SkeletonBone width="100%" height={180} borderRadius={18} />
              <SkeletonBone width="100%" height={140} borderRadius={18} />
            </View>
          ) : (
            <>
              <PostConsultationSegmentTabs
                activeTab={segmentTab}
                activeCount={active.length}
                closedCount={closed.length}
                onChange={setSegmentTab}
              />

              {segmentTab === 'active' ? (
                <View style={styles.howItWorksBlock}>
                  <PostConsultationHowItWorksCard />
                </View>
              ) : null}

              {segmentTab === 'active' ? (
                active.length === 0 ? (
                  <PostConsultationEmptyState
                    tab="active"
                    onViewAppointmentsPress={() => navigateTo('my-appointments')}
                  />
                ) : (
                  <>
                    {hero ? (
                      <View style={styles.section}>
                        <PostConsultationPlanCard
                          entry={hero.entry}
                          featured
                          pendingCheckin={hero.kind === 'pending' ? hero.checkin : null}
                          onPress={() => openPlanDrawer(hero.entry)}
                          onRespondPress={
                            hero.kind === 'pending' ? handleRespondFromHero : undefined
                          }
                        />
                      </View>
                    ) : null}

                    {activeForList.length > 0 && hero ? (
                      <Text style={styles.sectionTitle}>Outros acompanhamentos</Text>
                    ) : null}

                    {activeForList.length > 0 ? (
                      <View style={styles.list}>
                        {activeForList.map((entry) => (
                          <PostConsultationPlanCard
                            key={entry.appointment.id}
                            entry={entry}
                            onPress={() => openPlanDrawer(entry)}
                          />
                        ))}
                      </View>
                    ) : null}
                  </>
                )
              ) : closed.length === 0 ? (
                <PostConsultationEmptyState tab="closed" />
              ) : (
                <View style={styles.list}>
                  {closed.map((entry) => (
                    <PostConsultationPlanCard
                      key={entry.appointment.id}
                      entry={entry}
                      onPress={() => openPlanDrawer(entry)}
                    />
                  ))}
                </View>
              )}

            </>
          )}
        </ScrollView>

        <BottomTabBar activeTab="pos-consulta" onTabPress={handleTabPress} />
      </View>

      <AppointmentPostConsultationDrawer
        visible={postConsultationVisible}
        appointment={postConsultationTarget}
        patientCpf={user?.cpf}
        patientName={user?.name}
        refreshKey={refreshKey}
        onClose={closePlanDrawer}
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

      <MenuDrawer
        visible={menuVisible}
        userName={user?.name}
        selfieUri={user?.selfieUri}
        onClose={() => setMenuVisible(false)}
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
  body: {
    flex: 1,
  },
  bodyContent: {
    gap: 14,
    paddingTop: 4,
  },
  skeletonBlock: {
    paddingHorizontal: 16,
    gap: 12,
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
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  howItWorksBlock: {
    paddingHorizontal: 16,
  },
})
