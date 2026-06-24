import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { MenuDrawer } from '../components/MenuDrawer'
import { MetricsPeriodDrawer } from '../components/metrics/MetricsPeriodDrawer'
import { NeonSectionDivider } from '../components/NeonSectionDivider'
import { RunWalkChallengeCard } from '../components/runWalk/challenges/RunWalkChallengeCard'
import { RunWalkChallengeRankingBoardView } from '../components/runWalk/challenges/RunWalkChallengeRankingBoard'
import { RunWalkSegmentTabs } from '../components/runWalk/RunWalkSegmentTabs'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { useAuth } from '../contexts/AuthContext'
import { useGuestAuth } from '../contexts/GuestAuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import {
  buildDefaultRankingPeriod,
  getMockChallengeRankingBoard,
  MOCK_RUN_WALK_CHALLENGES,
} from '../data/mockRunWalkChallenges'
import {
  joinRunWalkChallenge,
  loadJoinedRunWalkChallengeIds,
} from '../data/runWalkChallengesStorage'
import { colors } from '../theme/colors'
import type { PeriodSelection } from '../types/metrics'
import { RUN_WALK_CHALLENGE_RANKING_TABS } from '../types/runWalkChallenges'

type ChallengeView = 'explore' | 'ranking'

type RunWalkChallengesScreenProps = {
  view?: ChallengeView
}

const CHALLENGE_VIEW_PAGES: ChallengeView[] = ['explore', 'ranking']

const CHALLENGE_VIEW_TABS = [
  { id: 'explore' as const, label: 'Explorar', available: true },
  { id: 'ranking' as const, label: 'Ranking', available: true },
]

const DEFAULT_RANKING_TAB = RUN_WALK_CHALLENGE_RANKING_TABS[0]
const TAB_BAR_ESTIMATED_HEIGHT = 78

