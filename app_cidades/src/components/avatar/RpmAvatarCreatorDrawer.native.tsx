import { Ionicons } from '@expo/vector-icons'
import { useMemo } from 'react'
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native'
import { AppModal } from '../AppModal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppWebView } from '../../adapters/AppWebView'
import { buildRpmCreatorUrl } from '../../config/readyPlayerMe'
import { colors } from '../../theme/colors'
import { getModalFooterPadding } from '../../utils/modalSafeArea'
import {
  processRpmCreatorMessage,
  rpmAvatarCreatorDrawerStyles as styles,
  triggerRpmCreatorCloseHaptic,
  type RpmAvatarCreatorDrawerProps,
} from './rpmAvatarCreatorDrawerShared'

export function RpmAvatarCreatorDrawer({
  visible,
  onClose,
  onAvatarExported,
}: RpmAvatarCreatorDrawerProps) {
  const insets = useSafeAreaInsets()
  const creatorUrl = useMemo(() => buildRpmCreatorUrl(), [])

  function handleClose() {
    void triggerRpmCreatorCloseHaptic()
    onClose()
  }

  function handleMessage(rawData: string) {
    processRpmCreatorMessage(rawData, onAvatarExported, onClose)
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

        <AppWebView
          source={{ uri: creatorUrl }}
          style={styles.embed}
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
    </AppModal>
  )
}
