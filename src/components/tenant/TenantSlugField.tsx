import { CheckCircle2, Globe, Loader2, XCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { buildGestaoUrl, buildUbtUrl, getPublicRootDomain } from '../../config/tenantHost'
import { useTenantSlugAvailability } from '../../hooks/useTenantSlugAvailability'
import {
  normalizeTenantSlugInput,
  sanitizeTenantSlugInput,
  validateTenantSlug,
  buildCompositeUbtSlug,
  type TenantSlugAvailabilityResult,
} from '../../utils/tenantSlug'

type TenantSlugFieldProps = {
  value: string
  onChange: (value: string) => void
  urlKind: 'gestao' | 'ubt'
  /** Omitir ou `format-only` = validação local; `remote` = checagem via API (admin). */
  availabilityMode?: 'remote' | 'format-only'
  checkAvailability?: (slug: string) => Promise<TenantSlugAvailabilityResult>
  onAvailabilityChange?: (state: {
    available: boolean
    reason: string | null
    checkedValue: string
    checking: boolean
  }) => void
  disabled?: boolean
  label?: string
  hint?: string
  /** Quando informado, o valor editável é só o sufixo da unidade (`centro` → `{entidade}-centro`). */
  compositeEntitySlug?: string
}

const labelClass = 'mb-1 block text-xs font-semibold text-gray-800'
const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-[var(--brand-primary)]/40 focus:shadow-[var(--brand-primary-focus-ring)]'

export function TenantSlugField({
  value,
  onChange,
  urlKind,
  availabilityMode = 'remote',
  checkAvailability,
  onAvailabilityChange,
  disabled = false,
  label = 'Endereço público (slug)',
  hint,
  compositeEntitySlug,
}: TenantSlugFieldProps) {
  const useRemoteAvailability = availabilityMode === 'remote' && Boolean(checkAvailability)
  const stableCheck = useCallback(
    (slug: string) => checkAvailability!(slug),
    [checkAvailability],
  )
  const remoteAvailability = useTenantSlugAvailability({
    value,
    enabled: !disabled && useRemoteAvailability,
    checkAvailability: stableCheck,
  })

  const normalized = normalizeTenantSlugInput(value)
  const resolvedSlug = compositeEntitySlug?.trim()
    ? buildCompositeUbtSlug(compositeEntitySlug, value)
    : normalized
  const entityPrefix = compositeEntitySlug?.trim()
    ? `${normalizeTenantSlugInput(compositeEntitySlug).replace(/-+$/g, '')}-`
    : null

  const formatOnlyAvailability = useMemo(() => {
    if (!resolvedSlug) {
      return { status: 'idle' as const, reason: null, checkedValue: '' }
    }
    const formatError = validateTenantSlug(resolvedSlug)
    if (formatError) {
      return { status: 'unavailable' as const, reason: formatError, checkedValue: resolvedSlug }
    }
    return { status: 'available' as const, reason: null, checkedValue: resolvedSlug }
  }, [resolvedSlug])

  const availability = useRemoteAvailability ? remoteAvailability : formatOnlyAvailability

  const previewUrl = useMemo(() => {
    if (!resolvedSlug) return `https://… .${getPublicRootDomain()}`
    return urlKind === 'gestao' ? buildGestaoUrl(resolvedSlug) : buildUbtUrl(resolvedSlug)
  }, [resolvedSlug, urlKind])

  const feedback = useMemo(() => {
    if (!resolvedSlug) {
      return entityPrefix
        ? {
            tone: 'muted' as const,
            message: `Escolha um identificador curto para a unidade (será ${entityPrefix}…).`,
          }
        : { tone: 'muted' as const, message: 'Escolha um endereço único para o portal.' }
    }
    if (availability.status === 'checking') {
      return { tone: 'muted' as const, message: 'Verificando disponibilidade…' }
    }
    if (availability.status === 'available') {
      return useRemoteAvailability
        ? { tone: 'success' as const, message: 'Endereço disponível.' }
        : {
            tone: 'muted' as const,
            message: 'Formato válido. A disponibilidade será confirmada ao salvar.',
          }
    }
    if (availability.status === 'unavailable' && availability.reason) {
      return { tone: 'error' as const, message: availability.reason }
    }
    return null
  }, [availability.reason, availability.status, entityPrefix, resolvedSlug, useRemoteAvailability])

  const onAvailabilityChangeRef = useRef(onAvailabilityChange)
  onAvailabilityChangeRef.current = onAvailabilityChange
  const lastAvailabilityNotifyKeyRef = useRef('')

  useEffect(() => {
    const payload = {
      available: availability.status === 'available',
      reason: availability.reason,
      checkedValue: availability.checkedValue,
      checking: availability.status === 'checking',
    }
    const notifyKey = `${payload.checking}:${payload.available}:${payload.checkedValue}:${payload.reason ?? ''}`
    if (lastAvailabilityNotifyKeyRef.current === notifyKey) return
    lastAvailabilityNotifyKeyRef.current = notifyKey
    onAvailabilityChangeRef.current?.(payload)
  }, [availability.checkedValue, availability.reason, availability.status])

  return (
    <div className="space-y-2">
      <label className="block">
        <span className={labelClass}>{label}</span>
        <div className="flex items-stretch gap-2">
          {entityPrefix ? (
            <span className="inline-flex shrink-0 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 font-mono text-sm lowercase text-gray-600">
              {entityPrefix}
            </span>
          ) : null}
          <input
            className={`${inputClass} font-mono lowercase`}
            value={value}
            onChange={(event) => onChange(sanitizeTenantSlugInput(event.target.value))}
            placeholder={entityPrefix ? 'centro' : 'ex.: brasilia-df'}
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            aria-describedby="tenant-slug-preview tenant-slug-feedback"
          />
          {availability.status === 'checking' ? (
            <span className="inline-flex w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            </span>
          ) : availability.status === 'available' ? (
            <span className="inline-flex w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            </span>
          ) : availability.status === 'unavailable' && resolvedSlug ? (
            <span className="inline-flex w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600">
              <XCircle className="h-4 w-4" aria-hidden />
            </span>
          ) : null}
        </div>
      </label>

      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}

      <div
        id="tenant-slug-preview"
        className="flex items-start gap-2 rounded-lg border border-gray-100 bg-slate-50/90 px-3 py-2.5"
      >
        <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" aria-hidden />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Preview</p>
          <p className="truncate font-mono text-sm font-medium text-gray-900">{previewUrl}</p>
        </div>
      </div>

      {feedback ? (
        <p
          id="tenant-slug-feedback"
          role={feedback.tone === 'error' ? 'alert' : undefined}
          className={
            feedback.tone === 'success'
              ? 'text-xs font-medium text-emerald-700'
              : feedback.tone === 'error'
                ? 'text-xs font-medium text-red-600'
                : 'text-xs text-gray-500'
          }
        >
          {feedback.message}
        </p>
      ) : null}
    </div>
  )
}
