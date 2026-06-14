import { Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  AdminCandidaturaDocumentStatus,
  AdminProfissionalCandidatura,
} from '../../../types/adminProfissionais'
import { CustomSelect } from '../../ui/CustomSelect'
import { DashCard } from '../../prefeitura/prefeituraDashboardUi'
import { adminPessoasPanelEmbeddedShellClass } from '../pessoas/adminPessoasMainPanelShell'
import { AdminProfissionaisCandidaturasSummary } from './AdminProfissionaisCandidaturasSummary'
import { AdminProfissionaisCandidaturasTable } from './AdminProfissionaisCandidaturasTable'
import { AdminProfissionaisCandidaturaDrawer } from './AdminProfissionaisCandidaturaDrawer'
import { adminProfissionaisStatusFilterOptions } from './adminProfissionaisUi'

function mergeCandidaturaFromListRow(
  current: AdminProfissionalCandidatura,
  fromList: AdminProfissionalCandidatura,
): AdminProfissionalCandidatura {
  return {
    ...fromList,
    documents: fromList.documents.length > 0 ? fromList.documents : current.documents,
    timeline: fromList.timeline.length > 0 ? fromList.timeline : current.timeline,
  }
}
import type { CandidaturasSummaryResponse } from '../../../lib/mockServices/admin/profissionais'

type CandidaturaActions = {
  loadDetail: (id: string) => Promise<AdminProfissionalCandidatura | null>
  reviewDocument: (
    candidaturaId: string,
    documentoId: string,
    status: AdminCandidaturaDocumentStatus,
    motivoReprovacao?: string,
  ) => Promise<AdminProfissionalCandidatura>
  approve: (
    candidaturaId: string,
  ) => Promise<{ candidatura: AdminProfissionalCandidatura; accessCode?: string }>
  reject: (candidaturaId: string, motivo: string) => Promise<AdminProfissionalCandidatura>
  requestCorrection: (
    candidaturaId: string,
    mensagem: string,
    documentoIds: string[],
  ) => Promise<AdminProfissionalCandidatura>
}

type AdminProfissionaisCandidaturasMainPanelProps = {
  rows: AdminProfissionalCandidatura[]
  summary: CandidaturasSummaryResponse | null
  canApprove: boolean
  onToast: (message: string) => void
  embedded?: boolean
  search: string
  statusFilter: string
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  actions: CandidaturaActions
}

export function AdminProfissionaisCandidaturasMainPanel({
  rows,
  summary,
  canApprove,
  onToast,
  embedded = false,
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  actions,
}: AdminProfissionaisCandidaturasMainPanelProps) {
  const [selected, setSelected] = useState<AdminProfissionalCandidatura | null>(null)
  const [drawerClosing, setDrawerClosing] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const filteredRows = useMemo(() => rows, [rows])

  const openCandidatura = useCallback(
    async (row: AdminProfissionalCandidatura) => {
      setSelected(row)
      setDrawerClosing(false)
      setIsDetailLoading(true)
      try {
        const detail = await actions.loadDetail(row.id)
        if (detail) setSelected(detail)
      } catch {
        onToast('Não foi possível carregar os detalhes da candidatura.')
      } finally {
        setIsDetailLoading(false)
      }
    },
    [actions, onToast],
  )

  const drawerActions = useMemo(() => {
    if (!selected) {
      return {
        reviewDocument: async () => {
          throw new Error('Candidatura não selecionada.')
        },
        approve: async () => {
          throw new Error('Candidatura não selecionada.')
        },
        reject: async () => {
          throw new Error('Candidatura não selecionada.')
        },
        requestCorrection: async () => {
          throw new Error('Candidatura não selecionada.')
        },
      }
    }

    const candidaturaId = selected.id
    return {
      reviewDocument: (
        documentoId: string,
        status: AdminCandidaturaDocumentStatus,
        motivoReprovacao?: string,
      ) => actions.reviewDocument(candidaturaId, documentoId, status, motivoReprovacao),
      approve: () => actions.approve(candidaturaId),
      reject: (motivo: string) => actions.reject(candidaturaId, motivo),
      requestCorrection: (mensagem: string, documentoIds: string[]) =>
        actions.requestCorrection(candidaturaId, mensagem, documentoIds),
    }
  }, [actions, selected])

  useEffect(() => {
    if (!selected) return
    const updated = rows.find((row) => row.id === selected.id)
    if (!updated) return
    setSelected((current) => {
      if (!current || current.id !== updated.id) return updated
      const merged = mergeCandidaturaFromListRow(current, updated)
      if (
        merged.status === current.status &&
        merged.documents === current.documents &&
        merged.timeline === current.timeline
      ) {
        return current
      }
      return merged
    })
  }, [rows, selected?.id])

  function closeDrawer() {
    setDrawerClosing(true)
  }

  function handleDrawerTransitionEnd() {
    if (drawerClosing) {
      setDrawerClosing(false)
      setSelected(null)
    }
  }

  return (
    <>
      <div
        className={[
          embedded ? adminPessoasPanelEmbeddedShellClass : 'flex min-h-0 flex-1 flex-col',
          'gap-5 px-4 pb-4 pt-5',
        ].join(' ')}
      >
        <AdminProfissionaisCandidaturasSummary summary={summary} />

        <DashCard
          className="min-h-0 flex-1"
          title="Fila de candidaturas"
          subtitle={`${filteredRows.length} registro(s) exibidos`}
          bodyClassName="flex min-h-0 flex-1 flex-col p-0"
          fillHeight
        >
          <div className="flex shrink-0 flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center">
            <label className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                strokeWidth={2}
              />
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por nome, CPF, e-mail ou conselho"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--brand-primary)]/40 focus:bg-white"
              />
            </label>
            <CustomSelect
              value={statusFilter}
              onChange={onStatusFilterChange}
              options={[...adminProfissionaisStatusFilterOptions]}
              size="compact"
              className="w-full shrink-0 sm:w-[14rem]"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-auto overscroll-y-contain">
            <AdminProfissionaisCandidaturasTable
              rows={filteredRows}
              onOpen={(row) => void openCandidatura(row)}
            />
          </div>
        </DashCard>
      </div>

      <AdminProfissionaisCandidaturaDrawer
        candidatura={selected}
        open={selected !== null && !drawerClosing}
        closing={drawerClosing}
        canApprove={canApprove}
        isDetailLoading={isDetailLoading}
        onClose={closeDrawer}
        onTransitionEnd={handleDrawerTransitionEnd}
        onToast={onToast}
        actions={drawerActions}
      />
    </>
  )
}
