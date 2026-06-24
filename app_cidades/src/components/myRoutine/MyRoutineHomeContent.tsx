import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'
import {
  MY_ROUTINE_SEGMENT_TABS,
  type MyRoutineOnboardingRecord,
  type MyRoutineTab,
} from '../../types/myRoutine'
import { RunWalkSegmentTabs } from '../runWalk/RunWalkSegmentTabs'
import {
  MyRoutineProfileProvider,
  MyRoutineProfileTabConnected,
} from './MyRoutineProfileProvider'
import { MyRoutineTodayShell } from './MyRoutineTodayShell'
import { MyRoutineWeekShell } from './MyRoutineWeekShell'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import type { ThemeColors } from '../../theme/palettes'

const MY_ROUTINE_SEGMENT_PAGES: MyRoutineTab[] = MY_ROUTINE_SEGMENT_TABS.map((tab) => tab.id)

type MyRoutineHomeContentProps = {
  bottomPadding: number
  patientCpf: string
  record: MyRoutineOnboardingRecord
  refreshKey?: number
  settingsVisible?: boolean
  onSettingsVisibleChange?: (visible: boolean) => void
}

export function MyRoutineHomeContent({
  bottomPadding,
  patientCpf,
  record,
  refreshKey = 0,
  settingsVisible = false,
  onSettingsVisibleChange,
}: MyRoutineHomeContentProps) {
  const styles = useThemedStyles(createStyles)
  const { width: screenWidth } = useWindowDimensions()
  const [segmentTab, setSegmentTab] = useState<MyRoutineTab>('today')
  const segmentPagerRef = useRef<FlatList<MyRoutineTab>>(null)
  const segmentPagerProgrammaticScrollRef = useRef(false)

  useAndroidBackHandler(
    useCallback(() => {
      if (settingsVisible) {
        onSettingsVisibleChange?.(false)
        return true
      }
      return false
    }, [onSettingsVisibleChange, settingsVisible]),
    settingsVisible,
  )

  const scrollSegmentPagerTo = useCallback(
    (tab: MyRoutineTab, animated = true) => {
      const index = MY_ROUTINE_SEGMENT_PAGES.indexOf(tab)
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
    (tab: MyRoutineTab) => {
      setSegmentTab(tab)
      scrollSegmentPagerTo(tab)
    },
    [scrollSegmentPagerTo],
  )

  const handleSegmentPagerIndexChange = useCallback(
    (nextIndex: number, options?: { haptic?: boolean }) => {
      const clampedIndex = Math.min(
        Math.max(nextIndex, 0),
        MY_ROUTINE_SEGMENT_PAGES.length - 1,
      )
      const nextTab = MY_ROUTINE_SEGMENT_PAGES[clampedIndex] ?? 'today'

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

  const renderSegmentPage = useCallback(
    (tab: MyRoutineTab) => {
      if (tab === 'today') {
        return (
          <MyRoutineTodayShell
            bottomPadding={bottomPadding}
            patientCpf={patientCpf}
            record={record}
            refreshKey={refreshKey}
          />
        )
      }

      if (tab === 'week') {
        return (
          <MyRoutineWeekShell
            bottomPadding={bottomPadding}
            patientCpf={patientCpf}
            record={record}
            refreshKey={refreshKey}
          />
        )
      }

      return (
        <MyRoutineProfileProvider
          bottomPadding={bottomPadding}
          patientCpf={patientCpf}
          record={record}
          refreshKey={refreshKey}
          settingsVisible={settingsVisible}
          onSettingsVisibleChange={onSettingsVisibleChange}
        >
          <MyRoutineProfileTabConnected bottomPadding={bottomPadding} />
        </MyRoutineProfileProvider>
      )
    },
    [
      bottomPadding,
      patientCpf,
      record,
      refreshKey,
      settingsVisible,
      onSettingsVisibleChange,
    ],
  )

  return (
    <View style={styles.root}>
      <RunWalkSegmentTabs
        activeTab={segmentTab}
        onChange={handleSegmentTabChange}
        tabs={MY_ROUTINE_SEGMENT_TABS}
      />

      <FlatList
        ref={segmentPagerRef}
        data={MY_ROUTINE_SEGMENT_PAGES}
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
            {renderSegmentPage(item)}
          </View>
        )}
      />
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  root: {
    flex: 1,
  },
  segmentPager: {
    flex: 1,
  },
  segmentPage: {
    flex: 1,
  },
}
}

