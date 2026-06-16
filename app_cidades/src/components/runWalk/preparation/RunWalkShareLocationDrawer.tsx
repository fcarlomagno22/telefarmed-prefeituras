import * as Haptics from 'expo-haptics'
import LottieView from 'lottie-react-native'
import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  createLiveShareSession,
  loadActiveLiveShareSession,
} from '../../../data/runWalkLiveShareService'
import { colors } from '../../../theme/colors'
import { playPingSound } from '../../../utils/appSounds'
import { shareLiveLocationLink, waitForShareSheet } from '../../../utils/runWalkLocationShare'
import { PrimaryButton } from '../../PrimaryButton'
import { RunWalkSheetDrawer } from '../RunWalkSheetDrawer'

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
      let activeSession = await loadActiveLiveShareSession()
      if (!activeSession?.isActive) {
        activeSession = await createLiveShareSession({
          participantName,
          activityName,
          latitude,
          longitude,
        })
      }

      const shouldProceed = showStartActions
      onClose()
      await waitForShareSheet()

      await shareLiveLocationLink({
        activityName,
        shareToken: activeSession.shareToken,
      })

      if (shouldProceed) {
        onConfirmShare?.()
      }
    } finally {
      setIsSaving(false)
    }
  }

  function handleSkipPress() {
    void Haptics.selectionAsync()
    onContinueWithoutShare?.()
  }

  const primaryLabel = showStartActions ? 'Compartilhar localização e continuar' : 'Compartilhar link'

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Compartilhar localização"
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <PrimaryButton
            label={primaryLabel}
            onPress={() => void handleSharePress()}
            loading={isSaving}
          />

          {showStartActions ? (
            <Pressable
              onPress={handleSkipPress}
              style={({ pressed }) => [styles.skipBtn, pressed && styles.skipBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Continuar sem compartilhar"
            >
              <Text style={styles.skipLabel}>Continuar sem compartilhar</Text>
            </Pressable>
          ) : null}
        </View>
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
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  lottieWrap: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: 220,
    height: 180,
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
