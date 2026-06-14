import type { ReactNode } from 'react'
import { Building2, Check } from 'lucide-react'
import {
  getAdminEscalaPrefeituras,
  getUbtsForPrefeituraIds,
} from '../../../data/adminEscalaCatalog'
import type {
  AdminEscalaPrefeituraScope,
  AdminEscalaUbtScope,
  AdminEscalaUbtScopeMode,
} from '../../../types/adminEscala'
import {
  escalaComposeSegmentBtn,
  escalaComposeSegmentClass,
} from './adminEscalaComposePremium'

type AdminEscalaComposeScopeCompactProps = {
  prefeituraScope: AdminEscalaPrefeituraScope
  ubtScope: AdminEscalaUbtScope
  showUbtFields: boolean
  ubtOnly?: boolean
  onPrefeituraScopeChange: (scope: AdminEscalaPrefeituraScope) => void
  onUbtScopeChange: (scope: AdminEscalaUbtScope) => void
}

function toggleId(ids: string[], id: string) {
  const set = new Set(ids)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  return [...set]
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-sm font-semibold text-gray-900">{children}</p>
}

export function AdminEscalaComposeScopeCompact({
  prefeituraScope,
  ubtScope,
  showUbtFields,
  ubtOnly = false,
  onPrefeituraScopeChange,
  onUbtScopeChange,
}: AdminEscalaComposeScopeCompactProps) {
  const prefeituras = getAdminEscalaPrefeituras()
  const selectedIds =
    prefeituraScope.mode === 'all'
      ? prefeituras.map((p) => p.id)
      : prefeituraScope.prefeituraIds
  const availableUbts = getUbtsForPrefeituraIds(selectedIds)

  function togglePrefeitura(id: string) {
    const prefeituraIds = toggleId(prefeituraScope.prefeituraIds, id)
    onPrefeituraScopeChange({ mode: 'selected', prefeituraIds })
    const allowed = new Set(getUbtsForPrefeituraIds(prefeituraIds).map((u) => u.id))
    if (ubtScope.mode === 'selected') {
      onUbtScopeChange({
        ...ubtScope,
        ubtIds: ubtScope.ubtIds.filter((ubtId) => allowed.has(ubtId)),
      })
    }
  }

  function setUbtMode(mode: AdminEscalaUbtScopeMode) {
    onUbtScopeChange({
      mode,
      ubtIds: mode === 'selected' ? ubtScope.ubtIds : [],
    })
  }

  const ubtSection = (
    <div>
      <div className={`${escalaComposeSegmentClass} mb-4 inline-flex flex-wrap`}>
        {(
          [
            { value: 'all' as const, label: 'Todas as UBTs' },
            { value: 'selected' as const, label: 'Escolher UBT' },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setUbtMode(opt.value)}
            className={escalaComposeSegmentBtn(ubtScope.mode === opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {ubtScope.mode === 'selected' ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {availableUbts.length === 0 ? (
            <p className="col-span-full rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
              Nenhuma UBT disponível para a prefeitura selecionada.
            </p>
          ) : (
            availableUbts.map((u) => {
              const selected = ubtScope.ubtIds.includes(u.id)
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() =>
                    onUbtScopeChange({
                      mode: 'selected',
                      ubtIds: toggleId(ubtScope.ubtIds, u.id),
                    })
                  }
                  className={[
                    'flex items-start gap-3 rounded-xl px-4 py-3 text-left transition',
                    selected
                      ? 'bg-sky-50 ring-2 ring-sky-400/80'
                      : 'bg-gray-50 ring-1 ring-gray-200/80 hover:bg-white hover:ring-gray-300',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md',
                      selected ? 'bg-sky-500 text-white' : 'bg-white ring-1 ring-gray-200',
                    ].join(' ')}
                  >
                    {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">{u.name}</span>
                    <span className="block text-xs text-gray-500">{u.municipalityName}</span>
                  </span>
                </button>
              )
            })
          )}
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-gray-600">
          <Building2 className="h-4 w-4 text-sky-600" />
          {availableUbts.length} UBT{availableUbts.length === 1 ? '' : 's'} incluídas
        </p>
      )}
    </div>
  )

  if (ubtOnly) {
    return ubtSection
  }

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel>Selecione a prefeitura</FieldLabel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {prefeituras.map((p) => {
            const selected = prefeituraScope.prefeituraIds.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePrefeitura(p.id)}
                className={[
                  'group relative flex flex-col rounded-xl px-4 py-4 text-left transition',
                  selected
                    ? 'bg-[var(--brand-primary-light)]/60 ring-2 ring-[var(--brand-primary)]'
                    : 'bg-gray-50 ring-1 ring-gray-200/80 hover:bg-white hover:ring-gray-300',
                ].join(' ')}
              >
                {selected ? (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : null}
                <span className="text-sm font-bold text-gray-900">{p.name}</span>
                <span className="mt-0.5 text-xs text-gray-500">{p.uf}</span>
              </button>
            )
          })}
        </div>
      </div>

      {showUbtFields ? ubtSection : null}
    </div>
  )
}
