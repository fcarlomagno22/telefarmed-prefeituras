import { AlertTriangle, CheckCircle2, ExternalLink, FileText } from 'lucide-react'
import type { AdminContaPagarRow } from '../../../types/adminFinanceiro'
import type { AdminContaPagarRepasseDraft } from '../../../types/adminProfissionalRepasse'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import {
  ADMIN_REPASSE_ELEGIBILIDADE_BADGE_WIDTH,
  ADMIN_REPASSE_MODALIDADE_BADGE_WIDTH,
  adminRepasseElegibilidadeBadgeConfig,
  adminRepasseModalidadeBadgeConfig,
  formatAdminRepasseCurrency,
} from './adminProfissionalRepasseUi'

type AdminContaPagarRepasseSummaryProps = {
  draft: AdminContaPagarRepasseDraft
  onVerAuditoria?: () => void
  compact?: boolean
}

export function AdminContaPagarRepasseSummary({
  draft,
  onVerAuditoria,
  compact = false,
}: AdminContaPagarRepasseSummaryProps) {
  return (
    <section className="rounded-2xl border border-orange-200/80 bg-orange-50/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--brand-primary)]">
            Origem repasse profissional
          </p>
          <p className="mt-1 text-sm font-bold text-gray-900">
            {draft.profissionalNome} · {draft.competencia}
          </p>
          <p className="text-xs text-gray-600">{draft.pjRazaoSocial}</p>
        </div>
        {onVerAuditoria ? (
          <button
            type="button"
            onClick={onVerAuditoria}
            className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-[var(--brand-primary)] transition hover:bg-orange-50"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Ver auditoria
          </button>
        ) : null}
      </div>

      <div className={`mt-3 grid gap-2 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-4'}`}>
        <div className="rounded-lg border border-orange-100 bg-white/80 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase text-gray-500">Calculado</p>
          <p className="text-sm font-bold tabular-nums">
            {formatAdminRepasseCurrency(draft.valorCalculadoCentavos)}
          </p>
        </div>
        <div className="rounded-lg border border-orange-100 bg-white/80 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase text-gray-500">Aprovado</p>
          <p className="text-sm font-bold tabular-nums">
            {formatAdminRepasseCurrency(draft.valorAprovadoCentavos)}
          </p>
        </div>
        <div className="rounded-lg border border-orange-100 bg-white/80 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase text-gray-500">NF</p>
          <p className="flex items-center gap-1 text-sm font-semibold text-gray-900">
            {draft.nfFileName ? (
              <>
                <FileText className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                <span className="truncate">{draft.nfFileName}</span>
              </>
            ) : (
              '—'
            )}
          </p>
        </div>
        <div className="rounded-lg border border-orange-100 bg-white/80 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase text-gray-500">Plantões</p>
          <p className="text-sm font-bold">{draft.plantoesResumo.length}</p>
        </div>
      </div>

      {draft.motivoAjuste ? (
        <p className="mt-2 text-xs text-amber-900">
          <span className="font-semibold">Motivo do ajuste:</span> {draft.motivoAjuste}
        </p>
      ) : null}

      {!compact ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-orange-100 bg-white">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Turno</th>
                <th className="px-3 py-2 text-center">Regra</th>
                <th className="px-3 py-2 text-center">Atend.</th>
                <th className="px-3 py-2 text-right">Calculado</th>
                <th className="px-3 py-2 text-center">Alertas</th>
              </tr>
            </thead>
            <tbody>
              {draft.plantoesResumo.map((plantao) => (
                <tr key={plantao.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 tabular-nums text-gray-700">{plantao.data}</td>
                  <td className="max-w-[8rem] truncate px-3 py-2 font-medium text-gray-900">
                    {plantao.slotLabel}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-center">
                      <SituationStatusBadge
                        config={adminRepasseModalidadeBadgeConfig[plantao.modalidade]}
                        widthClass={ADMIN_REPASSE_MODALIDADE_BADGE_WIDTH}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums">{plantao.atendidos}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {formatAdminRepasseCurrency(plantao.valorCalculadoCentavos)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {plantao.alertasResolvidos ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                        OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                        Revisado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}

export function AdminContaPagarOrigemTag({
  origem,
}: {
  origem: AdminContaPagarRow['origem']
}) {
  if (origem === 'repasse_profissional') {
    return (
      <span className="inline-flex rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-800 ring-1 ring-orange-200">
        Repasse
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600 ring-1 ring-gray-200">
      Manual
    </span>
  )
}
