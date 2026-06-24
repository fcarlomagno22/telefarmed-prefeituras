import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  BIBLE_VISIBLE_SEGMENT_PAGES,
  BIBLE_VISIBLE_SEGMENT_TABS,
  BIBLE_UNDER_CONSTRUCTION_COPY,
  resolveVisibleBibleSegmentTab,
  type BibleTab,
} from '../../types/bible'
import { RunWalkSegmentTabs } from '../runWalk/RunWalkSegmentTabs'
import { SpiritualModuleFab } from '../spiritual/SpiritualModuleFab'
import { useAuth } from '../../contexts/AuthContext'
import { getBibleRouteParams } from '../../types/auth'
import { BibleHolyBibleTab } from './BibleHolyBibleTab'
import { BibleNotesTab } from './BibleNotesTab'
import { BiblePeaceWordsTab } from './BiblePeaceWordsTab'
import { BibleUnderConstructionTab } from './BibleUnderConstructionTab'

const TAB_BAR_ESTIMATED_HEIGHT = 78

type BibleHomeContentProps = {
  onOpenMentalHealth: () => void
}

export function BibleHomeContent({ onOpenMentalHealth }: BibleHomeContentProps) {
  const insets = useSafeAreaInsets()
  const { routeParams, navigateTo } = useAuth()
  const { segmentTab: segmentTabParam } = getBibleRouteParams(routeParams)
  const { width: screenWidth } = useWindowDimensions()
  const [segmentTab, setSegmentTab] = useState<BibleTab>(
    resolveVisibleBibleSegmentTab(segmentTabParam),
  )
  const segmentPagerRef = useRef<FlatList<BibleTab>>(null)
  const segmentPagerProgrammaticScrollRef = useRef(false)

  const fabBottom = TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 12
  const bottomPadding = fabBottom + 72

  const persistSegmentTab = useCallback(
    (tab: BibleTab) => {
      const { peaceWordsExpandedCategoryId } = getBibleRouteParams(routeParams)
      navigateTo('bible', {
        segmentTab: tab,
        ...(tab === 'peace-words' && peaceWordsExpandedCategoryId
          ? { peaceWordsExpandedCategoryId }
          : {}),
      })
    },
    [navigateTo, routeParams],
  )

  const scrollSegmentPagerTo = useCallback(
    (tab: BibleTab, animated = true) => {
      const visibleTab = resolveVisibleBibleSegmentTab(tab)
      const index = BIBLE_VISIBLE_SEGMENT_PAGES.indexOf(visibleTab)
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

  useEffect(() => {
    const nextTab = resolveVisibleBibleSegmentTab(segmentTabParam)
    setSegmentTab(nextTab)
    scrollSegmentPagerTo(nextTab, false)
  }, [scrollSegmentPagerTo, segmentTabParam])

  const handleSegmentTabChange = useCallback(
    (tab: BibleTab) => {
      const visibleTab = resolveVisibleBibleSegmentTab(tab)
      setSegmentTab(visibleTab)
      scrollSegmentPagerTo(visibleTab)
      persistSegmentTab(visibleTab)
    },
    [persistSegmentTab, scrollSegmentPagerTo],
  )

  const handleSegmentPagerIndexChange = useCallback(
    (nextIndex: number, options?: { haptic?: boolean }) => {
      const clampedIndex = Math.min(
        Math.max(nextIndex, 0),
        BIBLE_VISIBLE_SEGMENT_PAGES.length - 1,
      )
      const nextTab = BIBLE_VISIBLE_SEGMENT_PAGES[clampedIndex] ?? 'holy-bible'

      setSegmentTab((current) => {
        if (current === nextTab) return current
        if (options?.haptic) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }
        persistSegmentTab(nextTab)
        return nextTab
      })
    },
    [persistSegmentTab],
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

  const renderSegmentPage = useCallback(
    (tab: BibleTab) => {
      if (tab === 'holy-bible') {
        return (
          <BibleHolyBibleTab
            bottomPadding={bottomPadding}
            onSelectBook={(book) => navigateTo('bible-chapters', { bookAbbrev: book.abbrev })}
          />
        )
      }

      if (tab === 'peace-words') {
        return (
          <BiblePeaceWordsTab
            bottomPadding={bottomPadding}
            onSelectTopic={(topicId) => navigateTo('bible-peace-words-topic', { topicId })}
          />
        )
      }

      if (tab === 'notes') {
        return (
          <BibleNotesTab
            bottomPadding={bottomPadding}
            isActive={segmentTab === 'notes'}
            onOpenHighlight={(bookAbbrev, chapter, verse) =>
              navigateTo('bible-chapter-verses', { bookAbbrev, chapter, verse })
            }
          />
        )
      }

      const copy = BIBLE_UNDER_CONSTRUCTION_COPY[tab]
      return (
        <BibleUnderConstructionTab
          bottomPadding={bottomPadding}
          title={copy.title}
          subtitle={copy.subtitle}
        />
      )
    },
    [bottomPadding, navigateTo, segmentTab],
  )

  return (
    <View style={styles.root}>
      <RunWalkSegmentTabs
        activeTab={segmentTab}
        onChange={handleSegmentTabChange}
        tabs={BIBLE_VISIBLE_SEGMENT_TABS}
      />

      <FlatList
        ref={segmentPagerRef}
        data={BIBLE_VISIBLE_SEGMENT_PAGES}
        keyExtractor={(item) => item}
        horizontal
        pagingEnabled
        scrollEnabled
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
          <View style={[styles.segmentPage, { width: screenWidth }]}>{renderSegmentPage(item)}</View>
        )}
      />

      <SpiritualModuleFab
        bottom={fabBottom}
        variant="mental-health"
        onPress={onOpenMentalHealth}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  segmentPager: {
    flex: 1,
  },
  segmentPage: {
    flex: 1,
  },
})
