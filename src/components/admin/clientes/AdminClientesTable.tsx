import { ChevronDown, ChevronRight, EllipsisVertical, Search } from 'lucide-react'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import {
  adminClienteContratoTipoLabels,
  adminClientesStatusFilterOptions,
  adminClientesSummary,
  type AdminClienteContrato,
  type AdminClienteRow,
} from '../../../data/adminClientesMock'
import { CustomSelect } from '../../ui/CustomSelect'
import { DashCard } from '../../prefeitura/prefeituraDashboardUi'
import { AdminClienteContratoActionsMenu } from './AdminClienteContratoActionsMenu'
import { AdminClienteAddContratoDrawer } from './AdminClienteAddContratoDrawer'
import { AdminClienteContratoConfirmModal } from './AdminClienteContratoConfirmModal'
import { AdminClienteContratoDrawer } from './AdminClienteContratoDrawer'
import { AdminClienteEntidadeDrawer } from './AdminClienteEntidadeDrawer'
import { AdminClienteContratoStatusBadge } from './AdminClienteContratoStatusBadge'
import { AdminClienteStatusBadge } from './AdminClienteStatusBadge'
import {
  applyContratoAction,
  formatContratoUtilizacao,
  type AdminClienteContratoAction,
} from './adminClienteContratoActions'
import {
  ADMIN_CLIENTE_TABLE_COL_COUNT,
  formatAdminClientesNumber,
} from './adminClientesUi'

type AdminClientesTableProps = {
  rows: AdminClienteRow[]
  searchQuery: string
  onSearchChange: (value: string) => void
}

type PendingContratoAction = {
  clienteId: string
  contratoId: string
  prefeitura: string
  contratoLabel: string
  action: AdminClienteContratoAction
}

