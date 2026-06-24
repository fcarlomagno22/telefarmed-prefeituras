import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { MenuDrawer } from '../components/MenuDrawer'
import { NeonSectionDivider } from '../components/NeonSectionDivider'
import { RunWalkAchievementsCategorySection } from '../components/runWalk/achievements/RunWalkAchievementsCategorySection'
import { RunWalkAchievementsHero } from '../components/runWalk/achievements/RunWalkAchievementsHero'
import { RunWalkAchievementsSpotlight } from '../components/runWalk/achievements/RunWalkAchievementsSpotlight'
import { RunWalkAchievementsUpcoming } from '../components/runWalk/achievements/RunWalkAchievementsUpcoming'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { useAuth } from '../contexts/AuthContext'
import { useGuestAuth } from '../contexts/GuestAuthContext'
import { MOCK_RUN_WALK_ACHIEVEMENTS } from '../data/mockRunWalkAchievements'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'
import {
  getAchievementStats,
  getRecentUnlockedAchievements,
  getUpcomingAchievements,
  groupAchievementsByCategory,
} from '../utils/runWalkAchievementsUtils'

const TAB_BAR_ESTIMATED_HEIGHT = 78

export function RunWalkAchievementsScreen() {
  const insets = useSafeAreaInsets()
  const { user, goBack, navigateTo, logout } = useAuth()
  const { requireAuth } = useGuestAuth()
  const [menuVisible, setMenuVisible] = useState(false)

  const bottomContentPadding = TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 16

  useAndroidBackHandler(
    useCallback(() => {
      if (menuVisible) {
        setMenuVisible(false)
        return true
      }

      goBack()
      return true
    }, [goBack, menuVisible]),
  )

  const stats = useMemo(() => getAchievementStats(MOCK_RUN_WALK_ACHIEVEMENTS), [])
  const recentUnlocked = useMemo(
    () => getRecentUnlockedAchievements(MOCK_RUN_WALK_ACHIEVEMENTS).slice(0, 5),
    [],
  )
  const upcoming = useMemo(() => getUpcomingAchievements(MOCK_RUN_WALK_ACHIEVEMENTS), [])
  const categoryGroups = useMemo(
    () => groupAchievementsByCategory(MOCK_RUN_WALK_ACHIEVEMENTS),
    [],
  )

  function handleAchievementPress(achievementId: string) {
    requireAuth('vida:run-walk', () => {
      navigateTo('run-walk-achievement-detail', { achievementId })
    })
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

  function handleLogout() {
    setMenuVisible(false)
    logout()
  }

  return (
    <>
      <View style={styles.root}>
        <LinearGradient
          colors={['#0a0a0c', '#12101a', '#0a0a0c']}
          style={StyleSheet.absoluteFill}
        />

        <LinearGradient
          colors={['rgba(251, 191, 36, 0.16)', 'transparent', 'rgba(139, 92, 246, 0.12)']}
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <LinearGradient
          colors={['rgba(236, 72, 153, 0.08)', 'transparent', 'transparent']}
          locations={[0, 0.35, 1]}
          style={styles.topGlow}
          pointerEvents="none"
        />

        <ScreenStackHeader
          title="Conquistas"
          subtitle={`${stats.unlockedCount} desbloqueadas · ${stats.total} medalhas`}
          paddingTop={Math.max(insets.top, 12) + 8}
          onBack={goBack}
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomContentPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <RunWalkAchievementsHero
            unlockedCount={stats.unlockedCount}
            totalCount={stats.total}
            lockedCount={stats.lockedCount}
            categoryCount={categoryGroups.length}
          />

          <RunWalkAchievementsSpotlight
            achievements={recentUnlocked}
            onPress={handleAchievementPress}
          />

          <RunWalkAchievementsUpcoming
            achievements={upcoming}
            onPress={handleAchievementPress}
          />

          <NeonSectionDivider embedded style={styles.sectionDivider} />

          <View style={styles.trailsHeader}>
            <View style={styles.trailsLine} />
            <Text style={styles.trailsTitle}>Trilhas de medalhas</Text>
            <Text style={styles.trailsSubtitle}>
              Explore por tema e veja o que falta desbloquear
            </Text>
          </View>

          <View style={styles.categorySections}>
            {categoryGroups.map((group, index) => (
              <View key={group.id} style={styles.categoryBlock}>
                <RunWalkAchievementsCategorySection
                  group={group}
                  onPress={handleAchievementPress}
                />
                {index < categoryGroups.length - 1 ? (
                  <NeonSectionDivider embedded style={styles.categoryDivider} />
                ) : null}
              </View>
            ))}
          </View>

          <NeonSectionDivider embedded style={styles.footerDivider} />
        </ScrollView>

        <BottomTabBar activeTab={null} onTabPress={handleTabPress} />
      </View>

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
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 18,
  },
  sectionDivider: {
    marginTop: 4,
    marginBottom: 2,
  },
  trailsHeader: {
    gap: 4,
    paddingHorizontal: 4,
  },
  trailsLine: {
    width: 42,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#f59e0b',
    marginBottom: 2,
  },
  trailsTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  trailsSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  categorySections: {
    gap: 4,
  },
  categoryBlock: {
    gap: 14,
  },
  categoryDivider: {
    marginTop: 2,
  },
  footerDivider: {
    marginTop: 6,
  },
})
