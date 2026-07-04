import * as LocalAuthentication from 'expo-local-authentication'
import type {
  BiometricAuthOptions,
  BiometricAuthResult,
} from './localAuthentication.types'

export async function hasBiometricHardwareAsync(): Promise<boolean> {
  return LocalAuthentication.hasHardwareAsync()
}

export async function isBiometricEnrolledAsync(): Promise<boolean> {
  return LocalAuthentication.isEnrolledAsync()
}

export async function authenticateWithBiometricsAsync(
  options: BiometricAuthOptions,
): Promise<BiometricAuthResult> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: options.promptMessage,
    cancelLabel: options.cancelLabel,
  })

  if (result.success) {
    return { success: true }
  }

  return {
    success: false,
    error: result.error === 'user_cancel' ? 'user_cancel' : 'unknown',
  }
}
