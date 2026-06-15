import { MaterialCommunityIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native'
import { getGuestWelcomeMessages } from '../config/guestFeatures'
import { colors } from '../theme/colors'
import { SkeletonBone } from './SkeletonBone'

const ROTATE_MS = 4800
const FADE_MS = 650

export function GuestWelcomeCard({ skeleton = false }: { skeleton?: boolean }) {
  const messages = getGuestWelcomeMessages()
  const [index, setIndex] = useState(0)
  const opacity = useRef(new Animated.Value(1)).current
  const scale = useRef(new Animated.Value(1)).current

  useEffect(() => {
    let active = true

    const timer = setInterval(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.98,
          duration: FADE_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished || !active) return

        setIndex((current) => (current + 1) % messages.length)

        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: FADE_MS,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: FADE_MS,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start()
      })
    }, ROTATE_MS)

    return () => {
      active = false
      clearInterval(timer)
    }
  }, [messages.length, opacity, scale])

  const message = messages[index]

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[
          'rgba(255, 133, 51, 0.42)',
          'rgba(255, 107, 0, 0.18)',
          'rgba(255, 255, 255, 0.06)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardBorder}
      >
        <View style={styles.cardInner}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFillObject} />
          ) : null}

          <LinearGradient
            colors={['rgba(28, 28, 36, 0.96)', 'rgba(14, 14, 20, 0.98)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {skeleton ? (
            <>
              <View style={styles.topRow}>
                <SkeletonBone width={44} height={44} borderRadius={14} />
                <View style={styles.titleCol}>
                  <SkeletonBone width="78%" height={14} borderRadius={6} />
                  <SkeletonBone width="62%" height={11} borderRadius={5} style={{ marginTop: 6 }} />
                </View>
              </View>

              <View style={styles.messageBlock}>
                <SkeletonBone width="84%" height={16} borderRadius={6} />
                <SkeletonBone width="100%" height={13} borderRadius={5} />
                <SkeletonBone width="92%" height={13} borderRadius={5} />
              </View>

              <View style={styles.dotsRow}>
                {messages.map((item) => (
                  <SkeletonBone key={item.headline} width={6} height={6} borderRadius={3} />
                ))}
              </View>
            </>
          ) : (
            <>
              <View style={styles.topRow}>
                <LinearGradient
                  colors={['#ffb366', '#ff8533', '#ff6b00']}
                  start={{ x: 0.2, y: 0 }}
                  end={{ x: 0.85, y: 1 }}
                  style={styles.iconOrb}
                >
                  <MaterialCommunityIcons name="heart-pulse" size={22} color="#fff" />
                </LinearGradient>

                <View style={styles.titleCol}>
                  <Text style={styles.cardTitle}>Bem-vindo ao Telefarmed</Text>
                  <Text style={styles.cardSubtitle}>Descubra o que o app pode fazer por você</Text>
                </View>
              </View>

              <Animated.View
                style={[
                  styles.messageBlock,
                  {
                    opacity,
                    transform: [{ scale }],
                  },
                ]}
              >
                <Text style={styles.headline}>{message.headline}</Text>
                <Text style={styles.body}>{message.body}</Text>
              </Animated.View>

              <View style={styles.dotsRow}>
                {messages.map((item, dotIndex) => (
                  <View
                    key={item.headline}
                    style={[styles.dot, dotIndex === index && styles.dotActive]}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    marginTop: 2,
    marginBottom: 4,
  },
  cardBorder: {
    borderRadius: 22,
    padding: 1,
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 10,
  },
  cardInner: {
    borderRadius: 21,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    minHeight: 148,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconOrb: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  titleCol: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
  messageBlock: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 64,
    gap: 6,
  },
  headline: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  body: {
    color: 'rgba(245, 245, 247, 0.78)',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  dotActive: {
    width: 18,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
})
