import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import { Fragment, useCallback, useEffect, useState } from 'react'
import {
  adminClientesStatusFilterOptions,
  type AdminClienteContrato,
  type AdminClienteRow,
  type AdminClienteStatus,
} from '../../../types/adminClientes'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { useAdminClientesClinicoCatalog } from '../../../hooks/useAdminClientesClinicoCatalog'
import {
  resolveClienteContratoTipoLabel,
  useAdminClientesContratoCatalog,
} from '../../../hooks/useAdminClientesContratoCatalog'
import { useAdminClientesPin } from '../../../hooks/useAdminClientesPin'
import { canAdminDeleteClientesAndContratos } from '../../../config/adminClientesDeleteAuthorization'
import {
  createClienteContrato,
  deleteClienteContrato,
  deleteClienteEntidade,
  isAdminClientesApiError,
  updateClienteContrato,
  updateClienteContratoStatus,
  updateClienteEntidade,
  updateClienteEntidadeContacts,
  updateClienteEntidadeStatus,
} from '../../../lib/services/admin/clientes'
import { maskCnpj } from '../../../utils/masks'
import { buildCreateContratoPayloadFromForm } from './adminClienteContratoForm'
import { buildUpdateContratoPayloadFromForm } from './adminClienteContratoForm'
import type { AddContratoFormState } from './adminClienteContratoForm'
import type { ClientePinAction } from '../../../hooks/useAdminClientesPin'
import { CustomSelect } from '../../ui/CustomSelect'
import { DashCard } from '../../prefeitura/prefeituraDashboardUi'
import { AdminClienteContratoActionsMenu } from './AdminClienteContratoActionsMenu'
import { AdminClienteEntidadeActionsMenu } from './AdminClienteEntidadeActionsMenu'
import { AdminClienteEntidadeDeleteConfirmModal } from './AdminClienteEntidadeDeleteConfirmModal'
import { AdminClienteEntidadeStatusModal } from './AdminClienteEntidadeStatusModal'
import { AdminClienteEntidadeEditDrawer } from './AdminClienteEntidadeEditDrawer'
import { buildEntidadeBrandingUpdatePayload } from './adminEntidadeUpdatePayload'
import { AdminClienteContratoDeleteConfirmModal } from './AdminClienteContratoDeleteConfirmModal'
import { AdminClienteAddContratoDrawer } from './AdminClienteAddContratoDrawer'
import { AdminClienteUbtsDrawer } from './AdminClienteUbtsDrawer'
import { AdminClienteContratoConfirmModal } from './AdminClienteContratoConfirmModal'
import { AdminClienteContratoDrawer } from './AdminClienteContratoDrawer'
import { AdminClienteEntidadeDrawer } from './AdminClienteEntidadeDrawer'
import { AdminClienteContratoStatusBadge } from './AdminClienteContratoStatusBadge'
import { AdminClienteStatusBadge } from './AdminClienteStatusBadge'
import { formatContratoUtilizacao, type AdminClienteContratoAction } from './adminClienteContratoActions'
import { ADMIN_CLIENTE_TABLE_COL_COUNT, formatAdminClientesNumber } from './adminClientesUi'
import { resolveEntidadeTipoLabel } from '../../../config/adminEntidadeTipo'

type AdminClientesTableProps = {
  rows: AdminClienteRow[]
  searchQuery: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  onUpsertRow: (row: AdminClienteRow) => void
  onRemoveRow: (entidadeId: string) => void
  onReload: () => Promise<void>
  onToast: (message: string) => void
  isLoading?: boolean
}

type PendingContratoAction = {
  clienteId: string
  contratoId: string
  entidadeNome: string
  contratoLabel: string
  action: AdminClienteContratoAction
}

type PendingEntidadeDelete = {
  clienteId: string
  entidadeNome: string
}

type PendingContratoDelete = {
  clienteId: string
  contratoId: string
  entidadeNome: string
  contratoLabel: string
}

