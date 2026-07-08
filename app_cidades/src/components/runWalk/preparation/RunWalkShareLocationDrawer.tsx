import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import LottieView from 'lottie-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import {
  createLiveShareSession,
  fetchLiveShareSessionByToken,
  isLiveShareRemoteEnabled,
  isLocalLiveShareSession,
  loadActiveLiveShareSession,
  shouldReplaceLiveShareSession,
} from '../../../data/runWalkLiveShareService'
import {
  loadActiveTrustedContact,
  loadSelectedTrustedContacts,
  type TrustedContact,
} from '../../../data/runWalkSafetyStorage'
import { colors } from '../../../theme/colors'
import { playPingSound } from '../../../utils/appSounds'
import { maskPhone } from '../../../utils/phone'
import { shareLiveLocationLink, waitForShareSheet } from '../../../utils/runWalkLocationShare'
import type { LiveShareSessionSnapshot } from '../../../types/runWalkLiveShare'
import { PrimaryButton } from '../../PrimaryButton'
import { RunWalkSheetDrawer } from '../RunWalkSheetDrawer'
import { RunWalkTrustedContactsDrawer } from '../RunWalkTrustedContactsDrawer'
import { getRunWalkFlowDrawerMinHeight } from '../runWalkFlowDrawerLayout'

const areaMapAnimation = require('../../../../assets/area_map.json')

type RunWalkShareLocationDrawerProps = {
  visible: boolean
  patientCpf: string
  participantName: string
  activityName: string
  latitude: number | null
  longitude: number | null
  onClose: () => void
  showStartActions?: boolean
  onConfirmShare?: () => void
  onContinueWithoutShare?: () => void
  onSessionActivated?: (session: LiveShareSessionSnapshot) => void
}

function formatContactsSummary(contacts: TrustedContact[]): string {
  if (contacts.length === 0) {
    return 'Nenhum contato selecionado para receber o link.'
  }

  if (contacts.length === 1) {
    const contact = contacts[0]
    return `${contact.name} · ${maskPhone(contact.phone)}`
  }

  return `${contacts.length} contatos selecionados para compartilhar`
}

