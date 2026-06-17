import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useState } from 'react'
import {
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ActionToast } from '../components/ActionToast'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { MenuDrawer } from '../components/MenuDrawer'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { SleepStoryReaderDrawer } from '../components/sleepStories/SleepStoryReaderDrawer'
import { SleepStoriesFilterDrawer } from '../components/sleepStories/SleepStoriesFilterDrawer'
import { SleepStoryListItem } from '../components/sleepStories/SleepStoryListItem'
import { SleepStoryRandomDrawOverlay } from '../components/sleepStories/SleepStoryRandomDrawOverlay'
import { SLEEP_STORIES, getSleepStoryCategoryById } from '../config/sleepStories'
import { hasSleepStoryContent } from '../config/sleepStoryContents'
import {
  loadReadSleepStoryIds,
  setSleepStoryRead,
} from '../data/sleepStoriesReadStorage'
import { appEnv } from '../config/env'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'
import type { SleepStory, SleepStoryCategoryId, SleepStoryId } from '../types/sleepStories'
import { filterSleepStories } from '../utils/sleepStoriesFilter'
import { resolveBrandImage } from '../utils/resolveBrandImage'

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')
const TAB_BAR_ESTIMATED_HEIGHT = 78
const TOOLBAR_ACTION_SIZE = 38

