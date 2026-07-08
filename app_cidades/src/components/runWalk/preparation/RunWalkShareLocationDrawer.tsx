import * as Haptics from 'expo-haptics'
import LottieView from 'lottie-react-native'
import { useEffect, useRef, useState } from 'react'
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import {
  createLiveShareSession,
  fetchLiveShareSessionByToken,
  isRemoteLiveShareSession,
  loadActiveLiveShareSession,
  shouldReplaceLiveShareSession,
} from '../../../data/runWalkLiveShareService'
import { colors } from '../../../theme/colors'
import { playPingSound } from '../../../utils/appSounds'
import { shareLiveLocationLink, waitForShareSheet } from '../../../utils/runWalkLocationShare'
import type { LiveShareSessionSnapshot } from '../../../types/runWalkLiveShare'
import { PrimaryButton } from '../../PrimaryButton'
import { RunWalkSheetDrawer } from '../RunWalkSheetDrawer'
import { getRunWalkFlowDrawerMinHeight } from '../runWalkFlowDrawerLayout'

const areaMapAnimation = require('../../../../assets/area_map.json')

type RunWalkShareLocationDrawerProps = {
  visible: boolean
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

export function RunWalkShareLocationDrawer({
  visible,
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
  const wasVisibleRef = useRef(false)

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      void playPingSound()
    }
    wasVisibleRef.current = visible
  }, [visible])

  async function handleSharePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setIsSaving(true)

    try {
      if (latitude == null || longitude == null) {
        Alert.alert(
          'Aguardando GPS',
          'Espere o GPS localizar você antes de compartilhar o link.',
        )
        return
      }

      let activeSession = await loadActiveLiveShareSession()
      if (await shouldReplaceLiveShareSession(activeSession)) {
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

      if (isRemoteLiveShareSession(activeSession.id)) {
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

      await shareLiveLocationLink({
        shareToken: activeSession.shareToken,
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

  const primaryLabel =
    showStartActions && onConfirmShare
      ? 'Compartilhar localização e continuar'
      : 'Compartilhar link'

  return (
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
          na hora de compartilhar.
        </Text>
      </View>
    </RunWalkSheetDrawer>
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
