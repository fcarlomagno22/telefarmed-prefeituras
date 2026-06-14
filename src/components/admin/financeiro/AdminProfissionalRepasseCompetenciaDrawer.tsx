import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  MessageSquareWarning,
  Pencil,
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type {
  AdminPlantaoAuditoriaRow,
  AdminRepasseProfissionalCompetenciaRow,
  AdminRepasseProfissionalStatus,
  RepasseCompetenciaAprovadaPayload,
  SubmitPlantaoDecisaoPayload,
} from '../../../types/adminProfissionalRepasse'
import { isBackendApiEnabled } from '../../../lib/api/config'
import { hasRepasseContaForCompetencia } from '../../../data/adminFinanceiroRepasseStore'
import type { AdminProfissionalRepassePermissions } from '../../../hooks/useAdminProfissionalRepassePage'
import { computePlantaoRepasse } from '../../../utils/admin/computePlantaoRepasse'
import { computeRepasseModalityBreakdown } from '../../../utils/admin/computeRepasseModalityBreakdown'
import {
  formatPlantaoAuditoriaDateTime,
  formatPlantaoTableDate,
} from '../../../utils/admin/formatPlantaoRepasseAuditoria'
import { Toast } from '../../ui/Toast'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import { AdminProfissionalPlantaoAuditoriaDrawer } from './AdminProfissionalPlantaoAuditoriaDrawer'
import {
  AdminRepasseConfirmModal,
  type AdminRepasseConfirmAction,
} from './AdminRepasseConfirmModal'
import {
  ADMIN_REPASSE_ELEGIBILIDADE_BADGE_WIDTH,
  ADMIN_REPASSE_MODALIDADE_BADGE_WIDTH,
  ADMIN_REPASSE_STATUS_BADGE_WIDTH,
  adminRepasseElegibilidadeBadgeConfig,
  adminRepasseModalidadeBadgeConfig,
  adminRepasseStatusBadgeConfig,
  formatAdminRepasseCurrency,
} from './adminProfissionalRepasseUi'

type AdminProfissionalRepasseCompetenciaDrawerProps = {
  open: boolean
  closing: boolean
  row: AdminRepasseProfissionalCompetenciaRow | null
  permissions: AdminProfissionalRepassePermissions
  isMutating?: boolean
  onClose: () => void
  onTransitionEnd: () => void
  onApprove: (payload: RepasseCompetenciaAprovadaPayload) => Promise<boolean>
  onReject: (competenciaId: string, motivo: string) => Promise<boolean>
  onRequestCorrecao: (competenciaId: string, motivo: string) => Promise<boolean>
  onMarkPaid: (competenciaId: string) => Promise<boolean>
  onSubmitPlantaoDecisao: (
    payload: SubmitPlantaoDecisaoPayload,
  ) => Promise<AdminRepasseProfissionalCompetenciaRow | null>
}

type AcaoPendente = AdminRepasseConfirmAction | null

function centsToCurrencyInput(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centavos / 100)
}

function parseCurrencyInputToCents(raw: string): number {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return 0
  return Number(digits)
}

function TotalTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <article
      className={[
        'rounded-xl border p-3',
        accent ? 'border-orange-200 bg-orange-50/50' : 'border-gray-200 bg-white',
      ].join(' ')}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-bold tabular-nums text-gray-900">{value}</p>
    </article>
  )
}

