import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { colors } from '../../../theme/colors'
import type { RunWalkHistoryHighlight } from '../../../types/runWalkHistory'

type RunWalkHistoryHighlightsRowProps = {
  highlights: RunWalkHistoryHighlight[]
  animate?: boolean
  preserveFinal?: boolean
  onPress?: (highlight: RunWalkHistoryHighlight) => void
  onHorizontalScrollActive?: (active: boolean) => void
}

function HighlightCard({
  highlight,
  animate,
  preserveFinal,
  index,
  onPress,
}: {
  highlight: RunWalkHistoryHighlight
  animate: boolean
  preserveFinal: boolean
  index: number
  onPress?: () => void
}) {
  const opacity = useRef(new Animated.Value(animate ? 0 : preserveFinal ? 1 : 0)).current
  const translateY = useRef(new Animated.Value(animate ? 14 : 0)).current
  const fill = useRef(new Animated.Value(animate ? 0 : preserveFinal ? 1 : 0)).current

  useEffect(() => {
    if (!animate) {
      opacity.setValue(preserveFinal ? 1 : 0)
      translateY.setValue(0)
      fill.setValue(preserveFinal ? 1 : 0)
      return
    }

    opacity.setValue(0)
    translateY.setValue(14)
    fill.setValue(0)

    const delay = index * 120

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fill, {
        toValue: 1,
        duration: 1400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
  }, [animate, fill, index, opacity, preserveFinal, translateY])

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onPress?.()
        }}
        style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={[`${highlight.accent}22`, 'rgba(14, 14, 20, 0.96)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Text style={[styles.cardTitle, { color: highlight.accent }]}>{highlight.title}</Text>
          <Text style={styles.cardValue}>{highlight.value}</Text>
          <Text style={styles.cardSubtitle}>{highlight.subtitle}</Text>

          <View style={styles.fillTrack}>
            <Animated.View
              style={[
                styles.fillBar,
                {
                  backgroundColor: highlight.accent,
                  transform: [{ scaleX: fill }],
                },
              ]}
            />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  )
}

export function RunWalkHistoryHighlightsRow({
  highlights,
  animate = false,
  preserveFinal = true,
  onPress,
  onHorizontalScrollActive,
}: RunWalkHistoryHighlightsRowProps) {
  if (highlights.length === 0) return null

  function lockSegmentPager() {
    onHorizontalScrollActive?.(true)
  }

  function unlockSegmentPager() {
    onHorizontalScrollActive?.(false)
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Destaques pessoais</Text>
      <FlatList
        horizontal
        data={highlights}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        directionalLockEnabled
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentContainerStyle={styles.row}
        onScrollBeginDrag={lockSegmentPager}
        onScrollEndDrag={unlockSegmentPager}
        onMomentumScrollEnd={unlockSegmentPager}
        onTouchCancel={unlockSegmentPager}
        renderItem={({ item: highlight, index }) => (
          <HighlightCard
            highlight={highlight}
            animate={animate}
            preserveFinal={preserveFinal}
            index={index}
            onPress={() => onPress?.(highlight)}
          />
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  title: {
    marginHorizontal: 16,
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  row: {
    paddingHorizontal: 16,
    paddingRight: 24,
    gap: 10,
  },
  cardPressable: {
    width: 168,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 112,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  cardValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    textAlign: 'center',
  },
  fillTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  fillBar: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    opacity: 0.85,
  },
  pressed: {
    opacity: 0.88,
  },
})
