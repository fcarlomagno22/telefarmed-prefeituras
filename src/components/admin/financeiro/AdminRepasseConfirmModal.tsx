import { AlertTriangle, CheckCircle2, Wallet, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { AdminRepasseProfissionalCompetenciaRow } from '../../../types/adminProfissionalRepasse'
import { computeRepasseModalityBreakdown } from '../../../utils/admin/computeRepasseModalityBreakdown'
import { repasseModalidadeLabel } from '../../../utils/adminEscala/repasseRule'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import {
  ADMIN_REPASSE_MODALIDADE_BADGE_WIDTH,
  adminRepasseModalidadeBadgeConfig,
  adminRepasseModalidadeFilterLabel,
  formatAdminRepasseCurrency,
} from './adminProfissionalRepasseUi'

export type AdminRepasseConfirmAction = 'aprovar' | 'rejeitar' | 'correcao' | 'marcar_pago'

type AdminRepasseConfirmModalProps = {
  open: boolean
  action: AdminRepasseConfirmAction
  row: AdminRepasseProfissionalCompetenciaRow | null
  valorAprovadoCentavos?: number
  motivo?: string
  motivoRequired?: boolean
  onMotivoChange?: (value: string) => void
  isSubmitting?: boolean
  onConfirm: () => void
  onCancel: () => void
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 sm:text-right">{children}</dd>
    </div>
  )
}

const actionMeta: Record<
  AdminRepasseConfirmAction,
  { title: string; confirmLabel: string; tone: 'default' | 'danger' | 'success'; icon: typeof CheckCircle2 }
> = {
  aprovar: {
    title: 'Confirmar aprovação da competência',
    confirmLabel: 'Aprovar e gerar conta a pagar',
    tone: 'default',
    icon: CheckCircle2,
  },
  rejeitar: {
    title: 'Confirmar rejeição da competência',
    confirmLabel: 'Rejeitar competência',
    tone: 'danger',
    icon: XCircle,
  },
  correcao: {
    title: 'Confirmar solicitação de correção',
    confirmLabel: 'Enviar solicitação',
    tone: 'default',
    icon: AlertTriangle,
  },
  marcar_pago: {
    title: 'Confirmar pagamento da competência',
    confirmLabel: 'Marcar como pago',
    tone: 'success',
    icon: Wallet,
  },
}

export function AdminRepasseConfirmModal({
  open,
  action,
  row,
  valorAprovadoCentavos,
  motivo,
  motivoRequired = false,
  onMotivoChange,
  isSubmitting = false,
  onConfirm,
  onCancel,
}: AdminRepasseConfirmModalProps) {
  if (!open || !row) return null

  const meta = actionMeta[action]
  const Icon = meta.icon
  const breakdown = computeRepasseModalityBreakdown(row.plantoes)
  const valorCalculado = row.valorCalculadoCentavos
  const valorAprovado = valorAprovadoCentavos ?? valorCalculado

  const confirmClass =
    meta.tone === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : meta.tone === 'success'
        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
        : 'btn-brand-gradient text-white'

  return createPortal(
    <div
      className="fixed inset-0 z-[10002] flex items-end justify-center bg-gray-900/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-repasse-confirm-title"
    >
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)] sm:rounded-2xl">
        <header className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[var(--brand-primary)] ring-1 ring-orange-100">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id="admin-repasse-confirm-title" className="text-base font-bold text-gray-900">
                {meta.title}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {row.profissionalNome} · {row.competencia}
              </p>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <section className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
              Resumo da regra e valores
            </p>
            <dl className="mt-3 space-y-3">
              <SummaryRow label="PJ">{row.pjRazaoSocial}</SummaryRow>
              <SummaryRow label="Plantões">{row.qtdPlantoes}</SummaryRow>
              <SummaryRow label="Regra predominante">
                <span className="inline-flex flex-col items-end gap-1">
                  <SituationStatusBadge
                    config={adminRepasseModalidadeBadgeConfig[row.regraPredominante]}
                    widthClass={ADMIN_REPASSE_MODALIDADE_BADGE_WIDTH}
                  />
                  <span className="text-xs text-gray-600">
                    {repasseModalidadeLabel(row.regraPredominante)}
                  </span>
                </span>
              </SummaryRow>
              <SummaryRow label="Valor calculado">
                <span className="font-bold tabular-nums">
                  {formatAdminRepasseCurrency(valorCalculado)}
                </span>
              </SummaryRow>
              {action === 'aprovar' || action === 'marcar_pago' ? (
                <SummaryRow label="Valor aprovado">
                  <span className="font-bold tabular-nums text-[var(--brand-primary)]">
                    {formatAdminRepasseCurrency(valorAprovado)}
                  </span>
                </SummaryRow>
              ) : null}
              {row.valorNFCentavos != null ? (
                <SummaryRow label="Valor NF">
                  {formatAdminRepasseCurrency(row.valorNFCentavos)}
                </SummaryRow>
              ) : null}
            </dl>
          </section>

          {breakdown.length > 0 ? (
            <section className="mt-3 rounded-xl border border-orange-100 bg-orange-50/40 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-orange-800">
                Breakdown por modalidade
              </p>
              <ul className="mt-2 space-y-2">
                {breakdown.map((item) => (
                  <li
                    key={item.modalidade}
                    className="flex items-center justify-between gap-2 text-xs text-gray-700"
                  >
                    <span>{adminRepasseModalidadeFilterLabel(item.modalidade)}</span>
                    <span className="font-semibold tabular-nums">
                      {formatAdminRepasseCurrency(item.valorCalculadoCentavos)} · {item.qtdPlantoes}{' '}
                      plantão{item.qtdPlantoes === 1 ? '' : 'es'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {motivo?.trim() && !onMotivoChange ? (
            <section className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800">Motivo</p>
              <p className="mt-1 text-sm text-amber-950">{motivo.trim()}</p>
            </section>
          ) : null}

          {onMotivoChange ? (
            <section className="mt-3">
              <label className="block text-xs font-semibold text-gray-700">
                Motivo {motivoRequired ? '(obrigatório)' : ''}
              </label>
              <textarea
                value={motivo ?? ''}
                onChange={(event) => onMotivoChange(event.target.value)}
                rows={3}
                placeholder="Descreva o motivo desta ação"
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)]/40 focus:ring-2 focus:ring-[var(--brand-primary)]/15"
              />
            </section>
          ) : null}

          {action === 'aprovar' ? (
            <p className="mt-3 text-xs leading-relaxed text-gray-600">
              Será criada uma conta a pagar na aba Contas a pagar com origem{' '}
              <strong>Repasse profissional</strong>, vinculada a esta auditoria.
            </p>
          ) : null}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || (motivoRequired && !motivo?.trim())}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${confirmClass}`}
          >
            {isSubmitting ? 'Processando…' : meta.confirmLabel}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
