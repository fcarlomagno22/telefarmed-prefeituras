export type BiometricAuthError = 'user_cancel' | 'not_available' | 'unknown'

export type BiometricAuthResult =
  | { success: true }
  | { success: false; error: BiometricAuthError }

export type BiometricAuthOptions = {
  promptMessage: string
  cancelLabel?: string
}
