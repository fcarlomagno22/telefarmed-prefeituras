import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { PromoBanner } from '../config/promoBanners'
import { colors } from '../theme/colors'
import { SkeletonBone } from './SkeletonBone'

const HORIZONTAL_PADDING = 20
const CARD_HEIGHT = Math.round(208 * 0.7)
const BOTTOM_FADE_HEIGHT = Math.round(56 * 0.7)
const AUTO_PLAY_MS = 4500

type PromoCarouselProps = {
  banners: PromoBanner[]
  onGuestInteract?: () => void
  skeleton?: boolean
}

export function PromoCarousel({ banners, onGuestInteract, skeleton = false }: PromoCarouselProps) {
  const { width: screenWidth } = useWindowDimensions()
  const cardWidth = screenWidth - HORIZONTAL_PADDING * 2

  const listRef = useRef<FlatList<PromoBanner>>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const activeIndexRef = useRef(0)

  const scrollToIndex = useCallback(
    (index: number) => {
      if (banners.length === 0) return
      listRef.current?.scrollToOffset({
        offset: index * cardWidth,
        animated: true,
      })
    },
    [banners.length, cardWidth],
  )

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return

    const timer = setInterval(() => {
      const nextIndex = (activeIndexRef.current + 1) % banners.length
      scrollToIndex(nextIndex)
      activeIndexRef.current = nextIndex
      setActiveIndex(nextIndex)
    }, AUTO_PLAY_MS)

    return () => clearInterval(timer)
  }, [banners.length, isPaused, scrollToIndex])

  function handleMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetX = event.nativeEvent.contentOffset.x
    const nextIndex = Math.round(offsetX / cardWidth)
    activeIndexRef.current = nextIndex
    setActiveIndex(nextIndex)
    setIsPaused(false)
  }

  if (skeleton) {
    return (
      <View style={[styles.wrapper, { paddingHorizontal: HORIZONTAL_PADDING }]}>
        <View style={[styles.card, { width: cardWidth, height: CARD_HEIGHT }]}>
          <SkeletonBone width="100%" height={CARD_HEIGHT} borderRadius={20} />
          <View style={styles.dots}>
            {[0, 1, 2].map((index) => (
              <SkeletonBone key={index} width={index === 0 ? 18 : 6} height={6} borderRadius={3} />
            ))}
          </View>
        </View>
      </View>
    )
  }

  if (banners.length === 0) return null

  return (
    <View style={[styles.wrapper, { paddingHorizontal: HORIZONTAL_PADDING }]}>
      <View style={[styles.card, { width: cardWidth, height: CARD_HEIGHT }]}>
        <FlatList
          ref={listRef}
          data={banners}
          keyExtractor={(item) => item.id}
          horizontal
          nestedScrollEnabled
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={cardWidth}
          snapToAlignment="start"
          disableIntervalMomentum
          onScrollBeginDrag={() => setIsPaused(true)}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          getItemLayout={(_, index) => ({
            length: cardWidth,
            offset: cardWidth * index,
            index,
          })}
          renderItem={({ item }) => (
            <Pressable
              style={{ width: cardWidth, height: CARD_HEIGHT }}
              disabled={!onGuestInteract}
              onPress={onGuestInteract}
            >
              <Image
                source={item.source}
                style={styles.image}
                resizeMode="cover"
                accessibilityLabel={item.accessibilityLabel}
              />
            </Pressable>
          )}
        />

        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.55)']}
          style={[styles.bottomFade, { height: BOTTOM_FADE_HEIGHT }]}
          pointerEvents="none"
        />

        {banners.length > 1 ? (
          <View style={styles.dots}>
            {banners.map((banner, index) => (
              <Pressable
                key={banner.id}
                onPress={() => {
                  if (onGuestInteract) {
                    onGuestInteract()
                    return
                  }
                  setIsPaused(true)
                  scrollToIndex(index)
                  activeIndexRef.current = index
                  setActiveIndex(index)
                }}
                style={[styles.dot, index === activeIndex && styles.dotActive]}
                accessibilityRole="button"
                accessibilityLabel={`Ir para banner ${index + 1}`}
              />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
    marginBottom: 8,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.backgroundElevated,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  dotActive: {
    width: 18,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
})