export function RunWalkShareLocationDrawer({
  visible,
  patientCpf,
  participantName,
  activityName,
  latitude,
  longitude,
  onClose,
  showStartActions = false,
  onConfirmShare,
  onContinueWithoutShare,
  onSessionActivated,
}: RunWalkShareLocationDrawerProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [trustedContactsDrawerVisible, setTrustedContactsDrawerVisible] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<TrustedContact[]>([])
  const wasVisibleRef = useRef(false)

  const loadContacts = useCallback(async () => {
    const contacts = await loadSelectedTrustedContacts(patientCpf)
    setSelectedContacts(contacts)
  }, [patientCpf])

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      void playPingSound()
    }
    wasVisibleRef.current = visible
  }, [visible])

  useEffect(() => {
    if (!visible) {
      setTrustedContactsDrawerVisible(false)
      return
    }
    void loadContacts()
  }, [loadContacts, visible])

  async function handleSharePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setIsSaving(true)

    try {
      let activeSession = await loadActiveLiveShareSession()
      if (await shouldReplaceLiveShareSession(activeSession)) {
        if (!(await isLiveShareRemoteEnabled())) {
          Alert.alert(
            'Compartilhamento indisponível',
            'Este ambiente não está conectado ao servidor de acompanhamento. A outra pessoa não conseguirá abrir o link.',
          )
          return
        }

        if (latitude == null || longitude == null) {
          Alert.alert(
            'Aguardando GPS',
            'Espere o GPS localizar você antes de compartilhar o link.',
          )
          return
        }

        activeSession = await createLiveShareSession({
          participantName,
          activityName,
          latitude,
          longitude,
        })
      }

      if (!activeSession?.isActive) {
        Alert.alert(
          'Não foi possível compartilhar',
          'Não conseguimos iniciar o acompanhamento. Tente novamente em instantes.',
        )
        return
      }

      if (await isLiveShareRemoteEnabled()) {
        if (isLocalLiveShareSession(activeSession)) {
          Alert.alert(
            'Compartilhamento indisponível',
            'Este ambiente não está conectado ao servidor de acompanhamento. A outra pessoa não conseguirá abrir o link.',
          )
          return
        }

        const verified = await fetchLiveShareSessionByToken(activeSession.shareToken)
        if (!verified) {
          Alert.alert(
            'Não foi possível compartilhar',
            'A sessão de acompanhamento não foi encontrada no servidor. Verifique sua conexão e tente novamente.',
          )
          return
        }
      }

      onSessionActivated?.(activeSession)

      const shouldProceed = showStartActions
      onClose()
      await waitForShareSheet()

      const contacts = await loadSelectedTrustedContacts(patientCpf)
      const shareContact =
        contacts.find((contact) => contact.liveShareEnabled) ??
        contacts[0] ??
        (await loadActiveTrustedContact(patientCpf))

      await shareLiveLocationLink({
        shareToken: activeSession.shareToken,
        recipientName: shareContact?.name,
        recipientPhone: shareContact?.phone,
      })

      if (shouldProceed) {
        onConfirmShare?.()
      }
    } catch {
      Alert.alert(
        'Não foi possível compartilhar',
        'Verifique sua conexão e tente novamente. Se o problema continuar, reinicie a atividade.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  function handleSkipPress() {
    void Haptics.selectionAsync()
    onContinueWithoutShare?.()
  }

  function handleOpenTrustedContacts() {
    void Haptics.selectionAsync()
    setTrustedContactsDrawerVisible(true)
  }

  const primaryLabel =
    showStartActions && onConfirmShare
      ? 'Compartilhar localização e continuar'
      : 'Compartilhar link'

  const contactsSummary = formatContactsSummary(selectedContacts)

  return (
    <>
      <RunWalkSheetDrawer
        visible={visible}
        title="Compartilhar localização"
        subtitle={
          showStartActions
            ? 'Envie um link para acompanhar sua rota ou continue sem compartilhar.'
            : undefined
        }
        onClose={onClose}
        scrollable={false}
        dense
        minHeight={showStartActions ? getRunWalkFlowDrawerMinHeight('flow') : undefined}
        footer={
          showStartActions ? (
            <View style={styles.footer}>
              <PrimaryButton
                label={primaryLabel}
                onPress={() => void handleSharePress()}
                loading={isSaving}
              />

              <Pressable
                onPress={handleSkipPress}
                style={({ pressed }) => [styles.skipBtn, pressed && styles.skipBtnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Continuar sem compartilhar"
              >
                <Text style={styles.skipLabel}>Continuar sem compartilhar</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.footer}>
              <PrimaryButton
                label={primaryLabel}
                onPress={() => void handleSharePress()}
                loading={isSaving}
              />
            </View>
          )
        }
      >
        <View style={styles.content}>
          <View style={styles.lottieWrap}>
            <LottieView source={areaMapAnimation} autoPlay loop style={styles.lottie} />
          </View>

          <Text style={styles.hint}>
            Envie um link para acompanhar sua rota em tempo real. Escolha WhatsApp, SMS ou outro app
            e selecione quem deve receber.
          </Text>

          <Pressable
            onPress={handleOpenTrustedContacts}
            style={({ pressed }) => [styles.contactsCard, pressed && styles.contactsCardPressed]}
            accessibilityRole="button"
            accessibilityLabel="Gerenciar contatos de confiança"
          >
            <View style={styles.contactsIcon}>
              <Ionicons name="people-outline" size={18} color="#15803d" />
            </View>

            <View style={styles.contactsTextCol}>
              <Text style={styles.contactsTitle}>Contatos de confiança</Text>
              <Text style={styles.contactsSummary} numberOfLines={2}>
                {contactsSummary}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
          </Pressable>
        </View>
      </RunWalkSheetDrawer>

      <RunWalkTrustedContactsDrawer
        visible={trustedContactsDrawerVisible}
        patientCpf={patientCpf}
        onClose={() => setTrustedContactsDrawerVisible(false)}
        onContactsChange={() => void loadContacts()}
      />
    </>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingBottom: 4,
    alignItems: 'center',
  },
  lottieWrap: {
    width: '100%',
    height: Platform.OS === 'web' ? 132 : 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: Platform.OS === 'web' ? 168 : 200,
    height: Platform.OS === 'web' ? 132 : 160,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
  },
  contactsCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  contactsCardPressed: {
    opacity: 0.88,
  },
  contactsIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.28)',
  },
  contactsTextCol: {
    flex: 1,
    gap: 2,
  },
  contactsTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  contactsSummary: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  footer: {
    gap: 10,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipBtnPressed: {
    opacity: 0.75,
  },
  skipLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
})
