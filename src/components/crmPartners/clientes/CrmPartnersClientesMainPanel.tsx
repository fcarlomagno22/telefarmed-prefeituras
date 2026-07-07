import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CrmPartnersClienteAction, CrmPartnersClienteRow } from '../../../types/crmPartnersClientes'
import { CustomSelect } from '../../ui/CustomSelect'
import { CrmPartnersClienteActionsMenu } from './CrmPartnersClienteActionsMenu'
import { CrmPartnersClienteContratoStatusBadge } from './CrmPartnersClienteContratoStatusBadge'
import { CrmPartnersClienteTipoBadge } from './CrmPartnersClienteTipoBadge'
import {
  CRM_PARTNERS_CLIENTES_PAGE_SIZE,
  crmPartnersClienteContratoFilterOptions,
  crmPartnersClienteTipoFilterOptions,
  crmPartnersClientesTableHeadClass,
  crmPartnersClientesTableHeadCenterClass,
  crmPartnersClientesTableCellCenterClass,
  formatCrmPartnersCidadeUf,
} from './crmPartnersClientesUi'

const PAGE_SIZE = CRM_PARTNERS_CLIENTES_PAGE_SIZE

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

type CrmPartnersClientesMainPanelProps = {
  clientes: CrmPartnersClienteRow[]
  openMenuClienteId: string | null
  onToggleMenu: (clienteId: string) => void
  onCloseMenu: () => void
  onAction: (cliente: CrmPartnersClienteRow, action: CrmPartnersClienteAction) => void
  onNewCliente: () => void
}

export function CrmPartnersClientesMainPanel({
  clientes,
  openMenuClienteId,
  onToggleMenu,
  onCloseMenu,
  onAction,
  onNewCliente,
}: CrmPartnersClientesMainPanelProps) {
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [contratoFilter, setContratoFilter] = useState('todos')
  const [page, setPage] = useState(1)

  const filteredClientes = useMemo(() => {
    const query = normalizeSearch(search.trim())

    return clientes.filter((cliente) => {
      if (tipoFilter !== 'todos' && cliente.tipo !== tipoFilter) return false
      if (contratoFilter !== 'todos' && cliente.contratoStatus !== contratoFilter) return false
      if (!query) return true

      const haystack = normalizeSearch(
        `${cliente.razaoSocial} ${cliente.cnpj} ${cliente.cidade} ${cliente.uf} ${cliente.parceiroIndicadorNome}`,
      )
      return haystack.includes(query)
    })
  }, [clientes, search, tipoFilter, contratoFilter])

  const totalFiltered = filteredClientes.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const pageClientes = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredClientes.slice(start, start + PAGE_SIZE)
  }, [filteredClientes, safePage])

  const showingFrom = totalFiltered === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const showingTo = totalFiltered === 0 ? 0 : Math.min(safePage * PAGE_SIZE, totalFiltered)

  return (
    <section className="flex h-full min-h-[28rem] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      <header className="shrink-0 border-b border-gray-100 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Clientes indicados</h2>
            <p className="mt-1 text-sm text-gray-500">
              Cadastro unificado de Prefeitura, Santa Casa e Empresa com vínculo ao parceiro indicador.
            </p>
          </div>
          <button
            type="button"
            onClick={onNewCliente}
            className="btn-brand-gradient inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Novo cliente
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              strokeWidth={2}
            />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Buscar por nome, CNPJ, cidade ou parceiro..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-3 pl-9 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)]/40 focus:shadow-[var(--brand-primary-focus-ring)]"
            />
          </label>
          <CustomSelect
            value={tipoFilter}
            onChange={(value) => {
              setTipoFilter(value)
              setPage(1)
            }}
            options={[...crmPartnersClienteTipoFilterOptions]}
            className="w-full min-w-[12.5rem] sm:w-[12.5rem]"
            menuMinWidthPx={200}
          />
          <CustomSelect
            value={contratoFilter}
            onChange={(value) => {
              setContratoFilter(value)
              setPage(1)
            }}
            options={[...crmPartnersClienteContratoFilterOptions]}
            className="w-full min-w-[12.5rem] sm:w-[12.5rem]"
            menuMinWidthPx={220}
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="sticky top-0 z-[1] bg-slate-50/95 backdrop-blur-sm">
            <tr>
              <th className={crmPartnersClientesTableHeadClass}>Nome</th>
              <th className={crmPartnersClientesTableHeadCenterClass}>Tipo</th>
              <th className={crmPartnersClientesTableHeadCenterClass}>Cidade/UF</th>
              <th className={crmPartnersClientesTableHeadCenterClass}>Status do contrato</th>
              <th className={crmPartnersClientesTableHeadCenterClass}>Parceiro indicador</th>
              <th className={crmPartnersClientesTableHeadCenterClass}>Participação definida</th>
              <th className={crmPartnersClientesTableHeadCenterClass}>Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {pageClientes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                  Nenhum cliente encontrado para os filtros atuais.
                </td>
              </tr>
            ) : (
              pageClientes.map((cliente) => (
                <tr key={cliente.id} className="transition hover:bg-slate-50/80">
                  <td className="px-4 py-3.5 text-sm font-semibold text-gray-900">{cliente.razaoSocial}</td>
                  <td className={crmPartnersClientesTableCellCenterClass}>
                    <div className="flex justify-center">
                      <CrmPartnersClienteTipoBadge tipo={cliente.tipo} />
                    </div>
                  </td>
                  <td className={crmPartnersClientesTableCellCenterClass}>
                    {formatCrmPartnersCidadeUf(cliente.cidade, cliente.uf)}
                  </td>
                  <td className={crmPartnersClientesTableCellCenterClass}>
                    <div className="flex justify-center">
                      <CrmPartnersClienteContratoStatusBadge status={cliente.contratoStatus} />
                    </div>
                  </td>
                  <td className={[crmPartnersClientesTableCellCenterClass, 'font-medium text-gray-800'].join(' ')}>
                    {cliente.parceiroIndicadorNome}
                  </td>
                  <td className={crmPartnersClientesTableCellCenterClass}>
                    <span
                      className={
                        cliente.participacaoDefinida
                          ? 'font-semibold text-[var(--brand-primary)]'
                          : 'text-gray-400'
                      }
                    >
                      {cliente.participacaoResumo}
                    </span>
                  </td>
                  <td className={crmPartnersClientesTableCellCenterClass}>
                    <div className="flex justify-center">
                      <CrmPartnersClienteActionsMenu
                        cliente={cliente}
                        open={openMenuClienteId === cliente.id}
                        onToggle={() => onToggleMenu(cliente.id)}
                        onClose={onCloseMenu}
                        onAction={(action) => onAction(cliente, action)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-xs text-gray-500">
          {totalFiltered === 0
            ? 'Nenhum cliente na lista filtrada'
            : `Mostrando ${showingFrom} a ${showingTo} de ${formatNumber(totalFiltered)} cliente${totalFiltered === 1 ? '' : 's'}`}
        </p>
        <nav className="flex items-center gap-1" aria-label="Paginação de clientes">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: Math.min(3, totalPages) }, (_, index) => index + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium ${
                  pageNumber === safePage
                    ? 'border border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                    : 'border border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </button>
            ),
          )}
          {totalPages > 3 ? (
            <>
              <span className="px-1 text-sm text-gray-400">…</span>
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium ${
                  safePage === totalPages
                    ? 'border border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {totalPages}
              </button>
            </>
          ) : null}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      </footer>
    </section>
  )
}
