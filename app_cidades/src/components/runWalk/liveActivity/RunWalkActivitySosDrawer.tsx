import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import {
  loadActiveTrustedContact,
  type TrustedContact,
} from '../../../data/runWalkSafetyStorage'
import { colors } from '../../../theme/colors'
import { maskPhone } from '../../../utils/phone'
import { RunWalkSheetDrawer } from '../RunWalkSheetDrawer'

type RunWalkActivitySosDrawerProps = {
  visible: boolean
  onClose: () => void
}

type SosOptionProps = {
  icon: keyof typeof Ionicons.glyphMap
  iconColors: [string, string]
  title: string
  subtitle: string
  onPress: () => void
  disabled?: boolean
}

function dialPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return
  void Linking.openURL(`tel:${digits}`)
}

function SosOption({
  icon,
  iconColors,
  title,
  subtitle,
  onPress,
  disabled = false,
}: SosOptionProps) {
  function handlePress() {
    if (disabled) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onPress()
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.option,
        disabled && styles.optionDisabled,
        pressed && !disabled && styles.optionPressed,
      ]}
    >
      <LinearGradient colors={iconColors} style={styles.optionIcon}>
        <Ionicons name={icon} size={20} color="#fff" />
      </LinearGradient>

      <View style={styles.optionText}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>

      <Ionicons
        name="call-outline"
        size={18}
        color={disabled ? colors.textSubtle : colors.textMuted}
      />
    </Pressable>
  )
}

export function RunWalkActivitySosDrawer({ visible, onClose }: RunWalkActivitySosDrawerProps) {
  const [emergencyContact, setEmergencyContact] = useState<TrustedContact | null>(null)

  useEffect(() => {
    if (!visible) return

    void loadActiveTrustedContact().then(setEmergencyContact)
  }, [visible])

  function handleDialEmergency(number: string) {
    onClose()
    dialPhone(number)
  }

  function handleDialContact() {
    if (!emergencyContact?.phone) return
    onClose()
    dialPhone(emergencyContact.phone)
  }

  const contactSubtitle = emergencyContact
    ? `${emergencyContact.name} · ${maskPhone(emergencyContact.phone)}`
    : 'Nenhum contato cadastrado'

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="SOS — Emergência"
      subtitle="Escolha quem ligar agora"
      onClose={onClose}
      scrollable={false}
      minHeight="46%"
      extraBottomInset={14}
    >
      <View style={styles.options}>
        <SosOption
          icon="shield-outline"
          iconColors={['#60a5fa', '#2563eb']}
          title="Polícia"
          subtitle="Ligar para 190"
          onPress={() => handleDialEmergency('190')}
        />

        <SosOption
          icon="medkit-outline"
          iconColors={['#f87171', '#dc2626']}
          title="SAMU"
          subtitle="Ligar para 192"
          onPress={() => handleDialEmergency('192')}
        />

        <SosOption
          icon="person-outline"
          iconColors={['#fb923c', '#ea580c']}
          title="Meu contato de emergência"
          subtitle={contactSubtitle}
          onPress={handleDialContact}
          disabled={!emergencyContact?.phone}
        />
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  options: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionDisabled: {
    opacity: 0.55,
  },
  optionPressed: {
    opacity: 0.88,
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    gap: 3,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  optionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
})
