import { CircleAlert, Layers, Users } from 'lucide-react'
import type { EscalaSummaryApi } from '../../../lib/mockServices/admin/escala'
import type { AdminEscalaShift } from '../../../types/adminEscala'
import { countOpenVacancies } from '../../../utils/escala/filterAdminEscalaOpenShifts'
import { profissionalEscalaShiftsPanelClass } from '../../profissional/escala/profissionalEscalaUi'

type AdminEscalaSidebarPanelProps = {
  shifts: AdminEscalaShift[]
  summary: EscalaSummaryApi | null
}

export function AdminEscalaSidebarPanel({ shifts, summary }: AdminEscalaSidebarPanelProps) {
  const openPublished = shifts.filter(
    (s) => s.assignmentMode === 'open' && s.status === 'publicada',
  )
  const openVacancies = summary?.openVacancies ?? countOpenVacancies(shifts)
  const partialCount = summary?.partialCount ?? 0
  const withoutBackup = summary?.withoutBackupCount ?? 0
  const drafts = summary?.draftCount ?? 0

  return (
    <section className={profissionalEscalaShiftsPanelClass} aria-label="Resumo operacional">
      <header className="shrink-0 border-b border-gray-100 px-4 py-3.5 sm:px-5">
        <h2 className="text-sm font-bold text-gray-900">Painel operacional</h2>
        <p className="mt-0.5 text-xs text-gray-500">Marketplace e gestão</p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-gray-100 bg-slate-50/90 px-2.5 py-2.5 text-center">
            <p className="text-xl font-bold text-gray-900">{openVacancies}</p>
            <p className="text-[10px] text-gray-600">Vagas no portal</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-slate-50/90 px-2.5 py-2.5 text-center">
            <p className="text-xl font-bold text-gray-900">{partialCount}</p>
            <p className="text-[10px] text-gray-600">Parcialmente preenchidos</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Alertas
          </p>
          <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-[11px] text-amber-900">
            <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {withoutBackup} plantão{withoutBackup === 1 ? '' : 'ões'} atribuído
              {withoutBackup === 1 ? '' : 's'} sem fila de reserva.
            </span>
          </div>
          {drafts > 0 ? (
            <div className="flex gap-2 rounded-lg border border-violet-200 bg-violet-50/80 p-3 text-[11px] text-violet-900">
              <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {drafts} rascunho{drafts === 1 ? '' : 's'} aguardando publicação.
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Últimas capturas
          </p>
          {openPublished.flatMap((s) => s.claimedCaptures).length === 0 ? (
            <p className="mt-2 text-xs text-gray-500">Nenhuma captura registrada.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {openPublished
                .flatMap((shift) =>
                  shift.claimedCaptures.map((capture) => ({ shift, capture })),
                )
                .slice(-4)
                .reverse()
                .map(({ shift, capture }) => (
                  <li
                    key={`${shift.id}-${capture.claimedAt}`}
                    className="rounded-lg border border-gray-100 bg-slate-50/80 px-2.5 py-2 text-[11px]"
                  >
                    <p className="font-semibold text-gray-900">{capture.doctorName}</p>
                    <p className="text-gray-600">
                      {shift.specialty} · {shift.unitName}
                    </p>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex gap-2 rounded-xl border border-gray-200 bg-white p-3">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
          <p className="text-[11px] leading-relaxed text-gray-600">
            Plantões em modo <strong>Aberto</strong> aparecem em Plantões disponíveis no portal do
            profissional após publicação.
          </p>
        </div>
      </div>
    </section>
  )
}
