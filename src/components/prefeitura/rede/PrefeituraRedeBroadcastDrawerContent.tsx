import { Building2, Send, Stethoscope, UserRound, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { usePrefeituraAuth } from '../../../contexts/PrefeituraAuthContext'
import { usePrefeituraNotificacoes } from '../../../contexts/PrefeituraNotificacoesContext'
import {
  createPrefeituraBroadcast,
  fetchPrefeituraBroadcastUbtCatalog,
  fetchPrefeituraProfissionaisCatalog,
  type PrefeituraProfissionalRecipient,
} from '../../../lib/services/prefeitura/notificacoes'
import { mapApiUnitToRedeUnit } from '../../../lib/services/prefeitura/rede'
import {
  broadcastRecipientScopeOptions,
  type BroadcastRecipientScope,
  type PrefeituraRedeUbtOperator,
} from '../../../data/prefeituraRedeBroadcastMock'
import type { PrefeituraRedeUnit } from '../../../data/prefeituraRedeMock'
import { CustomSelect } from '../../ui/CustomSelect'

export const prefeituraRedeBroadcastDrawerPanelShell =
  'flex min-h-0 w-full flex-1 flex-col rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]'

const broadcastScopeIcons = {
  ubt: Building2,
  responsible: UserRound,
  operators: Users,
} as const

type RecipientTarget = 'ubt' | 'medico'
type ProfissionalMode = 'all' | 'selected'

type PrefeituraRedeBroadcastDrawerContentProps = {
  onSuccess: (message: string) => void
}

export function PrefeituraRedeBroadcastDrawerContent({
  onSuccess,
}: PrefeituraRedeBroadcastDrawerContentProps) {
  const { getAccessToken } = usePrefeituraAuth()
  const { reload } = usePrefeituraNotificacoes()
  const [catalogUnits, setCatalogUnits] = useState<PrefeituraRedeUnit[]>([])
  const [catalogOperators, setCatalogOperators] = useState<PrefeituraRedeUbtOperator[]>([])
  const [catalogProfissionais, setCatalogProfissionais] = useState<PrefeituraProfissionalRecipient[]>([])
  const [regionFilterOptions, setRegionFilterOptions] = useState([
    { value: 'todas', label: 'Todas as regiões' },
  ])
  const [message, setMessage] = useState('')
  const [region, setRegion] = useState('todas')
  const [isSending, setIsSending] = useState(false)
  const [recipientTarget, setRecipientTarget] = useState<RecipientTarget>('ubt')
  const [profissionalMode, setProfissionalMode] = useState<ProfissionalMode>('all')
  const [recipientScope, setRecipientScope] = useState<BroadcastRecipientScope>('ubt')
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set())
  const [selectedOperatorIds, setSelectedOperatorIds] = useState<Set<string>>(new Set())
  const [selectedProfissionalIds, setSelectedProfissionalIds] = useState<Set<string>>(new Set())
  const [profissionalSearch, setProfissionalSearch] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadCatalog() {
      const token = getAccessToken()
      if (!token) return

      try {
        const catalog = await fetchPrefeituraBroadcastUbtCatalog(token)
        if (cancelled) return
        setCatalogUnits(catalog.units.map(mapApiUnitToRedeUnit))
        setCatalogOperators(catalog.operators)
        setRegionFilterOptions(catalog.regionOptions)
      } catch {
        // Mantém listas vazias — broadcast exige unidades reais da entidade.
      }
    }

    void loadCatalog()
    return () => {
      cancelled = true
    }
  }, [getAccessToken])

  useEffect(() => {
    if (recipientTarget !== 'medico') return

    let cancelled = false

    async function loadProfissionais() {
      const token = getAccessToken()
      if (!token) return

      try {
        const result = await fetchPrefeituraProfissionaisCatalog(token, {
          search: profissionalSearch.trim() || undefined,
        })
        if (!cancelled) setCatalogProfissionais(result.profissionais)
      } catch {
        if (!cancelled) setCatalogProfissionais([])
      }
    }

    void loadProfissionais()
    return () => {
      cancelled = true
    }
  }, [getAccessToken, recipientTarget, profissionalSearch])

  const units = useMemo(() => {
    if (region === 'todas') return catalogUnits
    return catalogUnits.filter((unit) => unit.regionKey === region)
  }, [catalogUnits, region])

  const visibleOperators = useMemo(() => {
    const unitIds = selectedUnits
    return catalogOperators.filter((operator) => unitIds.has(operator.unitId))
  }, [catalogOperators, selectedUnits])

  const recipientCount = useMemo(() => {
    if (recipientTarget === 'medico') {
      return profissionalMode === 'all'
        ? catalogProfissionais.length
        : selectedProfissionalIds.size
    }
    if (recipientScope === 'operators') return selectedOperatorIds.size
    return selectedUnits.size
  }, [
    recipientTarget,
    profissionalMode,
    catalogProfissionais.length,
    selectedProfissionalIds.size,
    recipientScope,
    selectedUnits,
    selectedOperatorIds,
  ])

  const canSend =
    message.trim().length > 0 &&
    (recipientTarget === 'medico'
      ? profissionalMode === 'all'
        ? catalogProfissionais.length > 0
        : selectedProfissionalIds.size > 0
      : selectedUnits.size > 0 &&
        (recipientScope !== 'operators' || selectedOperatorIds.size > 0))

  const sendButtonLabel = useMemo(() => {
    if (recipientTarget === 'medico') {
      return `Notificar ${recipientCount} profissional${recipientCount === 1 ? '' : 'is'}`
    }
    if (recipientScope === 'ubt') {
      return `Notificar ${recipientCount} UBT${recipientCount === 1 ? '' : 's'}`
    }
    if (recipientScope === 'responsible') {
      return `Notificar ${recipientCount} responsável${recipientCount === 1 ? '' : 'is'}`
    }
    return `Notificar ${recipientCount} operadora${recipientCount === 1 ? '' : 's'}`
  }, [recipientCount, recipientScope, recipientTarget])

  function toggleProfissional(id: string) {
    setSelectedProfissionalIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllProfissionais() {
    setSelectedProfissionalIds(new Set(catalogProfissionais.map((item) => item.id)))
  }

  function clearProfissionais() {
    setSelectedProfissionalIds(new Set())
  }

  function removeOperatorsForUnit(unitId: string, operatorIds: Set<string>) {
    catalogOperators
      .filter((operator) => operator.unitId === unitId)
      .forEach((operator) => operatorIds.delete(operator.id))
  }

  function toggleUnit(id: string) {
    setSelectedUnits((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setSelectedOperatorIds((operators) => {
          const updated = new Set(operators)
          removeOperatorsForUnit(id, updated)
          return updated
        })
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleOperator(id: string) {
    setSelectedOperatorIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllVisibleUnits() {
    setSelectedUnits(new Set(units.map((unit) => unit.id)))
  }

  function clearAllVisibleUnits() {
    setSelectedUnits(new Set())
    setSelectedOperatorIds(new Set())
  }

  function selectAllVisibleOperators() {
    setSelectedOperatorIds(new Set(visibleOperators.map((operator) => operator.id)))
  }

  function clearAllVisibleOperators() {
    setSelectedOperatorIds(new Set())
  }

  function resetForm() {
    setMessage('')
    setRegion('todas')
    setRecipientTarget('ubt')
    setProfissionalMode('all')
    setRecipientScope('ubt')
    setSelectedUnits(new Set())
    setSelectedOperatorIds(new Set())
    setSelectedProfissionalIds(new Set())
    setProfissionalSearch('')
  }

  async function handleSend() {
    if (!canSend || isSending) return

    let successMessage: string
    if (recipientTarget === 'medico') {
      successMessage = `Mensagem enviada para ${recipientCount} profissional${recipientCount === 1 ? '' : 'is'}.`
    } else if (recipientScope === 'ubt') {
      successMessage = `Mensagem enviada para ${recipientCount} UBT${recipientCount === 1 ? ' inteira' : 's inteiras'}.`
    } else if (recipientScope === 'responsible') {
      successMessage = `Mensagem enviada para ${recipientCount} responsável${recipientCount === 1 ? '' : 'is'} pela unidade.`
    } else {
      successMessage = `Mensagem enviada para ${recipientCount} operadora${recipientCount === 1 ? '' : 's'} selecionada${recipientCount === 1 ? '' : 's'}.`
    }

    const token = getAccessToken()
    setIsSending(true)
    try {
      if (token) {
        const result =
          recipientTarget === 'medico'
            ? await createPrefeituraBroadcast(token, {
                recipientTarget: 'medico',
                message: message.trim(),
                mode: profissionalMode,
                profissionalIds:
                  profissionalMode === 'selected' ? [...selectedProfissionalIds] : undefined,
              })
            : await createPrefeituraBroadcast(token, {
                recipientTarget: 'ubt',
                message: message.trim(),
                recipientScope,
                unitIds: [...selectedUnits],
                operatorIds:
                  recipientScope === 'operators' ? [...selectedOperatorIds] : undefined,
              })
        successMessage = result.message
        await reload()
      }

      onSuccess(successMessage)
      resetForm()
    } finally {
      setIsSending(false)
    }
  }

  const activeScope = broadcastRecipientScopeOptions.find((option) => option.id === recipientScope)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
      <section className="flex min-h-0 w-full shrink-0 flex-col gap-4 lg:w-[min(100%,22rem)] xl:w-[min(100%,26rem)]">
        <div className="flex min-h-0 flex-1 flex-col">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Mensagem
          </label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Escreva o comunicado para os destinatários selecionados..."
            className="min-h-[10rem] flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[var(--brand-primary)]/40 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)] lg:min-h-[12rem]"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Público
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setRecipientTarget('ubt')}
              className={[
                'flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                recipientTarget === 'ubt'
                  ? 'border-[var(--brand-primary)]/35 bg-[var(--brand-primary-light)]/50'
                  : 'border-gray-200 bg-white hover:border-gray-300',
              ].join(' ')}
            >
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
              <span>
                <span className="block text-sm font-bold text-gray-900">Unidades (UBT)</span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  Credenciais de operadores e responsáveis
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRecipientTarget('medico')}
              className={[
                'flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                recipientTarget === 'medico'
                  ? 'border-[var(--brand-primary)]/35 bg-[var(--brand-primary-light)]/50'
                  : 'border-gray-200 bg-white hover:border-gray-300',
              ].join(' ')}
            >
              <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
              <span>
                <span className="block text-sm font-bold text-gray-900">Profissionais</span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  Médicos vinculados ao contrato municipal
                </span>
              </span>
            </button>
          </div>
        </div>

        {recipientTarget === 'ubt' ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Destinatário
          </p>
          <div className="grid gap-2">
            {broadcastRecipientScopeOptions.map((option) => {
              const Icon = broadcastScopeIcons[option.id]
              const active = recipientScope === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRecipientScope(option.id)}
                  className={[
                    'flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                    active
                      ? 'border-[var(--brand-primary)]/35 bg-[var(--brand-primary-light)]/50 shadow-[0_0_0_3px_rgba(255,107,0,0.1)]'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-slate-50/80',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      active
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'bg-slate-100 text-gray-500',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-gray-900">{option.label}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                      {option.description}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        ) : (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Escopo
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setProfissionalMode('all')}
                className={[
                  'rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition',
                  profissionalMode === 'all'
                    ? 'border-[var(--brand-primary)]/35 bg-[var(--brand-primary-light)]/50 text-gray-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                ].join(' ')}
              >
                Todos os profissionais
              </button>
              <button
                type="button"
                onClick={() => setProfissionalMode('selected')}
                className={[
                  'rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition',
                  profissionalMode === 'selected'
                    ? 'border-[var(--brand-primary)]/35 bg-[var(--brand-primary-light)]/50 text-gray-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                ].join(' ')}
              >
                Selecionar profissionais
              </button>
            </div>
          </div>
        )}

        {recipientTarget === 'ubt' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Região
            </label>
            <CustomSelect
              value={region}
              onChange={setRegion}
              options={regionFilterOptions}
            />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-1">
            <button
              type="button"
              onClick={selectAllVisibleUnits}
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Marcar UBTs
            </button>
            <button
              type="button"
              onClick={clearAllVisibleUnits}
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Limpar UBTs
            </button>
          </div>
        </div>
        ) : profissionalMode === 'selected' ? (
          <div>
            <input
              type="search"
              value={profissionalSearch}
              onChange={(event) => setProfissionalSearch(event.target.value)}
              placeholder="Buscar profissional"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)]/40"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={selectAllProfissionais}
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Marcar todos
              </button>
              <button
                type="button"
                onClick={clearProfissionais}
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Limpar
              </button>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="btn-brand-gradient inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" strokeWidth={2} />
          {sendButtonLabel}
        </button>
      </section>

      <section
        className={`${prefeituraRedeBroadcastDrawerPanelShell} flex min-h-[14rem] flex-1 flex-col lg:min-h-0`}
      >
        <header className="flex shrink-0 flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">
              {recipientTarget === 'medico'
                ? 'Profissionais do contrato'
                : recipientScope === 'operators'
                  ? 'UBTs e operadoras'
                  : 'Unidades (UBT)'}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {recipientTarget === 'medico'
                ? profissionalMode === 'all'
                  ? `${catalogProfissionais.length} profissional(is) vinculado(s) à prefeitura`
                  : `${selectedProfissionalIds.size} de ${catalogProfissionais.length} selecionado(s)`
                : activeScope?.description}
            </p>
            {recipientTarget === 'ubt' ? (
            <p className="mt-1 text-xs font-medium text-gray-600">
              {selectedUnits.size} de {units.length} UBT{units.length === 1 ? '' : 's'} selecionada
              {units.length === 1 ? '' : 's'}
              {recipientScope === 'operators'
                ? ` · ${selectedOperatorIds.size} operadora${selectedOperatorIds.size === 1 ? '' : 's'}`
                : null}
            </p>
            ) : null}
          </div>
          {recipientTarget === 'ubt' ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectAllVisibleUnits}
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Marcar UBTs
            </button>
            <button
              type="button"
              onClick={clearAllVisibleUnits}
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Limpar UBTs
            </button>
            {recipientScope === 'operators' ? (
              <>
                <button
                  type="button"
                  onClick={selectAllVisibleOperators}
                  disabled={selectedUnits.size === 0}
                  className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Marcar operadoras
                </button>
                <button
                  type="button"
                  onClick={clearAllVisibleOperators}
                  className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Limpar operadoras
                </button>
              </>
            ) : null}
          </div>
          ) : null}
        </header>

        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain p-3 sm:p-4">
          {recipientTarget === 'medico'
            ? catalogProfissionais.map((profissional) => {
                const selected =
                  profissionalMode === 'all' || selectedProfissionalIds.has(profissional.id)
                return (
                  <li
                    key={profissional.id}
                    className={[
                      'overflow-hidden rounded-xl border transition',
                      selected
                        ? 'border-[var(--brand-primary)]/25 bg-[var(--brand-primary-light)]/15'
                        : 'border-gray-100 bg-slate-50/50',
                    ].join(' ')}
                  >
                    {profissionalMode === 'selected' ? (
                      <label className="flex cursor-pointer items-start gap-3 px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProfissionalIds.has(profissional.id)}
                          onChange={() => toggleProfissional(profissional.id)}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-[var(--brand-primary)]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-gray-900">
                            {profissional.name}
                          </span>
                          <span className="text-xs text-gray-500">{profissional.specialty}</span>
                        </span>
                      </label>
                    ) : (
                      <div className="px-3 py-3">
                        <span className="block text-sm font-semibold text-gray-900">
                          {profissional.name}
                        </span>
                        <span className="text-xs text-gray-500">{profissional.specialty}</span>
                      </div>
                    )}
                  </li>
                )
              })
            : units.map((unit) => {
            const unitSelected = selectedUnits.has(unit.id)
            const unitOperators = catalogOperators.filter((operator) => operator.unitId === unit.id)

            return (
              <li
                key={unit.id}
                className={[
                  'overflow-hidden rounded-xl border transition',
                  unitSelected
                    ? 'border-[var(--brand-primary)]/25 bg-[var(--brand-primary-light)]/15'
                    : 'border-gray-100 bg-slate-50/50',
                ].join(' ')}
              >
                <label className="flex cursor-pointer items-start gap-3 px-3 py-3 transition hover:bg-white/80">
                  <input
                    type="checkbox"
                    checked={unitSelected}
                    onChange={() => toggleUnit(unit.id)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-900">{unit.name}</span>
                    <span className="text-xs text-gray-500">{unit.region}</span>
                    {recipientScope === 'responsible' ? (
                      <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-700">
                        <UserRound
                          className="h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]"
                          strokeWidth={2}
                        />
                        Responsável: {unit.responsibleName}
                      </span>
                    ) : null}
                    {recipientScope === 'ubt' && unitSelected ? (
                      <span className="mt-1 block text-[11px] font-semibold text-[var(--brand-primary)]">
                        Toda a unidade receberá o comunicado
                      </span>
                    ) : null}
                  </span>
                </label>

                {recipientScope === 'operators' && unitSelected ? (
                  <ul className="space-y-1 border-t border-[var(--brand-primary)]/10 bg-white/70 px-2 py-2">
                    {unitOperators.map((operator) => (
                      <li key={operator.id}>
                        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={selectedOperatorIds.has(operator.id)}
                            onChange={() => toggleOperator(operator.id)}
                            className="h-4 w-4 shrink-0 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-gray-900">
                              {operator.name}
                            </span>
                            <span className="text-xs text-gray-500">{operator.role}</span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            )
          })}
          {recipientTarget === 'medico' && catalogProfissionais.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-gray-500">
              Nenhum profissional vinculado a esta prefeitura.
            </li>
          ) : null}
        </ul>

        {recipientTarget === 'ubt' && recipientScope === 'operators' && selectedUnits.size > 0 && selectedOperatorIds.size === 0 ? (
          <p className="shrink-0 border-t border-amber-100 bg-amber-50/80 px-4 py-2.5 text-xs text-amber-900">
            Selecione ao menos uma operadora nas UBTs marcadas.
          </p>
        ) : null}
      </section>
    </div>
  )
}
