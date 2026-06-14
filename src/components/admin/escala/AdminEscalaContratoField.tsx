import { Check, FileText, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { AdminEscalaPrefeituraScope } from '../../../types/adminEscala'
import { getPrefeituraById } from '../../../data/adminEscalaCatalog'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import {
  fetchAdminEscalaContratos,
  type EscalaContratoOptionApi,
} from '../../../lib/services/admin/escala'
import { CustomSelect } from '../../ui/CustomSelect'

type AdminEscalaContratoFieldProps = {
  prefeituraScope: AdminEscalaPrefeituraScope
  prefeituraLabel?: string
  specialtyIds?: string[]
  value: string
  onChange: (contratoId: string, contrato: EscalaContratoOptionApi | null) => void
  onContractsLoaded?: (count: number, contratos?: EscalaContratoOptionApi[]) => void
  variant?: 'card' | 'flat' | 'nested' | 'list'
}

const boxClass =
  'rounded-2xl border border-sky-200/80 bg-sky-50/70 px-4 py-4 sm:px-5'

export function AdminEscalaContratoField({
  prefeituraScope,
  prefeituraLabel,
  specialtyIds = [],
  value,
  onChange,
  onContractsLoaded,
  variant = 'card',
}: AdminEscalaContratoFieldProps) {
  const { getAccessToken } = useAdminAuth()
  const [contratos, setContratos] = useState<EscalaContratoOptionApi[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onContractsLoadedRef = useRef(onContractsLoaded)
  onContractsLoadedRef.current = onContractsLoaded
  const valueRef = useRef(value)
  valueRef.current = value

  const scopeReady =
    prefeituraScope.mode === 'all' || prefeituraScope.prefeituraIds.length > 0
  const prefeituraKey = prefeituraScope.prefeituraIds.join(',')
  const specialtyKey = specialtyIds.join(',')

  useEffect(() => {
    if (!scopeReady) {
      setContratos([])
      onChangeRef.current('', null)
      onContractsLoadedRef.current?.(0, [])
      return
    }

    let cancelled = false
    setIsLoading(true)
    setLoadError(null)

    void (async () => {
      const token = getAccessToken()
      if (!token) {
        if (!cancelled) {
          setContratos([])
          setIsLoading(false)
          onContractsLoadedRef.current?.(0, [])
        }
        return
      }

      try {
        const result = await fetchAdminEscalaContratos(token, {
          prefeituraScope,
          specialtyIds,
        })
        if (cancelled) return
        setContratos(result)
        onContractsLoadedRef.current?.(result.length, result)

        if (result.length === 1) {
          onChangeRef.current(result[0].id, result[0])
        } else if (
          valueRef.current &&
          !result.some((item) => item.id === valueRef.current)
        ) {
          onChangeRef.current('', null)
        }
      } catch {
        if (!cancelled) {
          setLoadError('Não foi possível carregar os contratos disponíveis.')
          setContratos([])
          onContractsLoadedRef.current?.(0, [])
          onChangeRef.current('', null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [getAccessToken, prefeituraScope.mode, prefeituraKey, specialtyKey, scopeReady])

  const options = useMemo(
    () =>
      contratos.map((contrato) => ({
        value: contrato.id,
        label: contrato.label,
      })),
    [contratos],
  )

  const content = (
    <>
      {prefeituraLabel ? (
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">
          {prefeituraLabel}
        </p>
      ) : null}

      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-primary)]" />
          Verificando contratos disponíveis...
        </p>
      ) : loadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}
        </p>
      ) : contratos.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Nenhum contrato operacional encontrado. Cadastre o contrato em Admin → Clientes.
        </p>
      ) : variant === 'list' ? (
        <div className="flex flex-col gap-2">
          {contratos.map((contrato) => {
            const selected = value === contrato.id
            return (
              <button
                key={contrato.id}
                type="button"
                onClick={() => onChange(contrato.id, contrato)}
                className={[
                  'flex w-full items-start gap-3 rounded-xl px-4 py-3.5 text-left transition',
                  selected
                    ? 'bg-[var(--brand-primary-light)]/50 ring-2 ring-[var(--brand-primary)]'
                    : 'bg-white ring-1 ring-gray-200/80 hover:bg-gray-50 hover:ring-gray-300',
                ].join(' ')}
              >
                <span
                  className={[
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md',
                    selected
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'bg-gray-100 ring-1 ring-gray-200',
                  ].join(' ')}
                >
                  {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gray-900">{contrato.label}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    {contrato.tipoLabel} · {contrato.statusLabel}
                    {contrato.numero ? ` · Nº ${contrato.numero}` : ''}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <CustomSelect
          value={value}
          onChange={(nextValue) => {
            const contrato = contratos.find((item) => item.id === nextValue) ?? null
            onChange(nextValue, contrato)
          }}
          options={[{ value: '', label: 'Selecione o contrato...' }, ...options]}
          placeholder="Selecione o contrato..."
        />
      )}
    </>
  )

  if (variant === 'flat' || variant === 'list') {
    return <div className="space-y-3">{content}</div>
  }

  if (variant === 'nested') {
    return (
      <div className="rounded-xl border border-sky-100 bg-white px-3 py-3 sm:px-4">{content}</div>
    )
  }

  return <div className={boxClass}>{content}</div>
}

type AdminEscalaContratosPorPrefeituraPanelProps = {
  prefeituraIds: string[]
  contratosPorPrefeitura: Record<string, string>
  onContratoChange: (prefeituraId: string, contratoId: string) => void
  onLoadStateChange: (prefeituraId: string, state: { count: number; resolved: boolean }) => void
  specialtyIds?: string[]
}

export function AdminEscalaContratosPorPrefeituraPanel({
  prefeituraIds,
  contratosPorPrefeitura,
  onContratoChange,
  onLoadStateChange,
  specialtyIds = [],
}: AdminEscalaContratosPorPrefeituraPanelProps) {
  if (prefeituraIds.length === 0) {
    return (
      <div className={boxClass}>
        <div className="mb-3 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <FileText className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-gray-900">Contratos operacionais</h4>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
              Selecione ao menos uma prefeitura acima para escolher o contrato de cada município.
            </p>
          </div>
        </div>
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Nenhuma prefeitura selecionada.
        </p>
      </div>
    )
  }

  return (
    <div className={boxClass}>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
          <FileText className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-gray-900">Contratos operacionais</h4>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
            Cada prefeitura selecionada precisa de um contrato ativo ou em implantação vinculado à
            escala.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {prefeituraIds.map((prefeituraId) => {
          const prefeitura = getPrefeituraById(prefeituraId)
          const label = prefeitura
            ? `${prefeitura.name} · ${prefeitura.uf}`
            : 'Prefeitura'

          return (
            <AdminEscalaContratoField
              key={prefeituraId}
              variant="nested"
              prefeituraLabel={label}
              prefeituraScope={{ mode: 'selected', prefeituraIds: [prefeituraId] }}
              specialtyIds={specialtyIds}
              value={contratosPorPrefeitura[prefeituraId] ?? ''}
              onChange={(contratoId) => onContratoChange(prefeituraId, contratoId)}
              onContractsLoaded={(count) =>
                onLoadStateChange(prefeituraId, { count, resolved: true })
              }
            />
          )
        })}
      </div>
    </div>
  )
}

export type AdminEscalaContratoLoadState = {
  count: number
  resolved: boolean
}

export function validateAdminEscalaContratosPorPrefeitura(input: {
  prefeituraIds: string[]
  contratosPorPrefeitura: Record<string, string>
  loadStateByPrefeitura: Record<string, AdminEscalaContratoLoadState>
}): string | null {
  if (input.prefeituraIds.length === 0) {
    return 'Selecione ao menos uma prefeitura.'
  }

  for (const prefeituraId of input.prefeituraIds) {
    const load = input.loadStateByPrefeitura[prefeituraId]
    if (!load?.resolved) {
      return 'Aguarde a verificação dos contratos disponíveis.'
    }

    const prefeituraLabel = getPrefeituraById(prefeituraId)?.name ?? 'Prefeitura'

    if (load.count === 0) {
      return `${prefeituraLabel} não possui contrato operacional. Cadastre em Admin → Clientes.`
    }

    if (!input.contratosPorPrefeitura[prefeituraId]) {
      return `Selecione o contrato operacional de ${prefeituraLabel}.`
    }
  }

  return null
}

/** @deprecated Use validateAdminEscalaContratosPorPrefeitura */
export function validateAdminEscalaContratoSelection(input: {
  publishing: boolean
  contratoEntidadeId: string
  contratosCount: number
}): string | null {
  void input.publishing
  if (input.contratosCount === 0) {
    return 'Não há contrato operacional disponível para esta prefeitura. Cadastre o contrato em Admin → Clientes.'
  }
  if (!input.contratoEntidadeId) {
    return 'Selecione qual contrato operacional será usado nesta escala.'
  }
  return null
}
