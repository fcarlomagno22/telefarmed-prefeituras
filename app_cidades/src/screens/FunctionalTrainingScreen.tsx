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
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { ExerciseSessionOverlay } from '../components/functional/ExerciseSessionOverlay'
import { FunctionalCategoryFilterChips } from '../components/functional/FunctionalCategoryFilterChips'
import { FunctionalDifficultyFilterChips } from '../components/functional/FunctionalDifficultyFilterChips'
import { FunctionalEmptyState } from '../components/functional/FunctionalEmptyState'
import { FunctionalExerciseListRow } from '../components/functional/FunctionalExerciseListRow'
import { FunctionalExerciseSearchBar } from '../components/functional/FunctionalExerciseSearchBar'
import { FunctionalQuickWorkoutCard } from '../components/functional/FunctionalQuickWorkoutCard'
import { FunctionalSegmentTabs } from '../components/functional/FunctionalSegmentTabs'
import { FunctionalWeeklyStatsCard } from '../components/functional/FunctionalWeeklyStatsCard'
import { MenuDrawer } from '../components/MenuDrawer'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { appEnv } from '../config/env'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import type { ExerciseTimerConfig } from '../hooks/useExerciseTimer'
import {
  buildQuickWorkoutExercises,
} from '../utils/functionalTraining'
import {
  computeWeeklyStats,
  loadFavoriteExerciseIds,
  loadWorkoutHistory,
  saveWorkoutSession,
  toggleFavoriteExerciseId,
} from '../data/functionalTrainingStorage'
import { colors } from '../theme/colors'
import type {
  ExerciseFilterCategory,
  ExerciseFilterDifficulty,
  FunctionalTrainingTab,
} from '../types/functionalTraining'
import { getFunctionalRouteParams } from '../types/auth'
import {
  filterExercises,
  getCategoryCounts,
} from '../utils/functionalTraining'
import { resolveBrandImage } from '../utils/resolveBrandImage'

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')
const TAB_BAR_ESTIMATED_HEIGHT = 78

