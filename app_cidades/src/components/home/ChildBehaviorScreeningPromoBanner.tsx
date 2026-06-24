import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'

type ChildBehaviorScreeningPromoBannerProps = {
  width: number
  height: number
}

const AUTISM_COLORS = {
  blue: '#00AEEF',
  red: '#ED1C24',
  yellow: '#FFD100',
  teal: '#00B5AD',
  purple: '#9B59B6',
  green: '#2ECC71',
} as const

const RAINBOW_STRIPE = [
  AUTISM_COLORS.red,
  AUTISM_COLORS.yellow,
  AUTISM_COLORS.green,
  AUTISM_COLORS.blue,
  AUTISM_COLORS.purple,
] as const

export function ChildBehaviorScreeningPromoBanner({
  width,
  height,
}: ChildBehaviorScreeningPromoBannerProps) {
  return (
    <View style={[styles.root, { width, height }]}>
      <LinearGradient
        colors={['#0D1B3E', '#152A55', '#1E3A6E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.rainbowBar}>
        {RAINBOW_STRIPE.map((color) => (
          <View key={color} style={[styles.rainbowSegment, { backgroundColor: color }]} />
        ))}
      </View>

      <View style={styles.body}>
        <View style={styles.copy}>
          <View style={styles.badge}>
            <View style={[styles.badgeDot, { backgroundColor: AUTISM_COLORS.teal }]} />
            <Text style={styles.badgeText}>Triagem infantil</Text>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            Como está o foco do seu filho?
          </Text>

          <Text style={styles.subtitle} numberOfLines={2}>
            Questionário rápido sobre atenção e comportamento para orientar pais.
          </Text>

          <View style={styles.footer}>
            <View style={styles.tags}>
              <View style={[styles.tag, { backgroundColor: AUTISM_COLORS.blue }]}>
                <Text style={styles.tagText}>Atenção</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: AUTISM_COLORS.yellow }]}>
                <Text style={[styles.tagText, styles.tagTextDark]}>Comportamento</Text>
              </View>
            </View>

            <LinearGradient
              colors={[AUTISM_COLORS.teal, AUTISM_COLORS.blue]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>~5 min</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.art}>
          <View style={styles.infinity}>
            <View
              style={[
                styles.infinityLoop,
                { borderColor: AUTISM_COLORS.red, left: 0 },
              ]}
            />
            <View
              style={[
                styles.infinityLoop,
                { borderColor: AUTISM_COLORS.blue, right: 0 },
              ]}
            />
          </View>

          <View style={styles.puzzleGrid}>
            <View style={[styles.puzzle, { backgroundColor: AUTISM_COLORS.red }]} />
            <View style={[styles.puzzle, { backgroundColor: AUTISM_COLORS.yellow }]} />
            <View style={[styles.puzzle, { backgroundColor: AUTISM_COLORS.blue }]} />
            <View style={[styles.puzzle, { backgroundColor: AUTISM_COLORS.teal }]} />
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  rainbowBar: {
    flexDirection: 'row',
    height: 4,
    width: '100%',
  },
  rainbowSegment: {
    flex: 1,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 26,
    gap: 8,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    color: '#E8F4FF',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 17,
  },
  subtitle: {
    color: 'rgba(232, 244, 255, 0.88)',
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 6,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  tagTextDark: {
    color: '#1A2B4A',
  },
  cta: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    flexShrink: 0,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  art: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexShrink: 0,
  },
  infinity: {
    width: 36,
    height: 18,
    position: 'relative',
  },
  infinityLoop: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    top: 0,
  },
  puzzleGrid: {
    width: 34,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
  },
  puzzle: {
    width: 15,
    height: 15,
    borderRadius: 4,
  },
})
