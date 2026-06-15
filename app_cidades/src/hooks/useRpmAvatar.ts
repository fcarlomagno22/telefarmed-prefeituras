import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { buildRpmAvatar2dUrl } from '../utils/readyPlayerMe'

const STORAGE_PREFIX = '@telefarmed/rpm-avatar'

function buildStorageKey(ownerKey: string) {
  return `${STORAGE_PREFIX}:${ownerKey}`
}

export function useRpmAvatar(ownerKey = 'guest') {
  const [avatarGlbUrl, setAvatarGlbUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadAvatar() {
      setIsLoading(true)
      try {
        const stored = await AsyncStorage.getItem(buildStorageKey(ownerKey))
        if (!active) return
        setAvatarGlbUrl(stored)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadAvatar()
    return () => {
      active = false
    }
  }, [ownerKey])

  const avatar2dUrl = useMemo(() => {
    if (!avatarGlbUrl) return null
    return buildRpmAvatar2dUrl(avatarGlbUrl, {
      camera: 'fullbody',
      pose: 'relaxed',
      size: 640,
      background: '0e0e14',
    })
  }, [avatarGlbUrl])

  const saveAvatar = useCallback(
    async (nextGlbUrl: string) => {
      const trimmed = nextGlbUrl.trim()
      setAvatarGlbUrl(trimmed)
      await AsyncStorage.setItem(buildStorageKey(ownerKey), trimmed)
    },
    [ownerKey],
  )

  const clearAvatar = useCallback(async () => {
    setAvatarGlbUrl(null)
    await AsyncStorage.removeItem(buildStorageKey(ownerKey))
  }, [ownerKey])

  return {
    avatarGlbUrl,
    avatar2dUrl,
    isLoading,
    saveAvatar,
    clearAvatar,
    hasAvatar: Boolean(avatarGlbUrl),
  }
}
