import type {
  BiometricAuthOptions,
  BiometricAuthResult,
} from './localAuthentication.types'

export async function hasBiometricHardwareAsync(): Promise<boolean> {
  return false
}

export async function isBiometricEnrolledAsync(): Promise<boolean> {
  return false
}

export async function authenticateWithBiometricsAsync(
  _options: BiometricAuthOptions,
): Promise<BiometricAuthResult> {
  return {
    success: false,
    error: 'not_available',
  }
}
