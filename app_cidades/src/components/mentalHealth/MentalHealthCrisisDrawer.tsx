import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'
import { colors } from '../../theme/colors'
import type { CrisisPresentation, CrisisRouteAction } from '../../utils/mentalHealthCrisis'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type MentalHealthCrisisDrawerProps = {
  visible: boolean
  presentation: CrisisPresentation | null
  onClose: () => void
  onAcknowledge?: () => void
  onOpenEmergencyContacts: () => void
}

function dialPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return
  void Linking.openURL(`tel:${digits}`)
}

function CrisisRouteOption({
  route,
  onOpenEmergencyContacts,
}: {
  route: CrisisRouteAction
  onOpenEmergencyContacts: () => void
}) {
  function handlePress() {
    if (!route.enabled) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    if (route.kind === 'phone' && route.phone) {
      dialPhone(route.phone)
      return
    }

    if (route.kind === 'emergency_contacts') {
      onOpenEmergencyContacts()
    }
  }

  const iconName =
    route.kind === 'emergency_contacts'
      ? 'people-outline'
      : route.id === 'route_samu' || route.id === 'route_police'
        ? 'medkit-outline'
        : 'call-outline'

  const iconColors: [string, string] =
    route.id === 'route_samu' || route.id === 'route_police'
      ? ['#f87171', '#dc2626']
      : route.kind === 'emergency_contacts'
        ? ['#60a5fa', '#2563eb']
        : ['#f472b6', '#db2777']

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={route.label}
      disabled={!route.enabled}
      onPress={handlePress}
      style={({ pressed }) => [styles.routeCard, pressed && route.enabled && styles.pressed]}
    >
      <LinearGradient colors={iconColors} style={styles.routeIcon}>
        <Ionicons name={iconName} size={20} color="#fff" />
      </LinearGradient>

      <View style={styles.routeText}>
        <Text style={styles.routeLabel}>{route.label}</Text>
        <Text style={styles.routeDescription}>{route.description}</Text>
      </View>

      <Ionicons
        name={route.kind === 'emergency_contacts' ? 'chevron-forward' : 'call-outline'}
        size={18}
        color={colors.textMuted}
      />
    </Pressable>
  )
}

export function MentalHealthCrisisDrawer({
  visible,
  presentation,
  onClose,
  onAcknowledge,
  onOpenEmergencyContacts,
}: MentalHealthCrisisDrawerProps) {
  useAndroidBackHandler(() => visible, visible)

  if (!visible || !presentation) return null

  const footer = presentation.allowAcknowledge ? (
    <View style={styles.footer}>
      <PrimaryButton
        label="Entendi, quero ver as opções depois"
        onPress={() => onAcknowledge?.()}
      />
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar opções de apoio"
        style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
      >
        <Text style={styles.secondaryBtnText}>Fechar</Text>
      </Pressable>
    </View>
  ) : (
    <View style={styles.footer}>
      <PrimaryButton
        label="Fechar"
        onPress={onClose}
      />
    </View>
  )

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title=""
      onClose={() => {}}
      fullScreen
      dense
      hideCloseButton
      keyboardAware={false}
      footer={footer}
    >
      <View style={styles.content}>
        <View style={styles.heroIcon}>
          <Ionicons name="heart-outline" size={28} color="#fda4af" />
        </View>

        <Text style={styles.title}>{presentation.title}</Text>
        <Text style={styles.message}>{presentation.message}</Text>

        <View style={styles.disclaimerCard}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#fca5a5" />
          <Text style={styles.disclaimerText}>{presentation.disclaimer}</Text>
        </View>

        <Text style={styles.sectionLabel}>Opções de apoio agora</Text>

        <View style={styles.routes}>
          {presentation.routes.map((route) => (
            <CrisisRouteOption
              key={route.id}
              route={route}
              onOpenEmergencyContacts={onOpenEmergencyContacts}
            />
          ))}
        </View>
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
    gap: 16,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.28)',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  message: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.22)',
  },
  disclaimerText: {
    flex: 1,
    color: '#fecaca',
    fontSize: 13,
    lineHeight: 19,
  },
  sectionLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingTop: 4,
  },
  routes: {
    gap: 10,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  routeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeText: {
    flex: 1,
    gap: 4,
  },
  routeLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  routeDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    gap: 8,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.88,
  },
})
