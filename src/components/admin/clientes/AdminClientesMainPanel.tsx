import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  dashboardPageFillScrollAreaClass,
  dashboardPageScrollPaddingClass,
} from '../../layout/dashboardPageLayout'
import { adminClientesPageStackClass, adminClientesTableSlotClass } from './adminClientesUi'
import { AdminClientesSummaryCards } from './AdminClientesSummaryCards'
import { AdminClientesTable } from './AdminClientesTable'
import { AdminEntidadeCadastroDrawer } from './cadastro/AdminEntidadeCadastroDrawer'
import { useAdminClientesPage } from '../../../hooks/useAdminClientesPage'
import { useAdminClientesPin } from '../../../hooks/useAdminClientesPin'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { useAdminClientesClinicoCatalog } from '../../../hooks/useAdminClientesClinicoCatalog'
import {
  buildCreateContratoPayloadFromCadastroForm,
} from './adminClienteContratoForm'
import {
  buildCreateEntidadePayloadFromCadastroForm,
  type AdminEntidadeCadastroFormState,
} from './cadastro/adminEntidadeCadastroTypes'
import {
  createClienteContrato,
  createClienteEntidade,
  deleteClienteEntidade,
  isAdminClientesApiError,
} from '../../../lib/services/admin/clientes'
import { AdminClientesMainPanelSkeleton } from './skeletons/AdminClientesMainPanelSkeleton'

export function AdminClientesMainPanel() {
  const { getAccessToken } = useAdminAuth()
  const {
    rows,
    summary,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    upsertRow,
    removeRow,
    reload,
    isLoading,
    loadError,
  } = useAdminClientesPage()
  const { requestPin, pinModal } = useAdminClientesPin()
  const { specialties } = useAdminClientesClinicoCatalog()
  const [cadastroOpen, setCadastroOpen] = useState(false)
  const [cadastroClosing, setCadastroClosing] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  const showToast = useMemo(
    () => (message: string) => {
      setSuccessToast(message)
      window.setTimeout(() => setSuccessToast(null), 2800)
    },
    [],
  )

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

  function handleCadastroSubmit(form: AdminEntidadeCadastroFormState): Promise<void> {
    return new Promise((resolve, reject) => {
      requestPin({
        action: 'save_entidade_create',
        label: form.nome.trim() || 'nova entidade',
        onConfirmed: async (pin) => {
          const token = getAccessToken()
          if (!token) {
            reject(new Error('Sessão expirada. Faça login novamente.'))
            return
          }

          try {
            const row = await createClienteEntidade(
              token,
              buildCreateEntidadePayloadFromCadastroForm(form, pin),
            )
            try {
              const rowWithContrato = await createClienteContrato(
                token,
                row.id,
                buildCreateContratoPayloadFromCadastroForm(form, pin, specialties),
              )
              upsertRow(rowWithContrato)
              await reload()
              showToast('Entidade e contrato cadastrados com sucesso.')
              resolve()
            } catch (contratoError) {
              try {
                await deleteClienteEntidade(token, row.id, pin)
              } catch {
                // Mantém entidade sem contrato se o rollback falhar.
              }
              throw contratoError
            }
          } catch (error) {
            const message = isAdminClientesApiError(error)
              ? error.message
              : 'Não foi possível cadastrar a entidade.'
            reject(new Error(message))
          }
        },
      })
    })
  }

  if (isLoading && !summary && rows.length === 0) {
    return <AdminClientesMainPanelSkeleton />
  }

  if (loadError && !summary && rows.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto bg-slate-50/80 p-8">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
        <button
          type="button"
          onClick={() => void reload()}
          className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className={[dashboardPageFillScrollAreaClass, 'min-w-0'].join(' ')}>
      <div
        className={[
          dashboardPageScrollPaddingClass,
          adminClientesPageStackClass,
          'pb-3 sm:pb-4',
          'pt-5 sm:pt-6',
        ].join(' ')}
      >
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-4">
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
          <button
            type="button"
            onClick={openCadastroDrawer}
            className="btn-brand-gradient inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Novo cliente
          </button>
        </header>

        {loadError ? (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => void reload()}
              className="font-semibold text-[var(--brand-primary)] hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : null}

        <div className="shrink-0">
          <AdminClientesSummaryCards summary={summary} isLoading={isLoading} />
        </div>

        <div className={adminClientesTableSlotClass}>
          <AdminClientesTable
            rows={rows}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onUpsertRow={upsertRow}
            onRemoveRow={removeRow}
            onReload={reload}
            onToast={showToast}
            isLoading={isLoading}
          />
        </div>

        <AdminEntidadeCadastroDrawer
          open={cadastroOpen}
          closing={cadastroClosing}
          onClose={closeCadastroDrawer}
          onTransitionEnd={handleCadastroTransitionEnd}
          onSubmit={handleCadastroSubmit}
        />

        {pinModal}

        {successToast ? (
          <div className="pointer-events-none fixed bottom-6 right-6 z-[10000]">
            <div className="rounded-xl border border-emerald-300 bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)]">
              {successToast}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
