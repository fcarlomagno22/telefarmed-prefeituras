import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useMemo } from 'react'
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'
import { buildRpmCreatorUrl } from '../../config/readyPlayerMe'
import { colors } from '../../theme/colors'
import {
  isRpmAvatarExportedEvent,
  parseRpmWebViewMessage,
} from '../../utils/readyPlayerMe'

type RpmAvatarCreatorDrawerProps = {
  visible: boolean
  onClose: () => void
  onAvatarExported: (avatarGlbUrl: string) => void
}

export function RpmAvatarCreatorDrawer({
  visible,
  onClose,
  onAvatarExported,
}: RpmAvatarCreatorDrawerProps) {
  const insets = useSafeAreaInsets()
  const creatorUrl = useMemo(() => buildRpmCreatorUrl(), [])

  function handleClose() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onClose()
  }

  function handleMessage(rawData: string) {
    const payload = parseRpmWebViewMessage(rawData)
    if (!isRpmAvatarExportedEvent(payload)) return

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onAvatarExported(payload.data.url)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
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

        <WebView
          source={{ uri: creatorUrl }}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Carregando editor...</Text>
            </View>
          )}
          onMessage={(event) => handleMessage(event.nativeEvent.data)}
          allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
          setSupportMultipleWindows={false}
          originWhitelist={['https://*']}
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeButtonPressed: {
    opacity: 0.82,
  },
  toolbarTextCol: {
    flex: 1,
    gap: 2,
  },
  toolbarTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  toolbarSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
})
