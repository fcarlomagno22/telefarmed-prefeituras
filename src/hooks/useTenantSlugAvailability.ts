import { useEffect, useRef, useState } from 'react'
import {
  createIdleSlugAvailability,
  normalizeTenantSlugInput,
  validateTenantSlug,
  type TenantSlugAvailabilityState,
} from '../utils/tenantSlug'

export type TenantSlugAvailabilityResult = {
  value: string
  available: boolean
  reason: string | null
}

type UseTenantSlugAvailabilityOptions = {
  value: string
  enabled?: boolean
  debounceMs?: number
  checkAvailability: (slug: string) => Promise<TenantSlugAvailabilityResult>
}

export function useTenantSlugAvailability({
  value,
  enabled = true,
  debounceMs = 450,
  checkAvailability,
}: UseTenantSlugAvailabilityOptions): TenantSlugAvailabilityState {
  const [state, setState] = useState<TenantSlugAvailabilityState>(createIdleSlugAvailability)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!enabled) {
      setState(createIdleSlugAvailability())
      return
    }

    const normalized = normalizeTenantSlugInput(value)
    const formatError = validateTenantSlug(normalized)

    if (!normalized) {
      setState(createIdleSlugAvailability())
      return
    }

    if (formatError) {
      setState({
        status: 'unavailable',
        reason: formatError,
        checkedValue: normalized,
      })
      return
    }

    setState({ status: 'checking', reason: null, checkedValue: normalized })
    const requestId = ++requestIdRef.current
    const timer = window.setTimeout(() => {
      void checkAvailability(normalized)
        .then((result) => {
          if (requestId !== requestIdRef.current) return
          setState({
            status: result.available ? 'available' : 'unavailable',
            reason: result.reason,
            checkedValue: result.value,
          })
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return
          setState({
            status: 'unavailable',
            reason: 'Não foi possível verificar a disponibilidade. Tente novamente.',
            checkedValue: normalized,
          })
        })
    }, debounceMs)

    return () => {
      window.clearTimeout(timer)
    }
  }, [value, enabled, debounceMs, checkAvailability])

  return state
}
