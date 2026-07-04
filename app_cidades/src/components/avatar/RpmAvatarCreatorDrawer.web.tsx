import { Ionicons } from '@expo/vector-icons'
import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { AppModal } from '../AppModal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { buildRpmCreatorUrl } from '../../config/readyPlayerMe'
import { colors } from '../../theme/colors'
import { getModalFooterPadding } from '../../utils/modalSafeArea'
import {
  isReadyPlayerMeOrigin,
  processRpmCreatorMessage,
  RPM_CREATOR_IFRAME_TITLE,
  rpmAvatarCreatorDrawerStyles as styles,
  serializeRpmCreatorMessageData,
  triggerRpmCreatorCloseHaptic,
  type RpmAvatarCreatorDrawerProps,
} from './rpmAvatarCreatorDrawerShared'

type IframeProps = {
  src: string
  title: string
  style: ViewStyle
  onLoad: () => void
}

const Iframe = 'iframe' as unknown as ComponentType<IframeProps & { ref?: never }>

export function RpmAvatarCreatorDrawer({
  visible,
  onClose,
  onAvatarExported,
}: RpmAvatarCreatorDrawerProps) {
  const insets = useSafeAreaInsets()
  const creatorUrl = useMemo(() => buildRpmCreatorUrl(), [])
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!visible) {
      setIsLoading(true)
    }
  }, [visible, creatorUrl])

  useEffect(() => {
    if (!visible) return

    function handleWindowMessage(event: MessageEvent) {
      const iframeWindow = iframeRef.current?.contentWindow
      if (iframeWindow && event.source && event.source !== iframeWindow) return
      if (!isReadyPlayerMeOrigin(event.origin)) return

      const rawData = serializeRpmCreatorMessageData(event.data)
      if (!rawData) return

      processRpmCreatorMessage(rawData, onAvatarExported, onClose)
    }

    window.addEventListener('message', handleWindowMessage)
    return () => window.removeEventListener('message', handleWindowMessage)
  }, [visible, onAvatarExported, onClose])

  function handleClose() {
    void triggerRpmCreatorCloseHaptic()
    onClose()
  }

  return (
    <AppModal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: getModalFooterPadding(insets.bottom) }]}>
        <View style={styles.toolbar}>
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Fechar editor de avatar"
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>

          <View style={styles.toolbarTextCol}>
            <Text style={styles.toolbarTitle}>Personalizar avatar</Text>
            <Text style={styles.toolbarSubtitle}>Ready Player Me</Text>
          </View>
        </View>

        <View style={iframeStyles.container}>
          <Iframe
            ref={iframeRef as never}
            src={creatorUrl}
            title={RPM_CREATOR_IFRAME_TITLE}
            style={iframeStyles.frame}
            onLoad={() => setIsLoading(false)}
          />
          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Carregando editor...</Text>
            </View>
          ) : null}
        </View>
      </View>
    </AppModal>
  )
}

const iframeStyles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  frame: {
    borderWidth: 0,
    width: '100%',
    height: '100%',
    flex: 1,
    backgroundColor: colors.background,
  },
})