function ClienteFavicon({
  hue,
  name,
  faviconUrl,
}: {
  hue: number
  name: string
  faviconUrl?: string
}) {
  const imageUrl = faviconUrl?.trim()
  const initial = name.trim().charAt(0).toUpperCase()
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="h-9 w-9 shrink-0 rounded-lg border border-gray-200 bg-white object-contain p-1 shadow-sm"
      />
    )
  }
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
      style={{ background: `hsl(${hue} 65% 45%)` }}
      aria-hidden
    >
      {initial}
    </span>
  )
}

function ContactCell({
  contact,
  centered = false,
}: {
  contact: AdminClienteRow['gestor']
  centered?: boolean
}) {
  return (
    <div
      className={[
        'min-w-0 max-w-[11rem]',
        centered ? 'mx-auto text-center' : '',
      ].join(' ')}
    >
      <p className="font-medium text-gray-900">{contact.name}</p>
      <p className={['mt-0.5 text-xs text-gray-500', centered ? '' : 'truncate'].join(' ')}>
        {contact.email}
      </p>
    </div>
  )
}

function getContratoLabel(contrato: AdminClienteContrato, contratoTipoLabels: Record<string, string>) {
  return `${resolveClienteContratoTipoLabel(contratoTipoLabels, contrato.tipo)} · assinado em ${contrato.dataAssinatura}`
}

const CONTRATO_PIN_ACTION: Record<AdminClienteContratoAction, ClientePinAction> = {
  suspender: 'contrato_suspender',
  reativar: 'contrato_reativar',
  encerrar: 'contrato_encerrar',
}

