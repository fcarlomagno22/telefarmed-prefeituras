import { Eye } from 'lucide-react'
import type { AdminProfissionalCandidatura } from '../../../types/adminProfissionais'
import { AdminCandidaturaStatusBadge } from './AdminCandidaturaStatusBadge'
import { AdminSpecialtiesCell } from './AdminSpecialtiesCell'
import {
  countPendingDocuments,
  formatCpfDisplay,
} from './adminProfissionaisUi'

const thCenterClass =
  'px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500'
const tdCenterClass = 'px-4 py-3 text-center text-xs text-gray-700'

function splitDateTimeLabel(label: string): { date: string; time: string } | null {
  const match = label.match(/^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})$/)
  if (!match) return null
  return { date: match[1], time: match[2] }
}

function DateTimeStackCell({ label }: { label?: string }) {
  if (!label || label === '—') {
    return <span className="text-xs text-gray-500">—</span>
  }

  const parts = splitDateTimeLabel(label)
  if (!parts) {
    return <span className="text-xs text-gray-600">{label}</span>
  }

  return (
    <div className="tabular-nums">
      <p className="text-xs font-medium text-gray-700">{parts.date}</p>
      <p className="text-[10px] text-gray-500">{parts.time}</p>
    </div>
  )
}

type AdminProfissionaisCandidaturasTableProps = {
  rows: AdminProfissionalCandidatura[]
  onOpen: (row: AdminProfissionalCandidatura) => void
}

export function AdminProfissionaisCandidaturasTable({
  rows,
  onOpen,
}: AdminProfissionaisCandidaturasTableProps) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-sm text-gray-500">
        Nenhuma candidatura encontrada para os filtros selecionados.
      </p>
    )
  }

  return (
    <table className="w-full min-w-[60rem] text-left text-sm">
      <thead>
        <tr className="border-b border-gray-200 bg-slate-50/90">
          <th className={thCenterClass}>Cadastro</th>
          <th className="px-4 py-3 text-left">Candidato</th>
          <th className={thCenterClass}>Profissão</th>
          <th className={thCenterClass}>Conselho</th>
          <th className={thCenterClass}>Especialidade</th>
          <th className={thCenterClass}>Documentos</th>
          <th className={thCenterClass}>Status</th>
          <th className={thCenterClass}>Aprovação</th>
          <th className={thCenterClass}>Ação</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((row) => {
          const pendingDocs = countPendingDocuments(row.documents)
          return (
            <tr key={row.id} className="text-gray-800 hover:bg-slate-50/80">
              <td className={`${tdCenterClass} whitespace-nowrap`}>
                <DateTimeStackCell label={row.submittedAtLabel} />
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold text-gray-900">{row.fullName}</p>
                <p className="text-xs text-gray-500">{formatCpfDisplay(row.cpf)}</p>
              </td>
              <td className={tdCenterClass}>{row.formationLabel}</td>
              <td className={`${tdCenterClass} whitespace-nowrap tabular-nums`}>
                {row.councilLabel} {row.councilNumber}/{row.councilUf}
              </td>
              <td className={tdCenterClass}>
                <AdminSpecialtiesCell specialty={row.specialty} specialties={row.specialties} />
              </td>
              <td className={tdCenterClass}>
                {pendingDocs > 0 ? (
                  <span className="font-semibold text-orange-600">
                    {pendingDocs} pendente{pendingDocs === 1 ? '' : 's'}
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-600">OK</span>
                )}
              </td>
              <td className={tdCenterClass}>
                <div className="flex justify-center">
                  <AdminCandidaturaStatusBadge status={row.status} />
                </div>
              </td>
              <td className={`${tdCenterClass} whitespace-nowrap`}>
                <DateTimeStackCell
                  label={
                    row.status === 'aprovado'
                      ? row.accessCodeSentAtLabel ?? row.finalizedAtLabel
                      : undefined
                  }
                />
              </td>
              <td className={tdCenterClass}>
                <button
                  type="button"
                  title="Analisar candidatura"
                  aria-label={`Analisar candidatura de ${row.fullName}`}
                  onClick={() => onOpen(row)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-[var(--brand-primary)]/30 hover:bg-orange-50 hover:text-[var(--brand-primary)]"
                >
                  <Eye className="h-4 w-4" strokeWidth={2} />
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
