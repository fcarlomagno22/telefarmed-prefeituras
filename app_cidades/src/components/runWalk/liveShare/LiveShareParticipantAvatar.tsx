import { Image } from 'expo-image'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import { getParticipantFirstName } from '../../../utils/runWalkLiveShareStats'

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

type LiveShareParticipantAvatarProps = {
  name: string
  photoUrl?: string | null
  size?: number
}

export function LiveShareParticipantAvatar({
  name,
  photoUrl,
  size = 48,
}: LiveShareParticipantAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const trimmedPhoto = photoUrl?.trim()
  const showPhoto = Boolean(trimmedPhoto) && !imageFailed
  const initials = getInitials(name)
  const firstName = getParticipantFirstName(name)

  if (showPhoto) {
    return (
      <Image
        source={{ uri: trimmedPhoto! }}
        accessibilityLabel={firstName}
        onError={() => setImageFailed(true)}
        style={[
          styles.photo,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        contentFit="cover"
      />
    )
  }

  return (
    <View
      style={[
        styles.initialsWrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
      accessibilityLabel={firstName}
    >
      <Text style={[styles.initials, { fontSize: Math.round(size * 0.32) }]}>{initials}</Text>
    </View>
  )
}

export function buildLiveShareParticipantPinHtml(
  photoUrl: string | null | undefined,
  name: string,
): string {
  const safeUrl = photoUrl?.trim().replace(/"/g, '&quot;').replace(/'/g, '&#39;') ?? ''
  const initials = getInitials(name)

  if (safeUrl) {
    return (
      '<div class="live-pin-shell live-pin-shell-photo">' +
      '<div class="live-pin-pulse"></div>' +
      `<div class="live-pin-body live-pin-body-photo"><img src="${safeUrl}" alt="" /></div>` +
      '</div>'
    )
  }

  return (
    '<div class="live-pin-shell">' +
    '<div class="live-pin-pulse"></div>' +
    `<div class="live-pin-body live-pin-body-initials">${initials}</div>` +
    '</div>'
  )
}

const styles = StyleSheet.create({
  photo: {
    borderWidth: 2,
    borderColor: '#22c55e',
    backgroundColor: colors.backgroundElevated,
  },
  initialsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#22c55e',
    backgroundColor: '#1a1a22',
  },
  initials: {
    color: '#86efac',
    fontWeight: '800',
  },
})