export function AdminProfissionalRepasseCompetenciaDrawer({
  open,
  closing,
  row,
  permissions,
  isMutating = false,
  onClose,
  onTransitionEnd,
  onApprove,
  onReject,
  onRequestCorrecao,
  onMarkPaid,
  onSubmitPlantaoDecisao,
}: AdminProfissionalRepasseCompetenciaDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [selectedPlantao, setSelectedPlantao] = useState<AdminPlantaoAuditoriaRow | null>(null)
  const [isPlantaoDrawerClosing, setIsPlantaoDrawerClosing] = useState(false)

  const [localStatus, setLocalStatus] = useState<AdminRepasseProfissionalStatus>('pendente_conferencia')
  const [valorAprovadoInput, setValorAprovadoInput] = useState('')
  const [motivoAjuste, setMotivoAjuste] = useState('')
  const [editandoAprovado, setEditandoAprovado] = useState(false)
  const [acaoPendente, setAcaoPendente] = useState<AcaoPendente>(null)
  const [acaoMotivo, setAcaoMotivo] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success')

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    let frameId: number | null = null
    if (!open) {
      frameId = requestAnimationFrame(() => {
        setEntered(false)
        setSelectedPlantao(null)
        setIsPlantaoDrawerClosing(false)
        setAcaoPendente(null)
        setAcaoMotivo('')
        setEditandoAprovado(false)
      })
      return () => {
        if (frameId !== null) cancelAnimationFrame(frameId)
      }
    }
    frameId = requestAnimationFrame(() => setEntered(true))
    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId)
    }
  }, [open])

  useEffect(() => {
    if (!row || !open) return
    setLocalStatus(row.status)
    setValorAprovadoInput(centsToCurrencyInput(row.valorCalculadoCentavos))
    setMotivoAjuste('')
    setEditandoAprovado(false)
    setAcaoPendente(null)
    setAcaoMotivo('')
  }, [row, open])

  useEffect(() => {
    if (!isActive) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  const plantoesComputed = useMemo(() => {
    if (!row) return []
    return row.plantoes.map((plantao) => ({
      plantao,
      computed: computePlantaoRepasse(plantao),
    }))
  }, [row])

  const modalityBreakdown = useMemo(
    () => (row ? computeRepasseModalityBreakdown(row.plantoes) : []),
    [row],
  )

  const valorAprovadoCentavos = parseCurrencyInputToCents(valorAprovadoInput)
  const valorCalculadoCentavos = row?.valorCalculadoCentavos ?? 0
  const valorNFCentavos = row?.valorNFCentavos ?? null
  const ajusteDiverge =
    valorAprovadoCentavos !== valorCalculadoCentavos && valorAprovadoCentavos > 0
  const contaJaGerada = row
    ? isBackendApiEnabled()
      ? row.status === 'aprovado' || row.status === 'pago'
      : hasRepasseContaForCompetencia(row.id)
    : false
  const canEditValor =
    permissions.canApprove &&
    localStatus !== 'pago' &&
    localStatus !== 'rejeitado' &&
    !contaJaGerada
  const approveBlocked =
    !permissions.canApprove ||
    localStatus === 'pago' ||
    localStatus === 'rejeitado' ||
    contaJaGerada
  const rejectBlocked =
    !permissions.canApprove || localStatus === 'pago' || localStatus === 'rejeitado'
  const markPaidBlocked = !permissions.canMarkPaid || localStatus !== 'aprovado'

  if (!isActive || !row) return null

  function handleOpenPlantao(plantao: AdminPlantaoAuditoriaRow) {
    setSelectedPlantao(plantao)
    setIsPlantaoDrawerClosing(false)
  }

  function handleClosePlantaoDrawer() {
    if (!selectedPlantao) return
    setIsPlantaoDrawerClosing(true)
  }

  function handlePlantaoDrawerTransitionEnd() {
    setIsPlantaoDrawerClosing(false)
    setSelectedPlantao(null)
  }

  useEffect(() => {
    if (!row || !selectedPlantao) return
    const fresh = row.plantoes.find((plantao) => plantao.id === selectedPlantao.id)
    if (fresh) setSelectedPlantao(fresh)
  }, [row, selectedPlantao?.id])

  async function handleSubmitPlantaoDecisao(
    payload: Omit<SubmitPlantaoDecisaoPayload, 'competenciaId'>,
  ) {
    if (!row) return null
    return onSubmitPlantaoDecisao({
      competenciaId: row.id,
      ...payload,
    })
  }

  async function handleConfirmModalAction() {
    if (!row || !acaoPendente) return

    if (acaoPendente === 'aprovar') {
      if (ajusteDiverge && !motivoAjuste.trim()) {
        setToastVariant('error')
        setToastMessage('Informe o motivo do ajuste no valor aprovado.')
        return
      }
      const ok = await onApprove({
        competenciaRow: row,
        valorAprovadoCentavos,
        motivoAjuste: motivoAjuste.trim() || null,
      })
      if (ok) {
        setLocalStatus('aprovado')
        setToastVariant('success')
        setToastMessage('Competência aprovada. Conta a pagar gerada na aba Contas a pagar.')
      }
    } else if (acaoPendente === 'rejeitar') {
      if (!acaoMotivo.trim()) {
        setToastVariant('error')
        setToastMessage('Informe o motivo da rejeição.')
        return
      }
      const ok = await onReject(row.id, acaoMotivo.trim())
      if (ok) setLocalStatus('rejeitado')
    } else if (acaoPendente === 'correcao') {
      if (!acaoMotivo.trim()) {
        setToastVariant('error')
        setToastMessage('Informe o motivo da solicitação.')
        return
      }
      await onRequestCorrecao(row.id, acaoMotivo.trim())
    } else if (acaoPendente === 'marcar_pago') {
      const ok = await onMarkPaid(row.id)
      if (ok) setLocalStatus('pago')
    }

    setAcaoPendente(null)
    setAcaoMotivo('')
  }

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[9996] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-gray-900/30 transition-opacity ${
            panelVisible ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Fechar repasse da competência"
          onClick={onClose}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-repasse-competencia-title"
          data-testid="admin-repasse-competencia-drawer"
          onTransitionEnd={(event) => {
            if (event.target !== event.currentTarget) return
            if (event.propertyName === 'transform') onTransitionEnd()
          }}
          className={`absolute inset-y-0 right-0 flex w-full max-w-6xl flex-col border-l border-gray-200 bg-slate-50 shadow-[-12px_0_40px_rgba(0,0,0,0.1)] transition-transform duration-300 ${
            panelVisible ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <header className="shrink-0 border-b border-gray-200 bg-white px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--brand-primary)]">
                  Fechamento de competência
                </p>
                <h2 id="admin-repasse-competencia-title" className="mt-1 text-lg font-bold text-gray-900">
                  {row.profissionalNome}
                </h2>
                <p className="mt-0.5 text-sm font-semibold text-gray-700">{row.pjRazaoSocial}</p>
                <p className="text-xs text-gray-500">CNPJ {row.pjCnpj}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Competência
                </p>
                <p className="mt-0.5 text-sm font-bold text-gray-900">{row.competencia}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Nota fiscal
                </p>
                {row.nfFileName ? (
                  <div className="mt-1 flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                    <div className="min-w-0">
                      <p className="break-all text-xs font-semibold text-gray-900">{row.nfFileName}</p>
                      {row.nfEnviadaEm ? (
                        <p className="text-[10px] text-gray-500">
                          Enviada em {formatPlantaoAuditoriaDateTime(row.nfEnviadaEm)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p className="mt-0.5 text-sm text-gray-400">Não enviada</p>
                )}
                <button
                  type="button"
                  disabled={!row.nfFileName}
                  className="mt-2 text-[11px] font-semibold text-[var(--brand-primary)] disabled:cursor-not-allowed disabled:text-gray-400"
                  title="Preview disponível na integração com storage"
                >
                  Visualizar NF
                </button>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Status fechamento
                </p>
                <div className="mt-2">
                  <SituationStatusBadge
                    config={adminRepasseStatusBadgeConfig[localStatus]}
                    widthClass={ADMIN_REPASSE_STATUS_BADGE_WIDTH}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SituationStatusBadge
                config={adminRepasseElegibilidadeBadgeConfig[row.elegibilidadeAgregada]}
                widthClass={ADMIN_REPASSE_ELEGIBILIDADE_BADGE_WIDTH}
              />
              {row.temAlerta ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                  Plantões com alertas
                </span>
              ) : null}
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {contaJaGerada ? (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2.5 text-xs text-emerald-900">
                Conta a pagar já gerada para esta competência. Conferência na aba Contas a pagar.
              </div>
            ) : null}
            <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900">Totais da competência</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <TotalTile
                  label="Soma calculada"
                  value={formatAdminRepasseCurrency(valorCalculadoCentavos)}
                />
                <TotalTile
                  label="Valor NF"
                  value={
                    valorNFCentavos != null
                      ? formatAdminRepasseCurrency(valorNFCentavos)
                      : '—'
                  }
                />
                <TotalTile
                  label="Valor aprovado"
                  value={formatAdminRepasseCurrency(valorAprovadoCentavos)}
                  accent
                />
              </div>

              <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-700">Valor aprovado (editável)</p>
                  {!editandoAprovado ? (
                    <button
                      type="button"
                      onClick={() => setEditandoAprovado(true)}
                      disabled={!canEditValor}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)] disabled:opacity-40"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Editar
                    </button>
                  ) : null}
                </div>
                {editandoAprovado ? (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={valorAprovadoInput}
                      onChange={(event) => setValorAprovadoInput(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold tabular-nums text-gray-900 outline-none focus:border-[var(--brand-primary)]/40 focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                    />
                    {ajusteDiverge ? (
                      <textarea
                        value={motivoAjuste}
                        onChange={(event) => setMotivoAjuste(event.target.value)}
                        rows={2}
                        placeholder="Motivo obrigatório se diferir do calculado"
                        className="w-full rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs text-gray-800 outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-200/50"
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setEditandoAprovado(false)}
                      className="text-xs font-semibold text-gray-600 hover:text-gray-900"
                    >
                      Concluir edição
                    </button>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    {ajusteDiverge && motivoAjuste.trim()
                      ? `Ajuste: ${motivoAjuste}`
                      : 'Por padrão igual à soma calculada. Edite para ajuste manual.'}
                  </p>
                )}
              </div>
            </section>

            <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900">Breakdown por modalidade</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {modalityBreakdown.map((item) => (
                  <article
                    key={item.modalidade}
                    className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5"
                  >
                    <div className="mb-2">
                      <SituationStatusBadge
                        config={adminRepasseModalidadeBadgeConfig[item.modalidade]}
                        widthClass={ADMIN_REPASSE_MODALIDADE_BADGE_WIDTH}
                      />
                    </div>
                    <p className="text-xs text-gray-600">
                      {item.qtdPlantoes} plantão{item.qtdPlantoes === 1 ? '' : 'es'}
                    </p>
                    <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900">
                      {formatAdminRepasseCurrency(item.valorCalculadoCentavos)}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <header className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-sm font-bold text-gray-900">Plantões da competência</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Clique em uma linha para abrir o dossiê de auditoria.
                </p>
              </header>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[52rem] text-left text-sm">
                  <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Data</th>
                      <th className="px-3 py-2">Turno</th>
                      <th className="px-3 py-2 text-center">Regra</th>
                      <th className="px-3 py-2 text-center">Atend.</th>
                      <th className="px-3 py-2 text-center">Online</th>
                      <th className="px-3 py-2 text-right">Calculado</th>
                      <th className="px-3 py-2 text-center">Elegib.</th>
                      <th className="px-3 py-2">Alertas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plantoesComputed.map(({ plantao, computed }) => (
                      <tr
                        key={plantao.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOpenPlantao(plantao)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            handleOpenPlantao(plantao)
                          }
                        }}
                        className="cursor-pointer border-t border-gray-100 transition hover:bg-orange-50/50 focus-visible:bg-orange-50/60 focus-visible:outline-none"
                        data-testid={`admin-repasse-plantao-row-${plantao.id}`}
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-gray-700">
                          {formatPlantaoTableDate(plantao.horarioPrevistoInicio)}
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-gray-900">{plantao.slotLabel}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex justify-center">
                            <SituationStatusBadge
                              config={
                                adminRepasseModalidadeBadgeConfig[plantao.repasseRule.modalidade]
                              }
                              widthClass={ADMIN_REPASSE_MODALIDADE_BADGE_WIDTH}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center tabular-nums text-gray-700">
                          {plantao.atendidos}
                        </td>
                        <td className="px-3 py-2.5 text-center tabular-nums text-gray-700">
                          {plantao.percentualOnline != null ? `${plantao.percentualOnline}%` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-gray-900">
                          {formatAdminRepasseCurrency(computed.valorCalculadoCentavos)}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex justify-center">
                            <SituationStatusBadge
                              config={adminRepasseElegibilidadeBadgeConfig[computed.elegibilidade]}
                              widthClass={ADMIN_REPASSE_ELEGIBILIDADE_BADGE_WIDTH}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          {computed.alertas.length === 0 ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : (
                            <span
                              className="inline-flex items-start gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-medium leading-snug text-amber-900 ring-1 ring-amber-100"
                              title={computed.alertas.join(' · ')}
                            >
                              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                              {computed.alertas.length === 1
                                ? computed.alertas[0]
                                : `${computed.alertas.length} alertas`}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <footer className="flex shrink-0 flex-col gap-2 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Fechar
            </button>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {permissions.canMarkPaid && localStatus === 'aprovado' ? (
                <button
                  type="button"
                  onClick={() => setAcaoPendente('marcar_pago')}
                  disabled={markPaidBlocked || isMutating}
                  title={!permissions.canMarkPaid ? 'Sem permissão para marcar pago' : undefined}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Marcar como pago
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setAcaoMotivo('')
                  setAcaoPendente('correcao')
                }}
                disabled={rejectBlocked || isMutating}
                title={!permissions.canApprove ? 'Sem permissão para solicitar correção' : undefined}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <MessageSquareWarning className="h-4 w-4" aria-hidden />
                Solicitar correção
              </button>
              <button
                type="button"
                onClick={() => {
                  setAcaoMotivo('')
                  setAcaoPendente('rejeitar')
                }}
                disabled={rejectBlocked || isMutating}
                title={!permissions.canApprove ? 'Sem permissão para rejeitar' : undefined}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <XCircle className="h-4 w-4" aria-hidden />
                Rejeitar
              </button>
              <button
                type="button"
                onClick={() => setAcaoPendente('aprovar')}
                disabled={approveBlocked || isMutating}
                title={!permissions.canApprove ? 'Sem permissão para aprovar' : undefined}
                className="btn-brand-gradient inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Aprovar competência
              </button>
            </div>
          </footer>
        </aside>

        <AdminProfissionalPlantaoAuditoriaDrawer
          open={selectedPlantao !== null && !isPlantaoDrawerClosing}
          closing={isPlantaoDrawerClosing}
          plantao={selectedPlantao}
          canEdit={permissions.canApprove && !contaJaGerada && localStatus !== 'rejeitado'}
          isSubmitting={isMutating}
          onClose={handleClosePlantaoDrawer}
          onTransitionEnd={handlePlantaoDrawerTransitionEnd}
          onSubmitDecisao={handleSubmitPlantaoDecisao}
        />
      </div>

      <AdminRepasseConfirmModal
        open={acaoPendente !== null}
        action={acaoPendente ?? 'aprovar'}
        row={row}
        valorAprovadoCentavos={valorAprovadoCentavos}
        motivo={
          acaoPendente === 'aprovar' && ajusteDiverge
            ? motivoAjuste
            : acaoPendente === 'rejeitar' || acaoPendente === 'correcao'
              ? acaoMotivo
              : undefined
        }
        motivoRequired={
          acaoPendente === 'rejeitar' ||
          acaoPendente === 'correcao' ||
          (acaoPendente === 'aprovar' && ajusteDiverge)
        }
        onMotivoChange={
          acaoPendente === 'rejeitar' || acaoPendente === 'correcao'
            ? setAcaoMotivo
            : acaoPendente === 'aprovar' && ajusteDiverge
              ? setMotivoAjuste
              : undefined
        }
        isSubmitting={isMutating}
        onConfirm={() => void handleConfirmModalAction()}
        onCancel={() => {
          setAcaoPendente(null)
          setAcaoMotivo('')
        }}
      />

      <Toast
        message={toastMessage ?? ''}
        visible={Boolean(toastMessage)}
        variant={toastVariant}
        onClose={() => setToastMessage(null)}
      />
    </>,
    document.body,
  )
}