export function RunWalkChallengesScreen({ view = 'explore' }: RunWalkChallengesScreenProps) {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const { user, goBack, navigateTo, logout } = useAuth()
  const { requireAuth } = useGuestAuth()
  const patientCpf = user?.cpf ?? 'guest'
  const patientName = user?.name ?? 'Você'

  const [activeView, setActiveView] = useState<ChallengeView>(view)
  const [joinedIds, setJoinedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [menuVisible, setMenuVisible] = useState(false)
  const [rankingPeriod, setRankingPeriod] = useState<PeriodSelection>(() => buildDefaultRankingPeriod())
  const [rankingPeriodDrawerVisible, setRankingPeriodDrawerVisible] = useState(false)

  const bottomContentPadding = TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 16

  const viewPagerRef = useRef<FlatList<ChallengeView>>(null)
  const viewPagerIndexRef = useRef(0)

  const loadJoined = useCallback(async () => {
    const ids = await loadJoinedRunWalkChallengeIds(patientCpf)
    setJoinedIds(ids)
    setIsLoading(false)
  }, [patientCpf])

  useEffect(() => {
    void loadJoined()
  }, [loadJoined])

  const scrollViewPagerTo = useCallback(
    (nextView: ChallengeView, animated = true) => {
      const index = CHALLENGE_VIEW_PAGES.indexOf(nextView)
      if (index < 0) return

      viewPagerIndexRef.current = index
      viewPagerRef.current?.scrollToOffset({
        offset: index * screenWidth,
        animated,
      })
    },
    [screenWidth],
  )

  const handleViewChange = useCallback(
    (nextView: ChallengeView) => {
      if (nextView === activeView) return

      setActiveView(nextView)
      scrollViewPagerTo(nextView)
    },
    [activeView, scrollViewPagerTo],
  )

  const handleViewPagerIndexChange = useCallback(
    (nextIndex: number, options?: { haptic?: boolean }) => {
      const clampedIndex = Math.min(Math.max(nextIndex, 0), CHALLENGE_VIEW_PAGES.length - 1)
      const nextView = CHALLENGE_VIEW_PAGES[clampedIndex] ?? 'explore'

      viewPagerIndexRef.current = clampedIndex

      setActiveView((currentView) => {
        if (currentView === nextView) return currentView

        if (options?.haptic) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }

        return nextView
      })
    },
    [],
  )

  const handleViewPagerScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
      handleViewPagerIndexChange(nextIndex, { haptic: true })
    },
    [handleViewPagerIndexChange, screenWidth],
  )

  useEffect(() => {
    const index = CHALLENGE_VIEW_PAGES.indexOf(activeView)
    if (index >= 0 && viewPagerIndexRef.current !== index) {
      scrollViewPagerTo(activeView, false)
    }
  }, [activeView, scrollViewPagerTo])

  useAndroidBackHandler(
    useCallback(() => {
      if (rankingPeriodDrawerVisible) {
        setRankingPeriodDrawerVisible(false)
        return true
      }

      if (menuVisible) {
        setMenuVisible(false)
        return true
      }

      goBack()
      return true
    }, [goBack, menuVisible, rankingPeriodDrawerVisible]),
  )

  function handleTabPress(tab: BottomTabId) {
    if (tab === 'menu') {
      setMenuVisible(true)
      return
    }

    setMenuVisible(false)

    if (tab === 'home') {
      navigateTo('home')
      return
    }

    if (tab === 'agendar') {
      navigateTo('schedule-appointment')
      return
    }

    if (tab === 'my-metrics') {
      navigateTo('my-metrics')
      return
    }

    if (tab === 'pos-consulta') {
      navigateTo('post-consultation')
    }
  }

  function handleLogout() {
    setMenuVisible(false)
    logout()
  }

  const rankingBoard = useMemo(
    () =>
      getMockChallengeRankingBoard(
        DEFAULT_RANKING_TAB?.id ?? 'consistency',
        patientName,
        rankingPeriod,
      ),
    [patientName, rankingPeriod],
  )

  async function handleParticipate(challengeId: string) {
    requireAuth('vida:run-walk', () => {
      void (async () => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        await joinRunWalkChallenge(patientCpf, challengeId)
        setJoinedIds((current) =>
          current.includes(challengeId) ? current : [...current, challengeId],
        )
      })()
    })
  }

  function handleRulesPress(challengeId: string) {
    requireAuth('vida:run-walk', () => {
      navigateTo('run-walk-challenge-rules', { challengeId })
    })
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingRoot, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primaryLight} size="large" />
      </View>
    )
  }

  return (
    <>
      <View style={styles.root}>
        <LinearGradient
          colors={['#0a0a0c', '#101018', '#0a0a0c']}
          style={StyleSheet.absoluteFill}
        />

        <LinearGradient
          colors={['rgba(236, 72, 153, 0.12)', 'transparent', 'rgba(37, 99, 235, 0.1)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <ScreenStackHeader
          title="Desafios"
          subtitle="Participe, evolua e convide amigos"
          paddingTop={Math.max(insets.top, 12) + 8}
          onBack={goBack}
        />

        <RunWalkSegmentTabs
          activeTab={activeView}
          onChange={handleViewChange}
          tabs={CHALLENGE_VIEW_TABS}
        />

        <FlatList
          ref={viewPagerRef}
          data={CHALLENGE_VIEW_PAGES}
          keyExtractor={(item) => item}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleViewPagerScrollEnd}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          style={styles.viewPager}
          renderItem={({ item }) => (
            <View style={[styles.viewPage, { width: screenWidth }]}>
              {item === 'explore' ? (
                <ScrollView
                  style={styles.listScroll}
                  contentContainerStyle={[
                    styles.listContent,
                    { paddingBottom: bottomContentPadding },
                  ]}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {MOCK_RUN_WALK_CHALLENGES.map((challenge) => (
                    <RunWalkChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      isJoined={joinedIds.includes(challenge.id)}
                      onParticipate={() => void handleParticipate(challenge.id)}
                      onRulesPress={() => handleRulesPress(challenge.id)}
                    />
                  ))}
                </ScrollView>
              ) : (
                <ScrollView
                  contentContainerStyle={[
                    styles.rankingContent,
                    { paddingBottom: bottomContentPadding },
                  ]}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <RunWalkChallengeRankingBoardView
                    board={rankingBoard}
                    currentUserPhotoUri={user?.selfieUri}
                    onCalendarPress={() => setRankingPeriodDrawerVisible(true)}
                  />
                  <NeonSectionDivider embedded style={styles.rankingDivider} />
                </ScrollView>
              )}
            </View>
          )}
        />

        <BottomTabBar activeTab={null} onTabPress={handleTabPress} />
      </View>

      <MenuDrawer
        visible={menuVisible}
        userName={user?.name}
        selfieUri={user?.selfieUri}
        onClose={() => setMenuVisible(false)}
        onLogoutPress={handleLogout}
      />

      <MetricsPeriodDrawer
        visible={rankingPeriodDrawerVisible}
        period={rankingPeriod}
        title="Período do ranking"
        subtitle="Escolha as datas para recalcular a classificação"
        onClose={() => setRankingPeriodDrawerVisible(false)}
        onApply={(nextPeriod) => {
          setRankingPeriod(nextPeriod)
          setRankingPeriodDrawerVisible(false)
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  viewPager: {
    flex: 1,
  },
  viewPage: {
    flex: 1,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    gap: 12,
    paddingTop: 4,
  },
  rankingContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  rankingDivider: {
    marginTop: 20,
    marginBottom: 4,
  },
})
