import { Asset } from 'expo-asset'
import { cacheDirectory, copyAsync, getPublicFileUri } from '../adapters/fileSystem'
import { PermissionsAndroid, Platform } from 'react-native'

const lockScreenLogo = require('../../assets/logo.png')

let cachedArtworkUrl: string | undefined

function isUsableArtworkUri(uri?: string | null): uri is string {
  if (!uri) return false

  return (
    uri.startsWith('file://') ||
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('content://')
  )
}

async function resolveBundledArtworkUri(): Promise<string | undefined> {
  const asset = Asset.fromModule(lockScreenLogo)
  await asset.downloadAsync()

  const sourceUri = asset.localUri ?? asset.uri
  if (isUsableArtworkUri(sourceUri) && sourceUri.startsWith('file://')) {
    return sourceUri
  }

  if (isUsableArtworkUri(sourceUri)) {
    const destination = `${cacheDirectory}sleep-lock-screen-logo.png`
    await copyAsync({ from: sourceUri, to: destination })
    return getPublicFileUri(destination)
  }

  return undefined
}

export async function getSleepSoundLockScreenArtworkUrl(): Promise<string | undefined> {
  if (cachedArtworkUrl) return cachedArtworkUrl

  try {
    cachedArtworkUrl = await resolveBundledArtworkUri()
    return cachedArtworkUrl
  } catch {
    return undefined
  }
}

export async function ensureSleepSoundPlaybackPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android' || Platform.Version < 33) {
    return true
  }

  const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  const alreadyGranted = await PermissionsAndroid.check(permission)
  if (alreadyGranted) return true

  const result = await PermissionsAndroid.request(permission, {
    title: 'Controle na tela bloqueada',
    message:
      'Permita notificações para exibir o mini player de áudio quando a tela estiver desligada.',
    buttonPositive: 'Permitir',
    buttonNegative: 'Agora não',
  })

  return result === PermissionsAndroid.RESULTS.GRANTED
}

export function isSleepSoundLockScreenSupported(): boolean {
  return true
}

export function isSleepSoundBackgroundPlaybackSupported(): boolean {
  return true
}

export {
  SLEEP_SOUND_LOCK_SCREEN_ALBUM,
  SLEEP_SOUND_LOCK_SCREEN_ARTIST,
  type SleepSoundLockScreenMetadata,
} from './sleepSoundLockScreenShared'
