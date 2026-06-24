import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  ImageSourcePropType,
  ImageStyle,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import { AppModal } from '../AppModal'
import { StoredAppointment } from '../../types/myAppointments'
import { NavigationApp } from '../../utils/appointmentMaps'

const SHEET_OFFSET = 420

const googleMapsLogo = require('../../../assets/google-map-icon.svg')
const wazeLogo = require('../../../assets/svgviewer-output.svg')

type AppointmentDirectionsDrawerProps = {
  visible: boolean
  appointment: StoredAppointment | null
  onClose: () => void
  onSelectApp: (app: NavigationApp) => void
}

type NavigationOptionProps = {
  label: string
  logo: ImageSourcePropType
  logoStyle: ImageStyle
  onPress: () => void
}

function NavigationOption({ label, logo, logoStyle, onPress }: NavigationOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.logoButton, pressed && styles.logoButtonPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Abrir rota no ${label}`}
    >
      <Image source={logo} style={logoStyle} contentFit="contain" />
      <Text style={styles.logoLabel}>{label}</Text>
    </Pressable>
  )
}

export function AppointmentDirectionsDrawer({
  visible,
  appointment,
  onClose,
  onSelectApp,
}: AppointmentDirectionsDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible && appointment) {
      setIsMounted(true)
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start()
      return
    }

    if (!isMounted) return

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_OFFSET,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setIsMounted(false)
    })
  }, [appointment, backdropOpacity, isMounted, sheetTranslateY, visible])

  if (!isMounted || !appointment) return null

  function handleSelect(app: NavigationApp) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onSelectApp(app)
  }

  return (
    <AppModal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 4,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(36, 36, 46, 0.98)', 'rgba(14, 14, 20, 0.99)']}
            style={StyleSheet.absoluteFillObject}
          />

          <LinearGradient
            colors={['#38bdf8', '#0ea5e9', '#0284c7']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.topAccent}
          />

          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <LinearGradient
              colors={['#38bdf8', '#0ea5e9', '#0284c7']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.headerIcon}
            >
              <MaterialCommunityIcons name="map-marker-radius" size={22} color="#fff" />
            </LinearGradient>

            <View style={styles.headerTextCol}>
              <Text style={styles.title}>Como chegar</Text>
              <Text style={styles.subtitle}>Escolha o app de navegação</Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.destinationLine}>
            <View style={styles.destinationDivider} />
            <View style={styles.destinationRow}>
              <Ionicons name="location-outline" size={15} color="#ffffff" />
              <Text style={styles.destinationName} numberOfLines={1}>
                {appointment.selectedUbtName}
              </Text>
            </View>
            <View style={styles.destinationDivider} />
          </View>

          <View style={styles.optionsBlock}>
            <NavigationOption
              label="Google Maps"
              logo={googleMapsLogo}
              logoStyle={styles.googleMapsLogo}
              onPress={() => handleSelect('google-maps')}
            />
            <NavigationOption
              label="Waze"
              logo={wazeLogo}
              logoStyle={styles.wazeLogo}
              onPress={() => handleSelect('waze')}
            />
          </View>

          <Text style={styles.footerHint}>
            O endereço da unidade será aberto automaticamente no app escolhido.
          </Text>
        </Animated.View>
      </View>
    </AppModal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    paddingHorizontal: 16,
    gap: 14,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(14, 165, 233, 0.45)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  closeButtonPressed: {
    opacity: 0.82,
  },
  destinationLine: {
    gap: 12,
  },
  destinationDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  destinationName: {
    flexShrink: 1,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  optionsBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 8,
  },
  logoButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
  },
  logoButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
  logoLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  googleMapsLogo: {
    width: 72,
    height: 72,
  },
  wazeLogo: {
    width: 72,
    height: 72,
    tintColor: '#33CCFF',
  },
  footerHint: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
    paddingBottom: 4,
  },
})