export function AdminClientesTable({
  rows,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onUpsertRow,
  onRemoveRow,
  onReload,
  onToast,
  isLoading = false,
}: AdminClientesTableProps) {
  const { getAccessToken, user } = useAdminAuth()
  const canDeleteClientes = canAdminDeleteClientesAndContratos(user?.cpf)
  const { specialties, professions } = useAdminClientesClinicoCatalog()
  const { labelById: contratoTipoLabels } = useAdminClientesContratoCatalog()
  const { requestPin, pinModal } = useAdminClientesPin()
  const [expandedClienteId, setExpandedClienteId] = useState<string | null>(null)
  const [openEntityMenuId, setOpenEntityMenuId] = useState<string | null>(null)
  const [openContratoMenuKey, setOpenContratoMenuKey] = useState<string | null>(null)
  const [viewEntity, setViewEntity] = useState<AdminClienteRow | null>(null)
  const [viewEntityDrawerClosing, setViewEntityDrawerClosing] = useState(false)
  const [addContratoCliente, setAddContratoCliente] = useState<AdminClienteRow | null>(null)
  const [addContratoDrawerClosing, setAddContratoDrawerClosing] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingContratoAction | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingEntidadeDelete | null>(null)
  const [pendingStatusChange, setPendingStatusChange] = useState<AdminClienteRow | null>(null)
  const [editEntity, setEditEntity] = useState<AdminClienteRow | null>(null)
  const [editEntityDrawerClosing, setEditEntityDrawerClosing] = useState(false)
  const [pendingContratoDelete, setPendingContratoDelete] = useState<PendingContratoDelete | null>(
    null,
  )
  const [viewContrato, setViewContrato] = useState<{
    cliente: AdminClienteRow
    contrato: AdminClienteContrato
  } | null>(null)
  const [viewUbtsCliente, setViewUbtsCliente] = useState<AdminClienteRow | null>(null)
  const [viewUbtsDrawerClosing, setViewUbtsDrawerClosing] = useState(false)
  const [viewDrawerClosing, setViewDrawerClosing] = useState(false)
  useEffect(() => {
    setExpandedClienteId(null)
    setOpenEntityMenuId(null)
    setOpenContratoMenuKey(null)
    setViewEntity(null)
    setViewEntityDrawerClosing(false)
    setAddContratoCliente(null)
    setAddContratoDrawerClosing(false)
    setViewContrato(null)
    setViewDrawerClosing(false)
    setViewUbtsCliente(null)
    setViewUbtsDrawerClosing(false)
  }, [rows])

  const totalLabel = formatAdminClientesNumber(rows.length)
  const listSubtitle =
    statusFilter === 'all'
      ? `${totalLabel} entidades cadastradas`
      : `${totalLabel} entidade${rows.length === 1 ? '' : 's'} neste filtro`

  const toggleExpand = useCallback((clienteId: string) => {
    setExpandedClienteId((current) => (current === clienteId ? null : clienteId))
    setOpenContratoMenuKey(null)
  }, [])

  const closeContratoMenu = useCallback(() => setOpenContratoMenuKey(null), [])

  const requestContratoAction = useCallback(
    (
      cliente: AdminClienteRow,
      contrato: AdminClienteContrato,
      action: AdminClienteContratoAction,
    ) => {
      setPendingAction({
        clienteId: cliente.id,
        contratoId: contrato.id,
        entidadeNome: cliente.prefeitura,
        contratoLabel: getContratoLabel(contrato, contratoTipoLabels),
        action,
      })
    },
    [contratoTipoLabels],
  )

  const confirmContratoAction = useCallback(() => {
    if (!pendingAction) return

    const snapshot = pendingAction
    setPendingAction(null)
    setOpenContratoMenuKey(null)

    requestPin({
      action: CONTRATO_PIN_ACTION[snapshot.action],
      label: `${snapshot.entidadeNome} · ${snapshot.contratoLabel}`,
      onConfirmed: async (pin) => {
        const token = getAccessToken()
        if (!token) return

        try {
          const row = await updateClienteContratoStatus(
            token,
            snapshot.contratoId,
            pin,
            snapshot.action,
          )
          onUpsertRow(row)
          await onReload()
          onToast('Status do contrato atualizado.')
        } catch (error) {
          const message = isAdminClientesApiError(error)
            ? error.message
            : 'Não foi possível atualizar o contrato.'
          onToast(message)
          throw error
        }
      },
    })
  }, [getAccessToken, onReload, onToast, onUpsertRow, pendingAction, requestPin])

  const confirmEntidadeStatusChange = useCallback(
    (nextStatus: AdminClienteStatus) => {
      if (!pendingStatusChange) return

      const snapshot = pendingStatusChange
      setPendingStatusChange(null)

      requestPin({
        action: 'save_entidade_status',
        label: snapshot.prefeitura,
        onConfirmed: async (pin) => {
          const token = getAccessToken()
          if (!token) return

          try {
            const row = await updateClienteEntidadeStatus(token, snapshot.id, {
              pin,
              status: nextStatus,
            })
            onUpsertRow(row)
            if (viewEntity?.id === snapshot.id) {
              setViewEntity(row)
            }
            await onReload()
            onToast('Status atualizado com sucesso.')
          } catch (error) {
            const message = isAdminClientesApiError(error)
              ? error.message
              : 'Não foi possível atualizar o status.'
            onToast(message)
          }
        },
      })
    },
    [getAccessToken, onReload, onToast, onUpsertRow, pendingStatusChange, requestPin, viewEntity?.id],
  )

  return (
    <>
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <DashCard
        className="h-full min-h-0 w-full min-w-0 max-w-full flex-1"
        title="Clientes Cadastrados"
        subtitle={listSubtitle}
        bodyClassName="flex min-h-0 flex-1 flex-col p-0"
        fillHeight
        aria-busy={isLoading}
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              strokeWidth={2}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por razão social, localidade ou contato"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)]/40 focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/15"
            />
          </label>
          <CustomSelect
            value={statusFilter}
            onChange={onStatusFilterChange}
            options={[...adminClientesStatusFilterOptions]}
            size="compact"
            className="w-full shrink-0 sm:w-[11rem]"
            menuMinWidthPx={200}
          />
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-y-contain">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50/90 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Entidade</th>
                <th className="px-4 py-3">Razão social</th>
                <th className="px-4 py-3 text-center">CNPJ</th>
                <th className="px-4 py-3">Localidade / UF</th>
                <th className="px-4 py-3 text-center">Gestor</th>
                <th className="px-4 py-3 text-center">Contatos TI</th>
                <th className="px-4 py-3 text-center">Saúde</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={ADMIN_CLIENTE_TABLE_COL_COUNT}
                    className="px-4 py-12 text-center text-sm text-gray-500"
                  >
                    Nenhuma entidade encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : null}

              {rows.map((row) => {
                const expanded = expandedClienteId === row.id

                return (
                  <Fragment key={row.id}>
                    <tr
                      role="button"
                      tabIndex={0}
                      aria-expanded={expanded}
                      onClick={() => toggleExpand(row.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          toggleExpand(row.id)
                        }
                      }}
                      className={[
                        'cursor-pointer text-gray-800 transition',
                        expanded ? 'bg-slate-50/90' : 'hover:bg-slate-50/80',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 text-gray-400" aria-hidden>
                            {expanded ? (
                              <ChevronDown className="h-4 w-4" strokeWidth={2.25} />
                            ) : (
                              <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
                            )}
                          </span>
                          <ClienteFavicon
                            hue={row.logoHue}
                            name={row.prefeitura}
                            faviconUrl={row.faviconUrl}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900">{row.prefeitura}</p>
                            <p className="text-xs text-gray-500">{row.subtitle}</p>
                            {row.tipoEntidade && row.tipoEntidade !== 'prefeitura' ? (
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
                                {resolveEntidadeTipoLabel(row.tipoEntidade)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[12rem] px-4 py-3">
                        <p className="line-clamp-2 text-xs leading-snug text-gray-700">
                          {row.razaoSocial}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center text-xs tabular-nums text-gray-600">
                        {maskCnpj(row.cnpj)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-700">
                        {row.municipio} / {row.uf}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ContactCell contact={row.gestor} centered />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ContactCell contact={row.contatoTi} centered />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ContactCell contact={row.contatoSaude} centered />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <AdminClienteStatusBadge status={row.status} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <AdminClienteEntidadeActionsMenu
                          open={openEntityMenuId === row.id}
                          canDelete={canDeleteClientes}
                          onToggle={() =>
                            setOpenEntityMenuId((current) => (current === row.id ? null : row.id))
                          }
                          onClose={() => setOpenEntityMenuId(null)}
                          onView={() => {
                            setViewEntity(row)
                            setViewEntityDrawerClosing(false)
                          }}
                          onViewUbts={() => {
                            setViewUbtsCliente(row)
                            setViewUbtsDrawerClosing(false)
                          }}
                          onAddContrato={() => {
                            setAddContratoCliente(row)
                            setAddContratoDrawerClosing(false)
                          }}
                          onEdit={() => {
                            setEditEntity(row)
                            setEditEntityDrawerClosing(false)
                          }}
                          onChangeStatus={() => {
                            setPendingStatusChange(row)
                          }}
                          onDelete={() => {
                            setPendingDelete({
                              clienteId: row.id,
                              entidadeNome: row.prefeitura,
                            })
                          }}
                        />
                      </td>
                    </tr>

                    {expanded ? (
                      <tr className="bg-slate-50/50">
                        <td
                          colSpan={ADMIN_CLIENTE_TABLE_COL_COUNT}
                          className="min-w-0 max-w-full px-4 py-3 sm:pl-8"
                        >
                          {row.contratos.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
                              Nenhum contrato cadastrado para esta entidade.
                            </p>
                          ) : (
                            <div className="min-w-0 max-w-full overflow-x-auto rounded-xl border border-gray-200 bg-white">
                              <table className="w-full min-w-[52rem] text-center text-sm">
                                <thead>
                                  <tr className="border-b border-gray-100 bg-[var(--app-surface-muted)] text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                    <th className="px-4 py-2.5 text-center">Nome do contrato</th>
                                    <th className="px-4 py-2.5 text-center">Data da assinatura</th>
                                    <th className="px-4 py-2.5 text-center">Tipo de contrato</th>
                                    <th className="px-4 py-2.5 text-center">Quantidade contratada</th>
                                    <th className="px-4 py-2.5 text-center">Utilização</th>
                                    <th className="px-4 py-2.5 text-center">Status</th>
                                    <th className="px-4 py-2.5 text-center">Ação</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {row.contratos.map((contrato) => {
                                    const menuKey = `${row.id}:${contrato.id}`
                                    const consultasContratadas =
                                      contrato.detalhes?.consultasContratadas ?? null
                                    return (
                                      <tr key={contrato.id} className="text-gray-800">
                                        <td className="px-4 py-2.5 text-center text-xs font-medium text-gray-800">
                                          {contrato.numero?.trim() || '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2.5 text-center text-xs text-gray-700">
                                          {contrato.dataAssinatura}
                                        </td>
                                        <td className="px-4 py-2.5 text-center text-xs font-medium text-gray-800">
                                          {resolveClienteContratoTipoLabel(contratoTipoLabels, contrato.tipo)}
                                        </td>
                                        <td className="px-4 py-2.5 text-center text-xs text-gray-700">
                                          {consultasContratadas == null
                                            ? '—'
                                            : formatAdminClientesNumber(consultasContratadas)}
                                        </td>
                                        <td className="px-4 py-2.5 text-center text-xs text-gray-700">
                                          {formatContratoUtilizacao(contrato)}
                                        </td>
                                        <td className="px-4 py-2.5">
                                          <div className="flex justify-center">
                                            <AdminClienteContratoStatusBadge
                                              status={contrato.status}
                                            />
                                          </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                          <AdminClienteContratoActionsMenu
                                            contrato={contrato}
                                            open={openContratoMenuKey === menuKey}
                                            canDelete={canDeleteClientes}
                                            onToggle={() =>
                                              setOpenContratoMenuKey((current) =>
                                                current === menuKey ? null : menuKey,
                                              )
                                            }
                                            onClose={closeContratoMenu}
                                            onSelectAction={(action) =>
                                              requestContratoAction(row, contrato, action)
                                            }
                                            onDeleteContrato={() => {
                                              setPendingContratoDelete({
                                                clienteId: row.id,
                                                contratoId: contrato.id,
                                                entidadeNome: row.prefeitura,
                                                contratoLabel: getContratoLabel(contrato, contratoTipoLabels),
                                              })
                                            }}
                                            onViewContrato={() => {
                                              setViewContrato({ cliente: row, contrato })
                                              setViewDrawerClosing(false)
                                            }}
                                          />
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </DashCard>
      </div>

      <AdminClienteEntidadeDeleteConfirmModal
        open={pendingDelete !== null}
        entidadeNome={pendingDelete?.entidadeNome ?? ''}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return
          const snapshot = pendingDelete
          setPendingDelete(null)

          requestPin({
            action: 'delete_entidade',
            label: snapshot.entidadeNome,
            onConfirmed: async (pin) => {
              const token = getAccessToken()
              if (!token) return

              try {
                await deleteClienteEntidade(token, snapshot.clienteId, pin)
                onRemoveRow(snapshot.clienteId)
                if (viewEntity?.id === snapshot.clienteId) {
                  setViewEntity(null)
                  setViewEntityDrawerClosing(false)
                }
                if (addContratoCliente?.id === snapshot.clienteId) {
                  setAddContratoCliente(null)
                  setAddContratoDrawerClosing(false)
                }
                await onReload()
                onToast('Entidade excluída com sucesso.')
              } catch (error) {
                const message = isAdminClientesApiError(error)
                  ? error.message
                  : 'Não foi possível excluir a entidade.'
                onToast(message)
              }
            },
          })
        }}
      />

      <AdminClienteContratoDeleteConfirmModal
        open={pendingContratoDelete !== null}
        entidadeNome={pendingContratoDelete?.entidadeNome ?? ''}
        contratoLabel={pendingContratoDelete?.contratoLabel ?? ''}
        onCancel={() => setPendingContratoDelete(null)}
        onConfirm={() => {
          if (!pendingContratoDelete) return
          const snapshot = pendingContratoDelete
          setPendingContratoDelete(null)

          requestPin({
            action: 'delete_contrato',
            label: `${snapshot.entidadeNome} · ${snapshot.contratoLabel}`,
            onConfirmed: async (pin) => {
              const token = getAccessToken()
              if (!token) return

              try {
                const updated = await deleteClienteContrato(
                  token,
                  snapshot.contratoId,
                  pin,
                )
                onUpsertRow(updated)
                if (viewContrato?.contrato.id === snapshot.contratoId) {
                  setViewContrato(null)
                  setViewDrawerClosing(false)
                }
                await onReload()
                onToast('Contrato excluído com sucesso.')
              } catch (error) {
                const message = isAdminClientesApiError(error)
                  ? error.message
                  : 'Não foi possível excluir o contrato.'
                onToast(message)
              }
            },
          })
        }}
      />

      <AdminClienteContratoConfirmModal
        open={pendingAction !== null}
        action={pendingAction?.action ?? null}
        entidadeNome={pendingAction?.entidadeNome ?? ''}
        contratoLabel={pendingAction?.contratoLabel ?? ''}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmContratoAction}
      />

      <AdminClienteEntidadeStatusModal
        open={pendingStatusChange !== null}
        entidadeNome={pendingStatusChange?.prefeitura ?? ''}
        currentStatus={pendingStatusChange?.status ?? 'ativa'}
        onCancel={() => setPendingStatusChange(null)}
        onConfirm={confirmEntidadeStatusChange}
      />

      <AdminClienteEntidadeEditDrawer
        open={editEntity !== null && !editEntityDrawerClosing}
        closing={editEntityDrawerClosing}
        cliente={editEntity}
        onClose={() => setEditEntityDrawerClosing(true)}
        onTransitionEnd={() => {
          setEditEntity(null)
          setEditEntityDrawerClosing(false)
        }}
        onSave={(clienteId, payload) => {
          const cliente = editEntity
          if (!cliente) return

          requestPin({
            action: 'save_entidade_cliente_edit',
            label: cliente.prefeitura,
            onConfirmed: async (pin) => {
              const token = getAccessToken()
              if (!token) return

              try {
                let latestRow = cliente

                if (payload.brandingChanged) {
                  latestRow = await updateClienteEntidade(token, clienteId, {
                    pin,
                    ...buildEntidadeBrandingUpdatePayload(cliente, payload.brandingChanges),
                  })
                }

                if (payload.contactsChanged) {
                  latestRow = await updateClienteEntidadeContacts(token, clienteId, {
                    pin,
                    gestor: payload.contacts.gestor,
                    contatoContrato: payload.contacts.contrato,
                    contatoTi: payload.contacts.ti,
                    contatoSaude: payload.contacts.saude,
                  })
                }

                onUpsertRow(latestRow)
                if (viewEntity?.id === clienteId) {
                  setViewEntity(latestRow)
                }
                await onReload()
                setEditEntityDrawerClosing(true)
                onToast('Cliente atualizado com sucesso.')
              } catch (error) {
                const message = isAdminClientesApiError(error)
                  ? error.message
                  : 'Não foi possível atualizar o cliente.'
                onToast(message)
                throw error
              }
            },
          })
        }}
      />

      <AdminClienteEntidadeDrawer
        open={viewEntity !== null && !viewEntityDrawerClosing}
        closing={viewEntityDrawerClosing}
        cliente={viewEntity}
        onClose={() => setViewEntityDrawerClosing(true)}
        onTransitionEnd={() => {
          if (viewEntityDrawerClosing) {
            setViewEntityDrawerClosing(false)
            setViewEntity(null)
          }
        }}
      />

      <AdminClienteContratoDrawer
        open={viewContrato !== null && !viewDrawerClosing}
        closing={viewDrawerClosing}
        cliente={viewContrato?.cliente ?? null}
        contrato={viewContrato?.contrato ?? null}
        onSaveContrato={(contratoId, form) =>
          new Promise((resolve, reject) => {
            const snapshot = viewContrato
            if (!snapshot) {
              reject(new Error('Contrato não encontrado.'))
              return
            }

            requestPin({
              action: 'save_contrato_edit',
              label: `${snapshot.cliente.prefeitura} · ${resolveClienteContratoTipoLabel(contratoTipoLabels, snapshot.contrato.tipo)}`,
              onConfirmed: async (pin) => {
                const token = getAccessToken()
                if (!token) {
                  reject(new Error('Sessão expirada. Faça login novamente.'))
                  return
                }

                try {
                  const payload = buildUpdateContratoPayloadFromForm(form, pin, specialties)
                  const row = await updateClienteContrato(token, contratoId, payload)
                  onUpsertRow(row)
                  const updatedContrato = row.contratos.find((item) => item.id === contratoId)
                  if (updatedContrato) {
                    setViewContrato({ cliente: row, contrato: updatedContrato })
                  }
                  if (viewEntity?.id === row.id) {
                    setViewEntity(row)
                  }
                  await onReload()
                  onToast('Contrato atualizado com sucesso.')
                  resolve()
                } catch (error) {
                  const message = isAdminClientesApiError(error)
                    ? error.message
                    : 'Não foi possível atualizar o contrato.'
                  onToast(message)
                  reject(new Error(message))
                }
              },
            })
          })
        }
        onClose={() => setViewDrawerClosing(true)}
        onTransitionEnd={() => {
          if (viewDrawerClosing) {
            setViewDrawerClosing(false)
            setViewContrato(null)
          }
        }}
      />

      <AdminClienteUbtsDrawer
        open={viewUbtsCliente !== null && !viewUbtsDrawerClosing}
        closing={viewUbtsDrawerClosing}
        cliente={viewUbtsCliente}
        onClose={() => setViewUbtsDrawerClosing(true)}
        onTransitionEnd={() => {
          if (viewUbtsDrawerClosing) {
            setViewUbtsDrawerClosing(false)
            setViewUbtsCliente(null)
          }
        }}
      />

      <AdminClienteAddContratoDrawer
        open={addContratoCliente !== null && !addContratoDrawerClosing}
        closing={addContratoDrawerClosing}
        cliente={addContratoCliente}
        professions={professions}
        specialties={specialties}
        onClose={() => setAddContratoDrawerClosing(true)}
        onTransitionEnd={() => {
          if (addContratoDrawerClosing) {
            setAddContratoDrawerClosing(false)
            setAddContratoCliente(null)
          }
        }}
        onSubmit={(form: AddContratoFormState) => {
          if (!addContratoCliente) return
          const clienteSnapshot = addContratoCliente

          requestPin({
            action: 'save_contrato_create',
            label: clienteSnapshot.prefeitura,
            onConfirmed: async (pin) => {
              const token = getAccessToken()
              if (!token) {
                onToast('Sessão expirada. Faça login novamente.')
                throw new Error('Sessão expirada.')
              }

              try {
                const payload = buildCreateContratoPayloadFromForm(
                  clienteSnapshot,
                  form,
                  pin,
                  specialties,
                )
                const row = await createClienteContrato(token, clienteSnapshot.id, payload)
                onUpsertRow(row)
                if (viewEntity?.id === clienteSnapshot.id) {
                  setViewEntity(row)
                }
                await onReload()
                setExpandedClienteId(clienteSnapshot.id)
                setAddContratoDrawerClosing(true)
                setAddContratoCliente(null)
                onToast('Novo contrato cadastrado com sucesso.')
              } catch (error) {
                onToast(
                  isAdminClientesApiError(error)
                    ? error.message
                    : 'Não foi possível salvar o contrato. Verifique os dados e tente novamente.',
                )
                throw error
              }
            },
          })
        }}
      />

      {pinModal}
    </>
  )
}
