import { History, PhoneOff } from 'lucide-react'
import { DoctorIssueDocumentMegamenu } from './DoctorIssueDocumentMegamenu'
import type { DoctorClinicalDocumentKind } from './doctorClinicalDocumentTypes'

type DoctorConsultationHeaderProps = {
  elapsed: string
  startedAtLabel: string
  onFinishConsultation?: () => void
  onIssueDocument?: (kind: DoctorClinicalDocumentKind) => void
  onViewPreviousConsultations?: () => void
}

export function DoctorConsultationHeader({
  elapsed,
  startedAtLabel,
  onFinishConsultation,
  onIssueDocument,
  onViewPreviousConsultations,
}: DoctorConsultationHeaderProps) {
  return (
    <header className="shrink-0 bg-[#f5f6f8] pb-3 pt-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-[22px]">
            Consulta por vídeo / Atendimento médico
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Em atendimento
            </span>
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold tabular-nums text-gray-800 shadow-sm">
              {elapsed}
            </span>
            <span className="text-xs text-gray-500">{startedAtLabel}</span>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {onViewPreviousConsultations ? (
              <button
                type="button"
                onClick={onViewPreviousConsultations}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-800 shadow-sm transition hover:border-[var(--brand-primary)]/30 hover:bg-orange-50/60 sm:text-sm"
              >
                <History className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
                Consultas anteriores
              </button>
            ) : null}
            {onIssueDocument ? <DoctorIssueDocumentMegamenu onSelect={onIssueDocument} /> : null}
            <button
              type="button"
              onClick={onFinishConsultation}
              className="btn-danger-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold sm:text-sm"
            >
              <PhoneOff className="h-4 w-4" strokeWidth={2} />
              Finalizar consulta
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
