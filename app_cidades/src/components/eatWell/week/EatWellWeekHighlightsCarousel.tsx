import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import type { EatWellWeekHighlight } from '../../../types/eatWell'
import { colors } from '../../../theme/colors'

const CARD_WIDTH = 148
const CARD_HEIGHT = 112

type EatWellWeekHighlightsCarouselProps = {
  highlights: EatWellWeekHighlight[]
  onPressHighlight?: (highlight: EatWellWeekHighlight) => void
  onHorizontalScrollActive?: (active: boolean) => void
}

export function EatWellWeekHighlightsCarousel({
  highlights,
  onPressHighlight,
  onHorizontalScrollActive,
}: EatWellWeekHighlightsCarouselProps) {
  if (highlights.length === 0) return null

  function lockSegmentPager() {
    onHorizontalScrollActive?.(true)
  }

  function unlockSegmentPager() {
    onHorizontalScrollActive?.(false)
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Destaques da semana</Text>
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
        renderItem={({ item: highlight }) => (
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onPressHighlight?.(highlight)
            }}
            style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}
          >
            <LinearGradient
              colors={[`${highlight.accentColor}33`, 'rgba(14, 14, 20, 0.98)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <Text
                style={[styles.value, { color: highlight.accentColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {highlight.value}
              </Text>
              <Text style={styles.title} numberOfLines={2}>
                {highlight.title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {highlight.subtitle}
              </Text>
            </LinearGradient>
          </Pressable>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: 16,
  },
  row: {
    paddingHorizontal: 16,
    paddingRight: 24,
    gap: 10,
  },
  cardPressable: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  pressed: {
    opacity: 0.9,
  },
  card: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  value: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
    width: '100%',
  },
  title: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
})
