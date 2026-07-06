import { LinearGradient } from 'expo-linear-gradient'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import type { ThemeColors } from '../../theme/palettes'

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
  const styles = useThemedStyles(createStyles)

  return (
    <View style={[styles.root, { width, height }]}>
      <Image source={source} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors />

      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.78)',
          'rgba(255, 255, 255, 0.08)',
          'rgba(245, 245, 247, 0.88)',
        ]}
        locations={[0, 0.45, 1]}
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      overflow: 'hidden',
      backgroundColor: colors.backgroundElevated,
    },
    image: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
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
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    eyebrowDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    eyebrowText: {
      color: colors.text,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    title: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.2,
      lineHeight: 18,
      textShadowColor: 'rgba(255, 255, 255, 0.85)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 6,
    },
  })
}