export function FunctionalTrainingScreen() {
  const insets = useSafeAreaInsets()
  const { user, navigateTo, goBack, canGoBack, logout, routeParams } = useAuth()
  const functionalParams = getFunctionalRouteParams(routeParams)

  const [menuVisible, setMenuVisible] = useState(false)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ExerciseFilterCategory>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<ExerciseFilterDifficulty>('all')
  const [segmentTab, setSegmentTab] = useState<FunctionalTrainingTab>('all')
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [weeklyStats, setWeeklyStats] = useState({
    sessionsCount: 0,
    totalActiveMinutes: 0,
    uniqueExercises: 0,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sessionVisible, setSessionVisible] = useState(false)
  const [sessionConfig, setSessionConfig] = useState<ExerciseTimerConfig | null>(null)

  const bottomContentPadding =
    TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 24

  const loadData = useCallback(async () => {
    if (!user) return

    const [favorites, history] = await Promise.all([
      loadFavoriteExerciseIds(user.cpf),
      loadWorkoutHistory(user.cpf),
    ])

    setFavoriteIds(favorites)
    setWeeklyStats(computeWeeklyStats(history))
  }, [user])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (functionalParams.startCircuit) {
      startCircuitSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [functionalParams.startCircuit])

  useAndroidBackHandler(
    useCallback(() => {
      if (sessionVisible) {
        setSessionVisible(false)
        setSessionConfig(null)
        return true
      }
      if (canGoBack()) return goBack()
      return false
    }, [sessionVisible, canGoBack, goBack]),
  )

  const filteredExercises = useMemo(
    () =>
      filterExercises({
        query,
        category: categoryFilter,
        difficulty: difficultyFilter,
        tab: segmentTab,
        favoriteIds,
      }),
    [query, categoryFilter, difficultyFilter, segmentTab, favoriteIds],
  )

  const categoryCounts = useMemo(
    () =>
      getCategoryCounts(
        filterExercises({
          query,
          category: 'all',
          difficulty: difficultyFilter,
          tab: segmentTab,
          favoriteIds,
        }),
      ),
    [query, difficultyFilter, segmentTab, favoriteIds],
  )

  function startCircuitSession() {
    const exercises = buildQuickWorkoutExercises()
    setSessionConfig({
      mode: 'circuit',
      workSec: 30,
      restSec: 10,
      exerciseIds: exercises.map((e) => e.id),
    })
    setSessionVisible(true)
  }

  async function handleToggleFavorite(exerciseId: string) {
    if (!user) return
    const next = await toggleFavoriteExerciseId(user.cpf, exerciseId)
    setFavoriteIds(next)
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }

  async function handleSessionCompleted(payload: {
    totalActiveSec: number
    exerciseIds: string[]
    mode: ExerciseTimerConfig['mode']
    durationSec: number
  }) {
    if (!user) return

    await saveWorkoutSession({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      patientCpf: user.cpf,
      exerciseIds: payload.exerciseIds,
      mode: payload.mode,
      durationSec: payload.durationSec,
      completedAtIso: new Date().toISOString(),
      totalActiveSec: payload.totalActiveSec,
    })

    await loadData()
  }

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

  return (
    <View style={styles.root}>
      <ImageBackground source={backgroundSource} style={styles.background} resizeMode="cover">
        <LinearGradient
          colors={['rgba(10, 10, 12, 0.55)', 'rgba(10, 10, 12, 0.92)', colors.background]}
          locations={[0, 0.35, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <ScreenStackHeader
          title="Treino Funcional"
          subtitle="21 exercícios guiados com timer e animações"
          paddingTop={insets.top + 8}
          onBack={() => {
            if (canGoBack()) goBack()
            else navigateTo('home')
          }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomContentPadding },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void handleRefresh()}
              tintColor={colors.primary}
            />
          }
        >
          <FunctionalWeeklyStatsCard stats={weeklyStats} />

          <View style={styles.sectionGap} />
          <FunctionalQuickWorkoutCard onStart={startCircuitSession} />

          <View style={styles.sectionGap} />
          <FunctionalSegmentTabs
            activeTab={segmentTab}
            favoritesCount={favoriteIds.length}
            onChange={setSegmentTab}
          />

          <View style={styles.sectionGapSm} />
          <FunctionalExerciseSearchBar value={query} onChange={setQuery} />

          <View style={styles.sectionGapSm} />
          <FunctionalCategoryFilterChips
            activeFilter={categoryFilter}
            counts={categoryCounts}
            onChange={setCategoryFilter}
          />

          <View style={styles.sectionGapSm} />
          <FunctionalDifficultyFilterChips
            activeFilter={difficultyFilter}
            onChange={setDifficultyFilter}
          />

          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {segmentTab === 'favorites' ? 'Seus favoritos' : 'Biblioteca de exercícios'}
            </Text>
            <Text style={styles.listCount}>{filteredExercises.length}</Text>
          </View>

          {filteredExercises.length === 0 ? (
            <FunctionalEmptyState tab={segmentTab} />
          ) : (
            <View style={styles.list}>
              {filteredExercises.map((exercise) => (
                <FunctionalExerciseListRow
                  key={exercise.id}
                  exercise={exercise}
                  isFavorite={favoriteIds.includes(exercise.id)}
                  onPress={() =>
                    navigateTo('functional-exercise', { exerciseId: exercise.id })
                  }
                  onToggleFavorite={() => void handleToggleFavorite(exercise.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>

        <BottomTabBar activeTab="home" onTabPress={handleTabPress} />
      </ImageBackground>

      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onLogoutPress={() => void logout()}
        userName={user?.name}
        selfieUri={user?.selfieUri}
      />

      <ExerciseSessionOverlay
        visible={sessionVisible}
        config={sessionConfig}
        onClose={() => {
          setSessionVisible(false)
          setSessionConfig(null)
        }}
        onCompleted={(payload) => void handleSessionCompleted(payload)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    gap: 0,
  },
  sectionGap: {
    height: 16,
  },
  sectionGapSm: {
    height: 12,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  listTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  listCount: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: 10,
  },
})