function ClienteLogo({ hue, name }: { hue: number; name: string }) {
  const initial = name.trim().charAt(0).toUpperCase()
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
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

function getContratoLabel(contrato: AdminClienteContrato) {
  return `${adminClienteContratoTipoLabels[contrato.tipo]} · assinado em ${contrato.dataAssinatura}`
}

export function AdminClientesTable({
  rows,
  searchQuery,
  onSearchChange,
}: AdminClientesTableProps) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [clientes, setClientes] = useState(rows)
  const [expandedClienteId, setExpandedClienteId] = useState<string | null>(null)
  const [openEntityMenuId, setOpenEntityMenuId] = useState<string | null>(null)
  const [openContratoMenuKey, setOpenContratoMenuKey] = useState<string | null>(null)
  const [viewEntity, setViewEntity] = useState<AdminClienteRow | null>(null)
  const [viewEntityDrawerClosing, setViewEntityDrawerClosing] = useState(false)
  const [addContratoCliente, setAddContratoCliente] = useState<AdminClienteRow | null>(null)
  const [addContratoDrawerClosing, setAddContratoDrawerClosing] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingContratoAction | null>(null)
  const [viewContrato, setViewContrato] = useState<{
    cliente: AdminClienteRow
    contrato: AdminClienteContrato
  } | null>(null)
  const [viewDrawerClosing, setViewDrawerClosing] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  useEffect(() => {
    setClientes(rows)
    setExpandedClienteId(null)
    setOpenEntityMenuId(null)
    setOpenContratoMenuKey(null)
    setViewEntity(null)
    setViewEntityDrawerClosing(false)
    setAddContratoCliente(null)
    setAddContratoDrawerClosing(false)
    setViewContrato(null)
    setViewDrawerClosing(false)
  }, [rows])

  useEffect(() => {
    if (!successToast) return
    const timeout = window.setTimeout(() => setSuccessToast(null), 2800)
    return () => window.clearTimeout(timeout)
  }, [successToast])

  const filteredRows = useMemo(() => {
    if (statusFilter === 'all') return clientes
    return clientes.filter((row) => row.status === statusFilter)
  }, [clientes, statusFilter])

  const totalLabel = formatAdminClientesNumber(adminClientesSummary.totalCadastrados)

  const toggleExpand = useCallback((clienteId: string) => {
    setExpandedClienteId((current) => (current === clienteId ? null : clienteId))
    setOpenContratoMenuKey(null)
  }, [])

  const closeContratoMenu = useCallback(() => setOpenContratoMenuKey(null), [])

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-entity-menu-root="true"]')) return
      setOpenEntityMenuId(null)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenEntityMenuId(null)
    }

    document.addEventListener('mousedown', handleDocumentClick)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const requestContratoAction = useCallback(
    (
      cliente: AdminClienteRow,
      contrato: AdminClienteContrato,
      action: AdminClienteContratoAction,
    ) => {
      setPendingAction({
        clienteId: cliente.id,
        contratoId: contrato.id,
        prefeitura: cliente.prefeitura,
        contratoLabel: getContratoLabel(contrato),
        action,
      })
    },
    [],
  )

  const confirmContratoAction = useCallback(() => {
    if (!pendingAction) return

    setClientes((current) =>
      current.map((cliente) => {
        if (cliente.id !== pendingAction.clienteId) return cliente
        return {
          ...cliente,
          contratos: cliente.contratos.map((contrato) => {
            if (contrato.id !== pendingAction.contratoId) return contrato
            return applyContratoAction(contrato, pendingAction.action)
          }),
        }
      }),
    )
    setPendingAction(null)
    setOpenContratoMenuKey(null)
  }, [pendingAction])

  return (
    <>
      <DashCard
        className="w-full min-w-0 max-w-full flex-1"
        title="Clientes Cadastrados"
        subtitle={`${totalLabel} entidades cadastradas`}
        bodyClassName="min-w-0 p-0"
        fillHeight
      >
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              strokeWidth={2}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por razão social, município ou contato"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)]/40 focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/15"
            />
          </label>
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[...adminClientesStatusFilterOptions]}
            size="compact"
            className="w-full shrink-0 sm:w-[11rem]"
            menuMinWidthPx={200}
          />
        </div>

        <div className="min-w-0 flex-1 overflow-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50/90 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Entidade</th>
                <th className="px-4 py-3">Razão social</th>
                <th className="px-4 py-3 text-center">CNPJ</th>
                <th className="px-4 py-3">Município / UF</th>
                <th className="px-4 py-3 text-center">Gestor</th>
                <th className="px-4 py-3 text-center">Contatos TI</th>
                <th className="px-4 py-3 text-center">Saúde</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={ADMIN_CLIENTE_TABLE_COL_COUNT}
                    className="px-4 py-12 text-center text-sm text-gray-500"
                  >
                    Nenhuma entidade encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : null}

              {filteredRows.map((row) => {
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
                          <ClienteLogo hue={row.logoHue} name={row.prefeitura} />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900">{row.prefeitura}</p>
                            <p className="text-xs text-gray-500">{row.subtitle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[12rem] px-4 py-3">
                        <p className="line-clamp-2 text-xs leading-snug text-gray-700">
                          {row.razaoSocial}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center text-xs tabular-nums text-gray-600">
                        {row.cnpj}
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
                        <div
                          className="relative inline-flex"
                          data-entity-menu-root="true"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            title="Ações da entidade"
                            onClick={() =>
                              setOpenEntityMenuId((current) => (current === row.id ? null : row.id))
                            }
                            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                            aria-haspopup="menu"
                            aria-expanded={openEntityMenuId === row.id}
                          >
                            <EllipsisVertical className="h-4 w-4" strokeWidth={2} />
                          </button>

                          {openEntityMenuId === row.id ? (
                            <div
                              role="menu"
                              className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.14)]"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                className="block w-full px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                                onClick={() => {
                                  setOpenEntityMenuId(null)
                                  setViewEntity(row)
                                  setViewEntityDrawerClosing(false)
                                }}
                              >
                                Visualizar
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="block w-full px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                                onClick={() => {
                                  setOpenEntityMenuId(null)
                                  setAddContratoCliente(row)
                                  setAddContratoDrawerClosing(false)
                                }}
                              >
                                Adicionar Contratos
                              </button>
                            </div>
                          ) : null}
                        </div>
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
                              <table className="w-full min-w-[36rem] text-center text-sm">
                                <thead>
                                  <tr className="border-b border-gray-100 bg-[var(--app-surface-muted)] text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                    <th className="px-4 py-2.5 text-center">Data da assinatura</th>
                                    <th className="px-4 py-2.5 text-center">Tipo de contrato</th>
                                    <th className="px-4 py-2.5 text-center">Utilização</th>
                                    <th className="px-4 py-2.5 text-center">Status</th>
                                    <th className="px-4 py-2.5 text-center">Ação</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {row.contratos.map((contrato) => {
                                    const menuKey = `${row.id}:${contrato.id}`
                                    return (
                                      <tr key={contrato.id} className="text-gray-800">
                                        <td className="whitespace-nowrap px-4 py-2.5 text-center text-xs text-gray-700">
                                          {contrato.dataAssinatura}
                                        </td>
                                        <td className="px-4 py-2.5 text-center text-xs font-medium text-gray-800">
                                          {adminClienteContratoTipoLabels[contrato.tipo]}
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
                                            onToggle={() =>
                                              setOpenContratoMenuKey((current) =>
                                                current === menuKey ? null : menuKey,
                                              )
                                            }
                                            onClose={closeContratoMenu}
                                            onSelectAction={(action) =>
                                              requestContratoAction(row, contrato, action)
                                            }
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

      <AdminClienteContratoConfirmModal
        open={pendingAction !== null}
        action={pendingAction?.action ?? null}
        prefeitura={pendingAction?.prefeitura ?? ''}
        contratoLabel={pendingAction?.contratoLabel ?? ''}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmContratoAction}
      />

      <AdminClienteEntidadeDrawer
        open={viewEntity !== null && !viewEntityDrawerClosing}
        closing={viewEntityDrawerClosing}
        cliente={viewEntity}
        onSaveContacts={(clienteId, contacts) => {
          setClientes((current) =>
            current.map((item) =>
              item.id === clienteId
                ? {
                    ...item,
                    gestor: contacts.gestor,
                    contatoContrato: contacts.contrato,
                    contatoTi: contacts.ti,
                    contatoSaude: contacts.saude,
                  }
                : item,
            ),
          )
          setViewEntity((current) =>
            current && current.id === clienteId
              ? {
                  ...current,
                  gestor: contacts.gestor,
                  contatoContrato: contacts.contrato,
                  contatoTi: contacts.ti,
                  contatoSaude: contacts.saude,
                }
              : current,
          )
        }}
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
        onClose={() => setViewDrawerClosing(true)}
        onTransitionEnd={() => {
          if (viewDrawerClosing) {
            setViewDrawerClosing(false)
            setViewContrato(null)
          }
        }}
      />

      <AdminClienteAddContratoDrawer
        open={addContratoCliente !== null && !addContratoDrawerClosing}
        closing={addContratoDrawerClosing}
        cliente={addContratoCliente}
        onClose={() => setAddContratoDrawerClosing(true)}
        onTransitionEnd={() => {
          if (addContratoDrawerClosing) {
            setAddContratoDrawerClosing(false)
            setAddContratoCliente(null)
          }
        }}
        onSubmit={({ contrato, contatoContrato }) => {
          if (!addContratoCliente) return
          setClientes((current) =>
            current.map((item) =>
              item.id === addContratoCliente.id
                ? {
                    ...item,
                    contatoContrato,
                    contratos: [contrato, ...item.contratos],
                  }
                : item,
            ),
          )
          setViewEntity((current) =>
            current && current.id === addContratoCliente.id
              ? {
                  ...current,
                  contatoContrato,
                  contratos: [contrato, ...current.contratos],
                }
              : current,
          )
          setSuccessToast('Novo contrato cadastrado com sucesso.')
        }}
      />

      {successToast ? (
        <div className="pointer-events-none fixed bottom-6 right-6 z-[10000]">
          <div className="rounded-xl border border-emerald-300 bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)]">
            {successToast}
          </div>
        </div>
      ) : null}
    </>
  )
}
