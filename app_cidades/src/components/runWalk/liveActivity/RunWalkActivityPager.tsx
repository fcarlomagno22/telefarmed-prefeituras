import { useCallback, useRef, useState } from 'react'
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import type { ActivityPrimaryMetric } from '../../../utils/runWalkActivityStats'
import { RunWalkActivityMainPage } from './RunWalkActivityMainPage'
import { RunWalkActivityPlaceholderPage } from './RunWalkActivityPlaceholderPage'

export type RunWalkActivityPageId = 'main' | 'stage' | 'map' | 'intensity'

type RunWalkActivityPagerProps = {
  primaryMetric: ActivityPrimaryMetric
  onTogglePrimaryMetric: () => void
  elapsedSeconds: number
  distanceKm: number
  heartRateBpm: number
  stepCount: number
  currentStepLabel: string
  currentPaceMinPerKm: number | null
  currentSpeedKmh: number | null
  trail: Array<{ latitude: number; longitude: number }>
  bottomInset: number
}

type ActivityPage = {
  id: RunWalkActivityPageId
  title: string
  icon: 'flag-checkered' | 'map-outline' | 'heart-pulse'
}

const PAGES: ActivityPage[] = [
  { id: 'main', title: 'Informações principais', icon: 'flag-checkered' },
  { id: 'stage', title: 'Etapa atual', icon: 'flag-checkered' },
  { id: 'map', title: 'Mapa', icon: 'map-outline' },
  { id: 'intensity', title: 'Intensidade', icon: 'heart-pulse' },
]

export function RunWalkActivityPager({
  primaryMetric,
  onTogglePrimaryMetric,
  elapsedSeconds,
  distanceKm,
  heartRateBpm,
  stepCount,
  currentStepLabel,
  currentPaceMinPerKm,
  currentSpeedKmh,
  trail,
  bottomInset,
}: RunWalkActivityPagerProps) {
  const { width: screenWidth } = useWindowDimensions()
  const listRef = useRef<FlatList<ActivityPage>>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x
      const nextIndex = Math.round(offsetX / screenWidth)
      setActiveIndex(nextIndex)
    },
    [screenWidth],
  )

  function renderPage({ item }: { item: ActivityPage }) {
    if (item.id === 'main') {
      return (
        <View style={{ width: screenWidth, flex: 1 }}>
          <RunWalkActivityMainPage
            primaryMetric={primaryMetric}
            onTogglePrimaryMetric={onTogglePrimaryMetric}
            elapsedSeconds={elapsedSeconds}
            distanceKm={distanceKm}
            heartRateBpm={heartRateBpm}
            stepCount={stepCount}
            currentStepLabel={currentStepLabel}
            currentPaceMinPerKm={currentPaceMinPerKm}
            currentSpeedKmh={currentSpeedKmh}
            trail={trail}
            bottomInset={bottomInset}
          />
        </View>
      )
    }

    return (
      <View style={{ width: screenWidth, flex: 1 }}>
        <RunWalkActivityPlaceholderPage title={item.title} icon={item.icon} />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={PAGES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        renderItem={renderPage}
      />

      <View style={[styles.dots, { paddingBottom: Math.max(bottomInset, 8) }]}>
        {PAGES.map((page, index) => (
          <View
            key={page.id}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#22c55e',
  },
})
