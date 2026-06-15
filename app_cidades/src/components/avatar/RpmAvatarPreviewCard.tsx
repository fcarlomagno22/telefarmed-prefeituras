import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import { SkeletonBone } from '../SkeletonBone'

type RpmAvatarPreviewCardProps = {
  avatar2dUrl: string | null
  isLoading?: boolean
  skeleton?: boolean
  onPersonalizePress: () => void
}

export function RpmAvatarPreviewCard({
  avatar2dUrl,
  isLoading = false,
  skeleton = false,
  onPersonalizePress,
}: RpmAvatarPreviewCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const showAvatar = Boolean(avatar2dUrl) && !imageFailed && !isLoading

  useEffect(() => {
    setImageFailed(false)
  }, [avatar2dUrl])

  function handlePersonalize() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPersonalizePress()
  }

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(255, 133, 51, 0.28)', 'rgba(255, 255, 255, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.border}
      >
        <View style={styles.inner}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFillObject} />
          ) : null}
          <LinearGradient
            colors={['rgba(28, 28, 36, 0.95)', 'rgba(14, 14, 20, 0.98)']}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.previewCol}>
            {skeleton ? (
              <SkeletonBone width={108} height={148} borderRadius={18} />
            ) : showAvatar ? (
              <Image
                source={{ uri: avatar2dUrl! }}
                style={styles.avatarImage}
                contentFit="contain"
                transition={220}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <View style={styles.placeholder}>
                <MaterialCommunityIcons name="human" size={42} color="rgba(255, 255, 255, 0.28)" />
              </View>
            )}
          </View>

          <View style={styles.contentCol}>
            {skeleton ? (
              <>
                <SkeletonBone width="72%" height={14} borderRadius={5} />
                <SkeletonBone width="92%" height={11} borderRadius={4} style={{ marginTop: 8 }} />
                <SkeletonBone width="58%" height={34} borderRadius={12} style={{ marginTop: 14 }} />
              </>
            ) : (
              <>
                <Text style={styles.title}>Meu avatar</Text>
                <Text style={styles.subtitle}>
                  {showAvatar
                    ? 'Visualização 2D do seu personagem. Toque para editar.'
                    : 'Crie seu avatar 3D e exiba aqui em 2D, de forma leve.'}
                </Text>

                <Pressable
                  onPress={handlePersonalize}
                  style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={showAvatar ? 'Editar avatar' : 'Criar avatar'}
                >
                  <LinearGradient
                    colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionButtonGradient}
                  >
                    <Ionicons
                      name={showAvatar ? 'create-outline' : 'person-add-outline'}
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.actionButtonText}>
                      {showAvatar ? 'Editar avatar' : 'Criar avatar'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  border: {
    borderRadius: 18,
    padding: 1,
  },
  inner: {
    borderRadius: 17,
    overflow: 'hidden',
    minHeight: 168,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  previewCol: {
    width: 112,
    height: 152,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatarImage: {
    width: 112,
    height: 152,
  },
  placeholder: {
    width: 112,
    height: 152,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  contentCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  actionButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonPressed: {
    opacity: 0.86,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
})
