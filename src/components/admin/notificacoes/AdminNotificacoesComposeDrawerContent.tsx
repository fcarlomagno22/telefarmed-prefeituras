import { Building2, Landmark, Search, Send } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import {
  adminNotificacaoMunicipalityFilterOptions,
  adminNotificacaoPrefeituras,
  adminNotificacaoRegionFilterOptions,
  adminNotificacaoUbts,
  adminNotificacaoUfFilterOptions,
} from '../../../data/adminNotificacoesRecipients'
import {
  buildRecipientSummary,
  type AdminBroadcast,
  type AdminNotificationPriority,
  type AdminNotificationSelectionMode,
  type AdminNotificationTargetSnapshot,
} from '../../../data/adminNotificacoesMock'
import { brand } from '../../../config/brand'
import { CustomSelect } from '../../ui/CustomSelect'

const panelShell =
  'flex min-h-0 flex-1 flex-col rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]'

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

type AdminNotificacoesComposeDrawerContentProps = {
  onSent: (broadcast: AdminBroadcast) => void
}

export function AdminNotificacoesComposeDrawerContent({
  onSent,
}: AdminNotificacoesComposeDrawerContentProps) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<AdminNotificationPriority>('normal')
  const [includePrefeituras, setIncludePrefeituras] = useState(true)
  const [includeUbts, setIncludeUbts] = useState(false)
  const [prefeituraMode, setPrefeituraMode] = useState<AdminNotificationSelectionMode>('all')
  const [ubtMode, setUbtMode] = useState<AdminNotificationSelectionMode>('all')
  const [selectedPrefeituraIds, setSelectedPrefeituraIds] = useState<Set<string>>(new Set())
  const [selectedUbtIds, setSelectedUbtIds] = useState<Set<string>>(new Set())
  const [prefeituraSearch, setPrefeituraSearch] = useState('')
  const [ubtSearch, setUbtSearch] = useState('')
  const [ufFilter, setUfFilter] = useState('all')
  const [municipalityFilter, setMunicipalityFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')

  const filteredPrefeituras = useMemo(() => {
    const query = normalizeSearch(prefeituraSearch.trim())
    return adminNotificacaoPrefeituras.filter((item) => {
      if (ufFilter !== 'all' && item.uf !== ufFilter) return false
      if (!query) return true
      return normalizeSearch(`${item.name} ${item.municipio} ${item.uf}`).includes(query)
    })
  }, [prefeituraSearch, ufFilter])

  const filteredUbts = useMemo(() => {
    const query = normalizeSearch(ubtSearch.trim())
    return adminNotificacaoUbts.filter((item) => {
      if (municipalityFilter !== 'all' && item.municipalityId !== municipalityFilter) return false
      if (regionFilter !== 'all' && item.regionKey !== regionFilter) return false
      if (!query) return true
      return normalizeSearch(`${item.name} ${item.municipalityName} ${item.region}`).includes(
        query,
      )
    })
  }, [municipalityFilter, regionFilter, ubtSearch])

  const prefeituraRecipients =
    prefeituraMode === 'all'
      ? adminNotificacaoPrefeituras
      : adminNotificacaoPrefeituras.filter((p) => selectedPrefeituraIds.has(p.id))

  const ubtRecipients =
    ubtMode === 'all'
      ? adminNotificacaoUbts
      : adminNotificacaoUbts.filter((u) => selectedUbtIds.has(u.id))

  const recipientCount = useMemo(() => {
    let count = 0
    if (includePrefeituras) count += prefeituraRecipients.length
    if (includeUbts) count += ubtRecipients.length
    return count
  }, [includePrefeituras, includeUbts, prefeituraRecipients.length, ubtRecipients.length])

  const canSend =
    title.trim().length > 0 &&
    message.trim().length > 0 &&
    (includePrefeituras || includeUbts) &&
    (!includePrefeituras ||
      prefeituraMode === 'all' ||
      (prefeituraMode === 'selected' && selectedPrefeituraIds.size > 0)) &&
    (!includeUbts || ubtMode === 'all' || (ubtMode === 'selected' && selectedUbtIds.size > 0))

  function togglePrefeitura(id: string) {
    setSelectedPrefeituraIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleUbt(id: string) {
    setSelectedUbtIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllPrefeituras() {
    setSelectedPrefeituraIds(new Set(filteredPrefeituras.map((p) => p.id)))
  }

  function clearPrefeituras() {
    setSelectedPrefeituraIds(new Set())
  }

  function selectAllUbts() {
    setSelectedUbtIds(new Set(filteredUbts.map((u) => u.id)))
  }

  function clearUbts() {
    setSelectedUbtIds(new Set())
  }

  function handleSend() {
    if (!canSend) return

    const targets: AdminNotificationTargetSnapshot[] = []

    if (includePrefeituras) {
      const list = prefeituraRecipients
      targets.push({
        channel: 'prefeitura',
        mode: prefeituraMode,
        recipientIds: prefeituraMode === 'all' ? [] : list.map((p) => p.id),
        recipientLabels:
          prefeituraMode === 'all'
            ? ['Todas as prefeituras ativas']
            : list.map((p) => p.name),
        count: list.length,
      })
    }

    if (includeUbts) {
      const list = ubtRecipients
      targets.push({
        channel: 'ubt',
        mode: ubtMode,
        recipientIds: ubtMode === 'all' ? [] : list.map((u) => u.id),
        recipientLabels: ubtMode === 'all' ? ['Todas as UBTs'] : list.map((u) => u.name),
        count: list.length,
      })
    }

    const broadcast: AdminBroadcast = {
      id: `adm-n-${Date.now()}`,
      title: title.trim(),
      body: message.trim(),
      sentAt: new Date().toISOString(),
      priority,
      sentBy: brand.adminOperatorName,
      targets,
      recipientCount,
      recipientSummary: buildRecipientSummary(targets),
    }

    onSent(broadcast)
    setTitle('')
    setMessage('')
    setPriority('normal')
    setIncludePrefeituras(true)
    setIncludeUbts(false)
    setPrefeituraMode('all')
    setUbtMode('all')
    setSelectedPrefeituraIds(new Set())
    setSelectedUbtIds(new Set())
    setPrefeituraSearch('')
    setUbtSearch('')
    setUfFilter('all')
    setMunicipalityFilter('all')
    setRegionFilter('all')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
      <section className="flex min-h-0 w-full shrink-0 flex-col gap-4 lg:w-[min(100%,22rem)] xl:w-[min(100%,26rem)]">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Assunto
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do comunicado"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[var(--brand-primary)]/40 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)]"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Mensagem
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escreva o comunicado..."
            className="min-h-[8rem] flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[var(--brand-primary)]/40 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)] lg:min-h-[10rem]"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Prioridade
          </label>
          <CustomSelect
            value={priority}
            onChange={(value) => setPriority(value as AdminNotificationPriority)}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'important', label: 'Importante' },
            ]}
          />
        </div>

        <div className="space-y-3 rounded-xl border border-gray-200 bg-slate-50/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Destino</p>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
            <input
              type="checkbox"
              checked={includePrefeituras}
              onChange={(e) => setIncludePrefeituras(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
            />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                <Landmark className="h-4 w-4 text-violet-600" strokeWidth={2} />
                Prefeituras
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Gestão municipal e contrato
              </span>
            </span>
          </label>

          {includePrefeituras ? (
            <div className="ml-2 space-y-2 border-l-2 border-violet-200 pl-3">
              <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
                {(
                  [
                    { value: 'all', label: 'Todas' },
                    { value: 'selected', label: 'Selecionar' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPrefeituraMode(opt.value)}
                    className={[
                      'rounded-md px-2.5 py-1.5 text-xs font-semibold',
                      prefeituraMode === opt.value
                        ? 'bg-violet-100 text-violet-800'
                        : 'text-gray-600',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
            <input
              type="checkbox"
              checked={includeUbts}
              onChange={(e) => setIncludeUbts(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
            />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                <Building2 className="h-4 w-4 text-sky-600" strokeWidth={2} />
                UBTs
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">Unidades da rede de atendimento</span>
            </span>
          </label>

          {includeUbts ? (
            <div className="ml-2 space-y-2 border-l-2 border-sky-200 pl-3">
              <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
                {(
                  [
                    { value: 'all', label: 'Todas' },
                    { value: 'selected', label: 'Selecionar' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setUbtMode(opt.value)}
                    className={[
                      'rounded-md px-2.5 py-1.5 text-xs font-semibold',
                      ubtMode === opt.value ? 'bg-sky-100 text-sky-800' : 'text-gray-600',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="btn-brand-gradient inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" strokeWidth={2} />
          Enviar para {recipientCount} destinatário{recipientCount === 1 ? '' : 's'}
        </button>
      </section>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 lg:flex-row">
        {includePrefeituras && prefeituraMode === 'selected' ? (
          <RecipientListPanel
            title="Prefeituras"
            description={`${selectedPrefeituraIds.size} de ${filteredPrefeituras.length} selecionada(s)`}
            search={prefeituraSearch}
            onSearchChange={setPrefeituraSearch}
            searchPlaceholder="Buscar prefeitura..."
            filters={
              <>
                <CustomSelect
                  value={ufFilter}
                  onChange={setUfFilter}
                  options={[...adminNotificacaoUfFilterOptions]}
                />
              </>
            }
            onSelectAll={selectAllPrefeituras}
            onClear={clearPrefeituras}
            emptyLabel="Nenhuma prefeitura com os filtros atuais."
          >
            {filteredPrefeituras.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-slate-50/50 px-3 py-2.5 hover:bg-white">
                  <input
                    type="checkbox"
                    checked={selectedPrefeituraIds.has(item.id)}
                    onChange={() => togglePrefeitura(item.id)}
                    className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">{item.name}</span>
                    <span className="text-xs text-gray-500">
                      {item.municipio} · {item.uf}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </RecipientListPanel>
        ) : null}

        {includeUbts && ubtMode === 'selected' ? (
          <RecipientListPanel
            title="UBTs"
            description={`${selectedUbtIds.size} de ${filteredUbts.length} selecionada(s)`}
            search={ubtSearch}
            onSearchChange={setUbtSearch}
            searchPlaceholder="Buscar UBT..."
            filters={
              <>
                <CustomSelect
                  value={municipalityFilter}
                  onChange={setMunicipalityFilter}
                  options={[...adminNotificacaoMunicipalityFilterOptions]}
                />
                <CustomSelect
                  value={regionFilter}
                  onChange={setRegionFilter}
                  options={[...adminNotificacaoRegionFilterOptions]}
                />
              </>
            }
            onSelectAll={selectAllUbts}
            onClear={clearUbts}
            emptyLabel="Nenhuma UBT com os filtros atuais."
          >
            {filteredUbts.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-slate-50/50 px-3 py-2.5 hover:bg-white">
                  <input
                    type="checkbox"
                    checked={selectedUbtIds.has(item.id)}
                    onChange={() => toggleUbt(item.id)}
                    className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">{item.name}</span>
                    <span className="text-xs text-gray-500">
                      {item.municipalityName} · {item.region}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </RecipientListPanel>
        ) : null}

        {(!includePrefeituras || prefeituraMode === 'all') &&
        (!includeUbts || ubtMode === 'all') ? (
          <section className={`${panelShell} flex flex-1 items-center justify-center p-8`}>
            <p className="max-w-sm text-center text-sm text-gray-500">
              {includePrefeituras && includeUbts
                ? 'O comunicado será enviado para todas as prefeituras ativas e todas as UBTs da plataforma.'
                : includePrefeituras
                  ? 'O comunicado será enviado para todas as prefeituras ativas cadastradas.'
                  : includeUbts
                    ? 'O comunicado será enviado para todas as UBTs da rede.'
                    : 'Marque pelo menos um tipo de destinatário.'}
            </p>
          </section>
        ) : null}
      </div>
    </div>
  )
}

function RecipientListPanel({
  title,
  description,
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  onSelectAll,
  onClear,
  emptyLabel,
  children,
}: {
  title: string
  description: string
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  filters: React.ReactNode
  onSelectAll: () => void
  onClear: () => void
  emptyLabel: string
  children: ReactNode
}) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0)

  return (
    <section className={`${panelShell} flex min-h-[14rem] min-w-0 flex-1 flex-col lg:min-h-0`}>
      <header className="shrink-0 space-y-3 border-b border-gray-100 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--brand-primary)]/40"
          />
        </div>
        <div className="grid gap-2">{filters}</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Marcar visíveis
          </button>
          <button
            type="button"
            onClick={onClear}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Limpar
          </button>
        </div>
      </header>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {isEmpty ? (
          <li className="py-8 text-center text-sm text-gray-500">{emptyLabel}</li>
        ) : (
          children
        )}
      </ul>
    </section>
  )
}
