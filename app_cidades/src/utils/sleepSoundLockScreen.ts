import { Asset } from 'expo-asset'

const lockScreenLogo = require('../../assets/logo.png')

let cachedArtworkUrl: string | undefined

export async function getSleepSoundLockScreenArtworkUrl(): Promise<string | undefined> {
  if (cachedArtworkUrl) return cachedArtworkUrl

  try {
    const asset = Asset.fromModule(lockScreenLogo)
    await asset.downloadAsync()
    cachedArtworkUrl = asset.localUri ?? asset.uri
    return cachedArtworkUrl
  } catch {
    return undefined
  }
}

export type SleepSoundLockScreenMetadata = {
  title: string
  artist?: string
  albumTitle?: string
  artworkUrl?: string
}

export const SLEEP_SOUND_LOCK_SCREEN_ARTIST = 'Telefarmed · Hora de Dormir'
export const SLEEP_SOUND_LOCK_SCREEN_ALBUM = 'Sons para dormir'
