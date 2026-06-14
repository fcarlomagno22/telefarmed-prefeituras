import { useCallback, useRef } from 'react'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import {
  PrefeituraAuthApiError,
  verifyPrefeituraAuthorizationPin,
} from '../lib/services/prefeitura/auth'

type UsePrefeituraAuthorizationPinVerifyOptions = {
  onPinNotConfigured?: (message: string) => void
}

export function usePrefeituraAuthorizationPinVerify(
  options: UsePrefeituraAuthorizationPinVerifyOptions = {},
) {
  const { getAccessToken } = usePrefeituraAuth()
  const onPinNotConfiguredRef = useRef(options.onPinNotConfigured)
  onPinNotConfiguredRef.current = options.onPinNotConfigured

  return useCallback(
    async (pin: string) => {
      const token = getAccessToken()
      if (!token) return false

      try {
        await verifyPrefeituraAuthorizationPin(token, pin)
        return true
      } catch (error) {
        if (
          error instanceof PrefeituraAuthApiError &&
          error.code === 'PIN_NOT_CONFIGURED'
        ) {
          onPinNotConfiguredRef.current?.(error.message)
        }
        return false
      }
    },
    [getAccessToken],
  )
}