export function SleepStoriesScreen() {
  const insets = useSafeAreaInsets()
  const { user, navigateTo, goBack, canGoBack, logout } = useAuth()

  const [menuVisible, setMenuVisible] = useState(false)
  const [filterVisible, setFilterVisible] = useState(false)
  const [randomDrawVisible, setRandomDrawVisible] = useState(false)
  const [randomDrawKey, setRandomDrawKey] = useState(0)
  const [readStoryIds, setReadStoryIds] = useState<Set<SleepStoryId>>(new Set())
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState<SleepStoryCategoryId | null>(null)
  const [readingStoryId, setReadingStoryId] = useState<SleepStoryId | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadReadSleepStoryIds().then(setReadStoryIds)
  }, [])

  const headerPaddingTop = Math.max(insets.top, 12) + 8
  const bottomContentPadding = TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 16

  const filteredStories = useMemo(
    () => filterSleepStories(SLEEP_STORIES, query, categoryId),
    [query, categoryId],
  )

  const filterActive = query.trim().length > 0 || categoryId != null
  const selectedCategory = categoryId ? getSleepStoryCategoryById(categoryId) : null
  const readCount = useMemo(
    () => SLEEP_STORIES.filter((story) => readStoryIds.has(story.id)).length,
    [readStoryIds],
  )

  function handleBack() {
    if (canGoBack()) {
      goBack()
      return
    }
    navigateTo('sleep-time')
  }

  function handleTabPress(tab: BottomTabId) {
    if (tab === 'menu') {
      setMenuVisible(true)
      return
    }

    setMenuVisible(false)

    if (tab === 'home') navigateTo('home')
    else if (tab === 'my-metrics') navigateTo('my-metrics')
    else if (tab === 'agendar') navigateTo('schedule-appointment')
    else if (tab === 'pos-consulta') navigateTo('post-consultation')
  }

  function handleStoryPress(story: SleepStory) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    if (!hasSleepStoryContent(story.id)) {
      setToastMessage('Texto completo em breve.')
      return
    }

    setReadingStoryId(story.id)
    if (!readStoryIds.has(story.id)) {
      void setSleepStoryRead(story.id, true, readStoryIds).then(setReadStoryIds)
    }
  }

  function handleCloseReader() {
    setReadingStoryId(null)
  }

  function handleOpenStoryFromDraw(story: SleepStory) {
    setRandomDrawVisible(false)
    handleStoryPress(story)
  }

  function handleToggleRead(story: SleepStory) {
    const nextRead = !readStoryIds.has(story.id)
    void Haptics.selectionAsync()
    void setSleepStoryRead(story.id, nextRead, readStoryIds).then(setReadStoryIds)
  }

  function handleOpenRandomDraw() {
    if (filteredStories.length === 0) {
      setToastMessage('Nenhuma história disponível com os filtros atuais.')
      return
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setRandomDrawKey((current) => current + 1)
    setRandomDrawVisible(true)
  }

  function handleShuffleAgain() {
    setRandomDrawKey((current) => current + 1)
  }

  function handleClearFilters() {
    setQuery('')
    setCategoryId(null)
  }

  useAndroidBackHandler(() => {
    if (readingStoryId) {
      setReadingStoryId(null)
      return true
    }
    if (randomDrawVisible) {
      setRandomDrawVisible(false)
      return true
    }
    if (filterVisible) {
      setFilterVisible(false)
      return true
    }
    if (menuVisible) {
      setMenuVisible(false)
      return true
    }
    handleBack()
    return true
  })

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
          title="Histórias para dormir"
          subtitle={`${readCount} de ${SLEEP_STORIES.length} lidas`}
          paddingTop={headerPaddingTop}
          onBack={handleBack}
        />

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={colors.textSubtle} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar história..."
              placeholderTextColor={colors.textSubtle}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>

          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setFilterVisible(true)
            }}
            style={({ pressed }) => [styles.iconAction, pressed && styles.filterButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Filtrar por categoria"
          >
            <Ionicons name="options-outline" size={17} color="#c7d2fe" />
            {categoryId != null ? <View style={styles.filterDot} /> : null}
          </Pressable>

          <Pressable
            onPress={handleOpenRandomDraw}
            style={({ pressed }) => [styles.iconAction, pressed && styles.filterButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Sortear história"
          >
            <Ionicons name="shuffle-outline" size={16} color={colors.textSubtle} />
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.resultCount}>
            {filteredStories.length} história{filteredStories.length === 1 ? '' : 's'}
          </Text>
          {filterActive ? (
            <Pressable
              onPress={handleClearFilters}
              style={({ pressed }) => [styles.clearFiltersBtn, pressed && styles.filterButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Limpar filtros"
            >
              <Text style={styles.clearFiltersText}>Limpar</Text>
            </Pressable>
          ) : null}
        </View>

        {filterActive ? (
          <View style={styles.activeFiltersRow}>
            {selectedCategory ? (
              <View style={[styles.activeFilterChip, styles.activeFilterChipCategory]}>
                <View
                  style={[styles.activeFilterDot, { backgroundColor: selectedCategory.gradient[1] }]}
                />
                <Text style={styles.activeFilterChipText} numberOfLines={1}>
                  {selectedCategory.label}
                </Text>
              </View>
            ) : null}
            {query.trim() ? (
              <View style={styles.activeFilterChip}>
                <Ionicons name="search" size={11} color={colors.textSubtle} />
                <Text style={styles.activeFilterChipText} numberOfLines={1}>
                  {query.trim()}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <FlatList
          data={filteredStories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomContentPadding },
            filteredStories.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={28} color={colors.textSubtle} />
              <Text style={styles.emptyTitle}>Nenhuma história encontrada</Text>
              <Text style={styles.emptySubtitle}>
                Tente outra busca ou escolha uma categoria diferente.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <SleepStoryListItem
              story={item}
              isRead={readStoryIds.has(item.id)}
              onPress={handleStoryPress}
              onToggleRead={handleToggleRead}
            />
          )}
        />

        <BottomTabBar activeTab={null} onTabPress={handleTabPress} />
      </View>

      <SleepStoryRandomDrawOverlay
        key={randomDrawKey}
        visible={randomDrawVisible}
        stories={filteredStories}
        shuffleKey={randomDrawKey}
        onClose={() => setRandomDrawVisible(false)}
        onStoryPress={handleOpenStoryFromDraw}
        onShuffleAgain={handleShuffleAgain}
      />

      <SleepStoryReaderDrawer
        visible={readingStoryId != null}
        storyId={readingStoryId}
        onClose={handleCloseReader}
      />

      <SleepStoriesFilterDrawer
        visible={filterVisible}
        query={query}
        selectedCategoryId={categoryId}
        onQueryChange={setQuery}
        onCategoryChange={setCategoryId}
        onClose={() => setFilterVisible(false)}
      />

      <MenuDrawer
        visible={menuVisible}
        userName={user?.name}
        selfieUri={user?.selfieUri}
        onClose={() => setMenuVisible(false)}
        onLogoutPress={() => void logout()}
      />

      <ActionToast message={toastMessage} onHidden={() => setToastMessage(null)} />
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
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flex: 1,
    height: TOOLBAR_ACTION_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  searchInput: {
    flex: 1,
    height: TOOLBAR_ACTION_SIZE,
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
    margin: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  iconAction: {
    position: 'relative',
    width: TOOLBAR_ACTION_SIZE,
    height: TOOLBAR_ACTION_SIZE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterButtonPressed: {
    opacity: 0.86,
  },
  filterDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#a5b4fc',
  },
  resultCount: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  activeFilterChip: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeFilterChipCategory: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  activeFilterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeFilterChipText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  clearFiltersBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  clearFiltersText: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingTop: 0,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
  },
})
