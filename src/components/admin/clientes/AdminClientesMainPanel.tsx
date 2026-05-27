import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  adminClientesRows,
  filterAdminClientesByTab,
  type AdminClienteRow,
  type AdminClientesTab,
} from '../../../data/adminClientesMock'
import {
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
} from '../../layout/dashboardPageLayout'
import {
  adminClientesPageStackClass,
  matchesAdminClienteSearch,
  normalizeAdminClientesSearch,
} from './adminClientesUi'
import { PrefeituraSystemReleaseFootnote } from '../../prefeitura/PrefeituraSystemReleaseFootnote'
import { AdminClientesOverviewRow } from './AdminClientesOverviewRow'
import { AdminClientesSummaryCards } from './AdminClientesSummaryCards'
import { AdminClientesTable } from './AdminClientesTable'
import { AdminEntidadeCadastroDrawer } from './cadastro/AdminEntidadeCadastroDrawer'

export function AdminClientesMainPanel() {
  const [activeTab] = useState<AdminClientesTab>('clientes')
  const [searchQuery, setSearchQuery] = useState('')
  const [rows, setRows] = useState<AdminClienteRow[]>(() => adminClientesRows)
  const [cadastroOpen, setCadastroOpen] = useState(false)
  const [cadastroClosing, setCadastroClosing] = useState(false)

  const filteredRows = useMemo(() => {
    const byTab = filterAdminClientesByTab(rows, activeTab)
    const query = normalizeAdminClientesSearch(searchQuery)
    if (!query) return byTab

    return byTab.filter((row) => matchesAdminClienteSearch(row, query))
  }, [activeTab, rows, searchQuery])

  function openCadastroDrawer() {
    setCadastroClosing(false)
    setCadastroOpen(true)
  }

  function closeCadastroDrawer() {
    setCadastroClosing(true)
  }

  function handleCadastroTransitionEnd() {
    if (cadastroClosing) {
      setCadastroOpen(false)
      setCadastroClosing(false)
    }
  }

  return (
    <div className={[dashboardPageScrollAreaClass, 'min-w-0'].join(' ')}>
      <div
        className={[
          dashboardPageScrollPaddingClass,
          adminClientesPageStackClass,
          'pb-3 sm:pb-4',
          'pt-5 sm:pt-6',
        ].join(' ')}
      >
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
              Clientes
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
              Gestão de Clientes
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Cadastro mestre das entidades, implantação e relacionamento operacional.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <PrefeituraSystemReleaseFootnote />
          </div>
        </header>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={openCadastroDrawer}
            className="btn-brand-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Nova unidade
          </button>
        </div>

        <AdminClientesSummaryCards />

        <AdminClientesOverviewRow />

        <AdminClientesTable
          rows={filteredRows}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <AdminEntidadeCadastroDrawer
          open={cadastroOpen}
          closing={cadastroClosing}
          onClose={closeCadastroDrawer}
          onTransitionEnd={handleCadastroTransitionEnd}
          onComplete={(row) => setRows((current) => [row, ...current])}
        />
      </div>
    </div>
  )
}
