import { FileText, Stethoscope, TrendingUp } from 'lucide-react'
import { ClinicalTriageSummaryPanel } from '../../attendance/doctor/ClinicalTriageSummaryPanel'
import { doctorConsultationCardClass } from '../../attendance/doctor/doctorConsultationUi'
import type { ProfissionalConsultaHistoricoItem } from '../../../types/posConsultaHistorico'
import { profissionalAtendimentosStatusConfig } from '../atendimentos/profissionalAtendimentosUi'
import { EvolucaoPosConsultaTimeline } from '../../evolucao/EvolucaoPosConsultaTimeline'

const DOC_KIND_LABELS: Record<string, string> = {
  receita: 'Receita',
  pedido_exame: 'Exames',
  atestado: 'Atestado',
  orientacao: 'Orientação',
  cardapio: 'Cardápio',
  plano_alimentar: 'Plano alimentar',
  encaminhamento: 'Encaminhamento',
}

type ProfissionalConsultaHistoricoDetailProps = {
  consulta: ProfissionalConsultaHistoricoItem
  defaultExpanded?: boolean
}

export function ProfissionalConsultaHistoricoDetail({
  consulta,
  defaultExpanded = true,
}: ProfissionalConsultaHistoricoDetailProps) {
  const statusConfig = profissionalAtendimentosStatusConfig[consulta.status]

  if (!defaultExpanded) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-gray-900">{consulta.dateTimeLabel}</p>
            <p className="mt-0.5 text-xs text-gray-500">
              {consulta.doctorName} · {consulta.attendanceId}
            </p>
          </div>
          <span
            className={[
              'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
              consulta.status === 'concluido'
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-amber-50 text-amber-800',
            ].join(' ')}
          >
            {statusConfig.label}
          </span>
        </div>
      </div>

      <section className={[doctorConsultationCardClass, 'p-4'].join(' ')}>
        <div className="mb-3 flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
          <h4 className="text-sm font-bold text-gray-900">Triagem clínica</h4>
        </div>
        <ClinicalTriageSummaryPanel triageSummary={consulta.triageSummary} compact />
      </section>

      {consulta.issuedDocuments.length > 0 ? (
        <section className={[doctorConsultationCardClass, 'p-4'].join(' ')}>
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
            <h4 className="text-sm font-bold text-gray-900">Documentos emitidos</h4>
          </div>
          <ul className="space-y-2">
            {consulta.issuedDocuments.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                  <p className="text-[11px] text-gray-500">
                    {DOC_KIND_LABELS[doc.kind] ?? doc.kind} · {doc.signedAtLabel}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={[doctorConsultationCardClass, 'p-4'].join(' ')}>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
          <h4 className="text-sm font-bold text-gray-900">Evolução pós-consulta</h4>
        </div>
        <EvolucaoPosConsultaTimeline checkins={consulta.posConsultaCheckins} />
      </section>
    </div>
  )
}
