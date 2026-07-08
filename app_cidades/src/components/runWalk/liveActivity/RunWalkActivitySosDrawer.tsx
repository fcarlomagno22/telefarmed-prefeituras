import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { openAppPhoneCall } from '../../../adapters/appLinking'
import {
  loadActiveTrustedContact,
  type TrustedContact,
} from '../../../data/runWalkSafetyStorage'
import { colors } from '../../../theme/colors'
import { maskPhone } from '../../../utils/phone'
import { RunWalkSheetDrawer } from '../RunWalkSheetDrawer'
import { RunWalkTrustedContactsDrawer } from '../RunWalkTrustedContactsDrawer'

type RunWalkActivitySosDrawerProps = {
  visible: boolean
  patientCpf: string
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
  void openAppPhoneCall(phone)
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

export function RunWalkActivitySosDrawer({
  visible,
  patientCpf,
  onClose,
}: RunWalkActivitySosDrawerProps) {
  const [emergencyContact, setEmergencyContact] = useState<TrustedContact | null>(null)
  const [trustedContactsDrawerVisible, setTrustedContactsDrawerVisible] = useState(false)

  const loadEmergencyContact = useCallback(async () => {
    const contact = await loadActiveTrustedContact(patientCpf)
    setEmergencyContact(contact)
  }, [patientCpf])

  useEffect(() => {
    if (!visible) {
      setTrustedContactsDrawerVisible(false)
      return
    }

    void loadEmergencyContact()
  }, [loadEmergencyContact, visible])

  function handleDialEmergency(number: string) {
    onClose()
    dialPhone(number)
  }

  function handleDialContact() {
    if (!emergencyContact?.phone) return
    onClose()
    dialPhone(emergencyContact.phone)
  }

  function handleOpenTrustedContacts() {
    void Haptics.selectionAsync()
    setTrustedContactsDrawerVisible(true)
  }

  const contactSubtitle = emergencyContact
    ? `${emergencyContact.name} · ${maskPhone(emergencyContact.phone)}`
    : 'Nenhum contato cadastrado'

  return (
    <>
      <RunWalkSheetDrawer
        visible={visible}
        title="SOS — Emergência"
        subtitle="Escolha quem ligar agora"
        onClose={onClose}
        scrollable={false}
        minHeight="46%"
        extraBottomInset={14}
        footer={
          <Pressable
            onPress={handleOpenTrustedContacts}
            style={({ pressed }) => [styles.manageBtn, pressed && styles.manageBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Gerenciar contatos de confiança"
          >
            <Ionicons name="people-outline" size={16} color="#15803d" />
            <Text style={styles.manageLabel}>Gerenciar contatos de confiança</Text>
          </Pressable>
        }
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

      <RunWalkTrustedContactsDrawer
        visible={trustedContactsDrawerVisible}
        patientCpf={patientCpf}
        onClose={() => setTrustedContactsDrawerVisible(false)}
        onContactsChange={() => void loadEmergencyContact()}
      />
    </>
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
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.28)',
  },
  manageBtnPressed: {
    opacity: 0.88,
  },
  manageLabel: {
    color: '#15803d',
    fontSize: 14,
    fontWeight: '700',
  },
})
