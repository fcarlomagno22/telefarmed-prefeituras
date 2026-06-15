import { Ionicons } from '@expo/vector-icons'
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'

type ProfilePhotoViewerModalProps = {
  visible: boolean
  selfieUri: string
  onClose: () => void
}

export function ProfilePhotoViewerModal({
  visible,
  selfieUri,
  onClose,
}: ProfilePhotoViewerModalProps) {
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          onPress={onClose}
          style={[styles.closeButton, { top: Math.max(insets.top, 12) + 8 }]}
          accessibilityRole="button"
          accessibilityLabel="Fechar visualização"
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>

        <View style={styles.imageShell}>
          <Image source={{ uri: selfieUri }} style={styles.image} resizeMode="contain" />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    zIndex: 2,
  },
  imageShell: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 1,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.backgroundElevated,
  },
  image: {
    width: '100%',
    height: '100%',
  },
})
