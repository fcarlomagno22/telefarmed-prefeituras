import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import { useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import { colors } from '../../theme/colors'
import { persistProfilePhoto, prepareProfilePhotoSource } from '../../utils/profilePhotoImage'
import { ProfilePhotoCropModal } from './ProfilePhotoCropModal'
import { ProfilePhotoDeleteModal } from './ProfilePhotoDeleteModal'
import {
  ProfilePhotoMenuAction,
  ProfilePhotoMenuModal,
} from './ProfilePhotoMenuModal'
import {
  ProfilePhotoReplaceModal,
  ProfilePhotoReplaceSource,
} from './ProfilePhotoReplaceModal'
import { ProfilePhotoViewerModal } from './ProfilePhotoViewerModal'

type ProfileAvatarProps = {
  selfieUri?: string | null
}

const AVATAR_SIZE = 52

export function ProfileAvatar({ selfieUri }: ProfileAvatarProps) {
  const { updateSelfie } = useAuth()
  const [menuVisible, setMenuVisible] = useState(false)
  const [viewerVisible, setViewerVisible] = useState(false)
  const [deleteVisible, setDeleteVisible] = useState(false)
  const [replaceVisible, setReplaceVisible] = useState(false)
  const [cropVisible, setCropVisible] = useState(false)
  const [pendingCropUri, setPendingCropUri] = useState<string | null>(null)
  const [pendingCropSize, setPendingCropSize] = useState<{
    width: number
    height: number
  } | null>(null)
  const [isPreparingCrop, setIsPreparingCrop] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  const hasSelfie = Boolean(selfieUri?.trim())
  const showPhoto = hasSelfie && !imageFailed

  useEffect(() => {
    setImageFailed(false)
  }, [selfieUri])

  function openMenu() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setMenuVisible(true)
  }

  async function pickImage(source: ProfilePhotoReplaceSource) {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert(
        'Permissão necessária',
        source === 'camera'
          ? 'Precisamos da câmera para tirar uma nova foto.'
          : 'Precisamos acessar sua galeria para escolher uma foto.',
      )
      return
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.85,
            cameraType: ImagePicker.CameraType.front,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.85,
          })

    if (result.canceled || !result.assets[0]?.uri) return

    const asset = result.assets[0]
    setReplaceVisible(false)
    setCropVisible(true)
    setIsPreparingCrop(true)
    setPendingCropUri(null)
    setPendingCropSize(null)

    try {
      const prepared = await prepareProfilePhotoSource(
        asset.uri,
        asset.width,
        asset.height,
      )
      setPendingCropUri(prepared.uri)
      setPendingCropSize({ width: prepared.width, height: prepared.height })
    } catch {
      setCropVisible(false)
      Alert.alert('Erro', 'Não foi possível preparar a imagem. Tente novamente.')
    } finally {
      setIsPreparingCrop(false)
    }
  }

  function handleMenuAction(action: ProfilePhotoMenuAction) {
    if (action === 'view' && selfieUri) {
      setViewerVisible(true)
      return
    }

    if (action === 'replace') {
      setReplaceVisible(true)
      return
    }

    if (action === 'delete') {
      setDeleteVisible(true)
    }
  }

  async function handleDeleteConfirm() {
    await updateSelfie(null)
  }

  async function handleCropConfirm(uri: string) {
    setCropVisible(false)
    setPendingCropUri(null)
    setPendingCropSize(null)
    void updateSelfie(uri)

    try {
      const savedUri = await persistProfilePhoto(uri, selfieUri)
      if (savedUri !== uri) {
        void updateSelfie(savedUri)
      }
    } catch {
      // Mantém a URI temporária se a persistência falhar.
    }
  }

  return (
    <>
      <Pressable
        onPress={openMenu}
        style={({ pressed }) => [
          styles.avatarRing,
          showPhoto ? styles.avatarRingPhoto : styles.avatarRingEmpty,
          pressed && styles.avatarPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Gerenciar foto de perfil"
      >
        {showPhoto ? (
          <Image
            key={selfieUri}
            source={{ uri: selfieUri! }}
            style={styles.avatarImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={120}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Ionicons name="person-outline" size={22} color={colors.primaryLight} />
          </View>
        )}
      </Pressable>

      <ProfilePhotoMenuModal
        visible={menuVisible}
        selfieUri={selfieUri}
        onClose={() => setMenuVisible(false)}
        onAction={handleMenuAction}
      />

      {hasSelfie ? (
        <ProfilePhotoViewerModal
          visible={viewerVisible}
          selfieUri={selfieUri!}
          onClose={() => setViewerVisible(false)}
        />
      ) : null}

      <ProfilePhotoReplaceModal
        visible={replaceVisible}
        hasPhoto={hasSelfie}
        onSelect={(source) => void pickImage(source)}
        onClose={() => setReplaceVisible(false)}
      />

      <ProfilePhotoDeleteModal
        visible={deleteVisible}
        onConfirm={() => void handleDeleteConfirm()}
        onClose={() => setDeleteVisible(false)}
      />

      <ProfilePhotoCropModal
        visible={cropVisible}
        imageUri={pendingCropUri}
        initialSize={pendingCropSize}
        isPreparing={isPreparingCrop}
        onClose={() => {
          setCropVisible(false)
          setPendingCropUri(null)
          setPendingCropSize(null)
          setIsPreparingCrop(false)
        }}
        onConfirm={handleCropConfirm}
      />
    </>
  )
}

const styles = StyleSheet.create({
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingEmpty: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  avatarRingPhoto: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: colors.backgroundElevated,
  },
  avatarPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
