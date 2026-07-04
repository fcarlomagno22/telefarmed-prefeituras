import { LinearGradient } from 'expo-linear-gradient'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'

type ThemedPromoImageBannerProps = {
  width: number
  height: number
  source: ImageSourcePropType
  eyebrow: string
  title: string
  accentColor?: string
}

export function ThemedPromoImageBanner({
  width,
  height,
  source,
  eyebrow,
  title,
  accentColor = '#f97316',
}: ThemedPromoImageBannerProps) {
  return (
    <View style={[styles.root, { width, height }]}>
      <Image source={source} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors />

      <View style={styles.tint} pointerEvents="none" />

      <LinearGradient
        colors={['rgba(10, 10, 12, 0.08)', 'transparent', 'rgba(10, 10, 12, 0.72)']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <View style={styles.copy} pointerEvents="none">
        <View style={styles.eyebrow}>
          <View style={[styles.eyebrowDot, { backgroundColor: accentColor }]} />
          <Text style={styles.eyebrowText}>{eyebrow}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
    backgroundColor: '#14141a',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 12, 0.14)',
  },
  copy: {
    position: 'absolute',
    left: 14,
    right: '38%',
    bottom: 28,
    gap: 4,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eyebrowText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
})
