import {
  activateKeepAwakeAsync,
  deactivateKeepAwake,
  isAvailableAsync,
} from 'expo-keep-awake'
import { APP_KEEP_AWAKE_DEFAULT_TAG } from './appKeepAwake.types'

export { APP_KEEP_AWAKE_DEFAULT_TAG, APP_KEEP_AWAKE_WEB_LIMITATIONS } from './appKeepAwake.types'

export function isAppKeepAwakeSupported(): boolean {
  return true
}

export async function isAppKeepAwakeAvailableAsync(): Promise<boolean> {
  return isAvailableAsync()
}

export async function activateAppKeepAwakeAsync(
  tag: string = APP_KEEP_AWAKE_DEFAULT_TAG,
): Promise<void> {
  await activateKeepAwakeAsync(tag)
}

export async function deactivateAppKeepAwake(
  tag: string = APP_KEEP_AWAKE_DEFAULT_TAG,
): Promise<void> {
  try {
    await deactivateKeepAwake(tag)
  } catch {
    // Activity inativa ou tag já liberada — noop seguro no mobile.
  }
}
