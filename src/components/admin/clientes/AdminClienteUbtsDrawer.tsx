import {
  Building2,
  ChevronDown,
  ChevronRight,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Stethoscope,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { useAdminPageAccess } from '../../../hooks/useAdminPageAccess'
import type { AdminClienteRow } from '../../../types/adminClientes'
import {
  createClienteUbt,
  deleteClienteUbt,
  fetchClienteUbts,
  isAdminClientesApiError,
  updateClienteUbt,
  type ClienteUbtPayload,
} from '../../../lib/services/admin/clientes'
import type { AdminClienteUbtRow, AdminClienteUbtsResponse } from '../../../types/adminClienteUbts'
import { maskCpfForDisplay } from '../../../utils/lgpdDisplay'
import { maskPhone } from '../../../utils/masks'
import { AdminClienteUbtFormModal } from './AdminClienteUbtFormModal'

type AdminClienteUbtsDrawerProps = {
  open: boolean
  closing: boolean
  cliente: AdminClienteRow | null
  onClose: () => void
  onTransitionEnd: () => void
}

const drawerShellClass =
  'absolute inset-y-0 right-0 z-10 flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-gray-200/90 bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none'

const labelClass = 'text-[10px] font-semibold uppercase tracking-wide text-gray-500'
const valueClass = 'text-sm font-medium text-gray-900'

function UbtStatusBadge({ status, label }: { status: AdminClienteUbtRow['status']; label: string }) {
  const tone =
    status === 'ativa'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'manutencao'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-gray-200 bg-gray-100 text-gray-600'

  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {label}
    </span>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className={`mt-0.5 ${valueClass}`}>{value || '—'}</p>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2.5 text-center">
      <p className={labelClass}>{label}</p>
      <p className="mt-0.5 text-base font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function UbtAccordionRow({
  ubt,
  expanded,
  onToggle,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  ubt: AdminClienteUbtRow
  expanded: boolean
  onToggle: () => void
  canEdit: boolean
  canDelete: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-2 py-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1 text-left transition hover:bg-slate-50/80"
          aria-expanded={expanded}
        >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
          <Building2 className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{ubt.name}</span>
            <UbtStatusBadge status={ubt.status} label={ubt.statusLabel} />
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
            <span>{ubt.region}</span>
            <span>·</span>
            <span>{ubt.unitType}</span>
            <span>·</span>
            <span>CNES {ubt.cnes || '—'}</span>
          </span>
        </span>
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
        )}
        </button>
        {canEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-[var(--brand-primary)]"
            aria-label={`Editar ${ubt.name}`}
          >
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </button>
        ) : null}
        {canDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
            aria-label={`Excluir ${ubt.name}`}
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
          </button>
        ) : null}
      </div>

      {expanded ? (
        <div className="space-y-4 border-t border-gray-100 px-4 py-4">
          <section>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">
              Identificação
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailField label="Nome" value={ubt.name} />
              <DetailField label="Região" value={ubt.region} />
              <DetailField label="CNES" value={ubt.cnes} />
              <DetailField label="Tipo" value={ubt.unitType} />
              <DetailField label="Capacidade diária" value={ubt.dailyCapacityLabel} />
              <DetailField
                label="Terminais"
                value={`${ubt.stationsOnline} online / ${ubt.stationsTotal} total${ubt.maintenanceTerminals > 0 ? ` · ${ubt.maintenanceTerminals} em manutenção` : ''}`}
              />
            </div>
          </section>

          <section>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-700">
              <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
              Endereço e contato
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <DetailField label="Endereço" value={ubt.address.formatted} />
              </div>
              <DetailField label="CEP" value={ubt.address.cep} />
              <DetailField label="Bairro" value={ubt.address.neighborhood} />
              <DetailField label="Cidade / UF" value={`${ubt.address.city} / ${ubt.address.state}`} />
              <DetailField
                label="Telefone"
                value={ubt.phone ? maskPhone(ubt.phone) : '—'}
              />
            </div>
          </section>

          <section>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-700">
              <Stethoscope className="h-3.5 w-3.5" strokeWidth={2} />
              Especialidades
            </h4>
            {ubt.specialtyNames.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma especialidade cadastrada.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {ubt.specialtyNames.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-gray-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-gray-700"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-700">
              <Users className="h-3.5 w-3.5" strokeWidth={2} />
              Responsável
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailField label="Nome" value={ubt.responsible.name} />
              <DetailField label="E-mail" value={ubt.responsible.email} />
              <DetailField
                label="CPF"
                value={ubt.responsible.cpf ? maskCpfForDisplay(ubt.responsible.cpf) : '—'}
              />
              <DetailField
                label="Telefone"
                value={ubt.responsible.phone ? maskPhone(ubt.responsible.phone) : '—'}
              />
              <DetailField
                label="Credenciais"
                value={ubt.responsible.credentialsConfigured ? 'Configuradas' : 'Pendentes'}
              />
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">
              Operadores ({ubt.operators.length})
            </h4>
            {ubt.operators.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum operador vinculado.</p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                {ubt.operators.map((operator) => (
                  <li
                    key={operator.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                  >
                    <span className="font-medium text-gray-900">{operator.name}</span>
                    <span className="text-xs text-gray-500">{operator.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">
              Métricas operacionais (hoje)
            </h4>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MetricCard label="Fila agora" value={ubt.metrics.queueNow} />
              <MetricCard label="Consultas hoje" value={ubt.metrics.consultationsToday} />
              <MetricCard label="Em atendimento" value={ubt.metrics.consultationsInProgress} />
              <MetricCard label="Concluídas" value={ubt.metrics.consultationsCompleted} />
              <MetricCard label="Operadores online" value={ubt.metrics.operatorsOnline} />
              <MetricCard label="Estações ativas" value={ubt.metrics.stationsActive} />
              <MetricCard label="Cancelamentos" value={ubt.metrics.cancellationsToday} />
              <MetricCard
                label="Tempo médio"
                value={
                  ubt.metrics.avgConsultationMinutes > 0
                    ? `${ubt.metrics.avgConsultationMinutes} min`
                    : '—'
                }
              />
            </div>
          </section>

          {ubt.notes ? (
            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">
                Observações
              </h4>
              <p className="rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2.5 text-sm text-gray-700">
                {ubt.notes}
              </p>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function AdminClienteUbtsDrawer({
  open,
  closing,
  cliente,
  onClose,
  onTransitionEnd,
}: AdminClienteUbtsDrawerProps) {
  const { getAccessToken } = useAdminAuth()
  const { pageAccess } = useAdminPageAccess('clientes')
  const [entered, setEntered] = useState(false)
  const [expandedUbtId, setExpandedUbtId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AdminClienteUbtsResponse | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingUbt, setEditingUbt] = useState<AdminClienteUbtRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const reloadUbts = useCallback(async () => {
    if (!cliente) return
    const token = getAccessToken()
    if (!token) {
      setError('Sessão expirada. Faça login novamente.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetchClienteUbts(token, cliente.id)
      setData(response)
    } catch (loadError) {
      const message = isAdminClientesApiError(loadError)
        ? loadError.message
        : 'Não foi possível carregar as UBTs.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [cliente, getAccessToken])

  async function handleSubmitUbt(payload: ClienteUbtPayload) {
    if (!cliente) return
    const token = getAccessToken()
    if (!token) {
      setActionError('Sessão expirada.')
      return
    }

    setIsSubmitting(true)
    setActionError(null)
    try {
      const response =
        formMode === 'edit' && editingUbt
          ? await updateClienteUbt(token, cliente.id, editingUbt.id, payload)
          : await createClienteUbt(token, cliente.id, payload)
      setData(response)
      setFormMode(null)
      setEditingUbt(null)
    } catch (submitError) {
      const message = isAdminClientesApiError(submitError)
        ? submitError.message
        : 'Não foi possível salvar a UBT.'
      setActionError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteUbt(ubt: AdminClienteUbtRow) {
    if (!cliente) return
    const confirmed = window.confirm(`Desativar a unidade "${ubt.name}"?`)
    if (!confirmed) return

    const token = getAccessToken()
    if (!token) {
      setActionError('Sessão expirada.')
      return
    }

    setIsSubmitting(true)
    setActionError(null)
    try {
      const response = await deleteClienteUbt(token, cliente.id, ubt.id)
      setData(response)
      if (expandedUbtId === ubt.id) setExpandedUbtId(null)
    } catch (deleteError) {
      const message = isAdminClientesApiError(deleteError)
        ? deleteError.message
        : 'Não foi possível excluir a UBT.'
      setActionError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open || !cliente) {
      setData(null)
      setError(null)
      setExpandedUbtId(null)
      setLoading(false)
      setFormMode(null)
      setEditingUbt(null)
      setActionError(null)
      return
    }

    void reloadUbts()
  }, [cliente, open, reloadUbts])

  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose])

  if (!isActive) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[9998] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${panelVisible ? 'opacity-100' : 'opacity-0'}`}
        aria-label="Fechar"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-cliente-ubts-title"
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget && event.propertyName === 'transform') {
            onTransitionEnd()
          }
        }}
        className={`${drawerShellClass} ${panelVisible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="shrink-0 border-b border-gray-200 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="admin-cliente-ubts-title" className="text-lg font-bold text-gray-900">
                UBTs da entidade
              </h2>
              <p className="mt-0.5 truncate text-sm text-gray-500">
                {cliente?.prefeitura ?? data?.prefeitura ?? '—'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {pageAccess.canInsert && cliente ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingUbt(null)
                    setFormMode('create')
                    setActionError(null)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--brand-primary)]/20 bg-[var(--brand-primary-light)]/40 px-3 py-1.5 text-xs font-semibold text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary-light)]/70"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                  Nova UBT
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                aria-label="Fechar drawer"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </div>
          {actionError ? (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {actionError}
            </p>
          ) : null}
          {data && !loading ? (
            <p className="mt-2 text-xs font-medium text-gray-500">
              {data.total} unidade{data.total === 1 ? '' : 's'} vinculada{data.total === 1 ? '' : 's'}
            </p>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" strokeWidth={2} />
              <p className="text-sm">Carregando UBTs…</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
              {error}
            </div>
          ) : data && data.ubts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-slate-50/70 px-4 py-12 text-center">
              <Building2 className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium text-gray-700">Nenhuma UBT cadastrada</p>
              <p className="mt-1 text-xs text-gray-500">
                Esta entidade ainda não possui unidades vinculadas.
              </p>
              {pageAccess.canInsert && cliente ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingUbt(null)
                    setFormMode('create')
                  }}
                  className="btn-brand-gradient mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar primeira UBT
                </button>
              ) : null}
            </div>
          ) : data ? (
            <div className="space-y-3">
              {data.ubts.map((ubt) => (
                <UbtAccordionRow
                  key={ubt.id}
                  ubt={ubt}
                  expanded={expandedUbtId === ubt.id}
                  canEdit={pageAccess.canEdit}
                  canDelete={pageAccess.canDelete}
                  onEdit={() => {
                    setEditingUbt(ubt)
                    setFormMode('edit')
                    setActionError(null)
                  }}
                  onDelete={() => void handleDeleteUbt(ubt)}
                  onToggle={() =>
                    setExpandedUbtId((current) => (current === ubt.id ? null : ubt.id))
                  }
                />
              ))}
            </div>
          ) : null}
        </div>
      </aside>

      {cliente ? (
        <AdminClienteUbtFormModal
          open={formMode !== null}
          mode={formMode === 'edit' ? 'edit' : 'create'}
          cliente={cliente}
          ubt={editingUbt}
          isSubmitting={isSubmitting}
          onClose={() => {
            if (isSubmitting) return
            setFormMode(null)
            setEditingUbt(null)
          }}
          onSubmit={handleSubmitUbt}
        />
      ) : null}
    </div>,
    document.body,
  )
}
