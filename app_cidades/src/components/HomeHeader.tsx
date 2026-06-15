import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { appEnv } from '../config/env'
import { colors } from '../theme/colors'
import { resolveBrandImage } from '../utils/resolveBrandImage'
import { ProfileAvatar } from './profile/ProfileAvatar'
import { SkeletonBone } from './SkeletonBone'

const logoSource = resolveBrandImage(appEnv.logoUrl, 'logo.png')

const HEADER_GRADIENT = [
  'rgba(36, 36, 46, 0.82)',
  'rgba(16, 16, 22, 0.97)',
] as const

type HomeHeaderProps = {
  isAuthenticated: boolean
  userName?: string
  selfieUri?: string | null
  municipalityName?: string
  onAuthPress?: () => void
  skeleton?: boolean
}

export function HomeHeader({
  isAuthenticated,
  userName,
  selfieUri,
  municipalityName = appEnv.municipalityName,
  onAuthPress,
  skeleton = false,
}: HomeHeaderProps) {
  const insets = useSafeAreaInsets()
  const firstName = userName?.trim().split(/\s+/)[0]
  const greeting = firstName ? `Olá, ${firstName}!` : 'Olá!'

  const profileContent = skeleton ? (
    <>
      <SkeletonBone width={AVATAR_SIZE} height={AVATAR_SIZE} borderRadius={AVATAR_SIZE / 2} />
      <View style={styles.textCol}>
        <SkeletonBone width="72%" height={18} borderRadius={6} />
        <SkeletonBone width="54%" height={12} borderRadius={5} style={{ marginTop: 6 }} />
      </View>
    </>
  ) : (
    <>
      {isAuthenticated ? (
        <ProfileAvatar selfieUri={selfieUri} />
      ) : (
        <View style={[styles.avatarRing, styles.avatarRingEmpty]}>
          <View style={styles.avatarFallback}>
            <Ionicons name="person-outline" size={22} color={colors.primaryLight} />
          </View>
        </View>
      )}

      <View style={styles.textCol}>
        {isAuthenticated ? (
          <>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.brandLine} numberOfLines={1}>
              <Text style={styles.brandMuted}>Telefarmed </Text>
              <Text style={styles.brandCity}>{municipalityName}</Text>
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.guestGreeting} numberOfLines={1}>
              Entre ou Cadastre-se
            </Text>
            <Text style={styles.guestSubtitle}>aproveite o app completo</Text>
          </>
        )}
      </View>
    </>
  )

  const profileBlock = skeleton ? (
    <View style={styles.profileBlock}>{profileContent}</View>
  ) : isAuthenticated ? (
    <View style={styles.profileBlock}>{profileContent}</View>
  ) : (
    <Pressable
      onPress={onAuthPress}
      style={({ pressed }) => [
        styles.profileBlock,
        styles.profileBlockPressable,
        pressed && styles.profileBlockPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Entre ou Cadastre-se"
    >
      {profileContent}
    </Pressable>
  )

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[...HEADER_GRADIENT]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[
          styles.shell,
          {
            paddingTop: Math.max(insets.top, 12) + 8,
          },
        ]}
      >
        <View style={styles.row}>
          {profileBlock}

          <View style={styles.logoWrap}>
            <Image source={logoSource} style={styles.logo} resizeMode="contain" />
          </View>
        </View>
      </LinearGradient>
    </View>
  )
}

const AVATAR_SIZE = 52

const styles = StyleSheet.create({
  wrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 14,
  },
  shell: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  profileBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  profileBlockPressable: {
    borderRadius: 16,
  },
  profileBlockPressed: {
    opacity: 0.88,
  },
  textCol: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  greeting: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  guestGreeting: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 18,
  },
  guestSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
  },
  brandLine: {
    marginTop: 2,
  },
  brandMuted: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  brandCity: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  avatarRingEmpty: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 133, 51, 0.35)',
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    width: 108,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
})
