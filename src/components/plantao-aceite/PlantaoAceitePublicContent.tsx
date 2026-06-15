import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { brand } from '../../config/brand'
import { PLANTAO_ACEITE_DEMO_ESGOTADO_TOKEN, PLANTAO_ACEITE_DEMO_TOKEN } from '../../config/publicRoutes'
import type {
  PlantaoAceiteConfirmResult,
  PlantaoAceitePublico,
  PlantaoAceiteReserveResult,
} from '../../types/plantaoAceitePublico'
import { formatRepasseRuleSummary } from '../../utils/adminEscala/repasseRule'
import { cpfDigits, isValidCpf } from '../../utils/cpf'
import { maskCpf } from '../../utils/masks'
import { formatProfissionalCurrency } from '../../utils/profissional/formatProfissionalCurrency'
import { formatProfissionalEscalaTimeRange } from '../profissional/escala/profissionalEscalaUi'
import { PlantaoAceiteCpfDialog } from './PlantaoAceiteCpfDialog'
import { PlantaoAceiteReserveSuccessPanel } from './PlantaoAceiteReserveSuccessPanel'
import { PlantaoAceiteSuccessPanel } from './PlantaoAceiteSuccessPanel'

type PlantaoAceitePublicContentProps = {
  token: string
  plantao: PlantaoAceitePublico
  acceptedRules: boolean
  onAcceptedRulesChange: (value: boolean) => void
  cpfDialogOpen: boolean
  onOpenCpfDialog: () => void
  onCloseCpfDialog: () => void
  onConfirmCpf: (cpf: string) => void
  onConfirmReserve: (cpf: string) => void
  isSubmitting: boolean
  cpfError: string | null
  success: PlantaoAceiteConfirmResult | null
  reserveSuccess: PlantaoAceiteReserveResult | null
}

function formatValorResumo(plantao: PlantaoAceitePublico): string {
  const { repasseRule, amountCents } = plantao
  switch (repasseRule.modalidade) {
    case 'plantao_fixo':
      return formatProfissionalCurrency(repasseRule.valorPlantaoCentavos || amountCents)
    case 'por_consulta':
      return `${formatProfissionalCurrency(repasseRule.valorConsultaCentavos)} / consulta`
    case 'hibrido':
      return `${formatProfissionalCurrency(repasseRule.valorPlantaoCentavos)} + ${formatProfissionalCurrency(repasseRule.valorConsultaCentavos)} / consulta`
    default:
      return formatProfissionalCurrency(amountCents)
  }
}

function formatDateLabel(startAt: string): string {
  const date = new Date(startAt)
  const data = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  return data.charAt(0).toUpperCase() + data.slice(1)
}

function formatLocalLabel(plantao: PlantaoAceitePublico): string | null {
  if (plantao.modality === 'tele') return null
  const parts = [plantao.unitName, plantao.fullAddress, plantao.city]
    .map((item) => item?.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : null
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-gray-100 py-3.5 last:border-0">
      <span className="shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-medium leading-snug text-gray-900">{value}</span>
    </div>
  )
}

export function PlantaoAceitePublicContent({
  token,
  plantao,
  acceptedRules,
  onAcceptedRulesChange,
  cpfDialogOpen,
  onOpenCpfDialog,
  onCloseCpfDialog,
  onConfirmCpf,
  onConfirmReserve,
  isSubmitting,
  cpfError,
  success,
  reserveSuccess,
}: PlantaoAceitePublicContentProps) {
  const [mobileCpf, setMobileCpf] = useState('')
  const local = formatLocalLabel(plantao)
  const canClaim = plantao.status === 'disponivel' && plantao.vacancies > 0
  const canApplyAsReserve = plantao.status === 'vagas_esgotadas' && plantao.canApplyAsReserve
  const unavailable = plantao.status === 'indisponivel' || plantao.status === 'expirado'
  const actionMode: 'titular' | 'reserva' = canApplyAsReserve ? 'reserva' : 'titular'
  const canProceed = canClaim || canApplyAsReserve
  const mobileCpfInvalid = cpfDigits(mobileCpf).length === 11 && !isValidCpf(mobileCpf)

  if (success) {
    return <PlantaoAceiteSuccessPanel plantao={plantao} result={success} />
  }

  if (reserveSuccess) {
    return <PlantaoAceiteReserveSuccessPanel plantao={plantao} result={reserveSuccess} />
  }

  const headerLabel = canApplyAsReserve ? 'Vaga já preenchida' : 'Plantão disponível'
  const headerTitle = canApplyAsReserve
    ? 'Outro médico já pegou este plantão'
    : plantao.specialty

  return (
    <>
      <div className="mx-auto w-full max-w-md">
        <div className="h-1 w-full bg-[var(--brand-primary)] sm:hidden" aria-hidden />

        <div className="mb-6 pt-6 text-center sm:mb-8 sm:pt-0">
          <img
            src={brand.logoUrl}
            alt={brand.appName}
            className="mx-auto h-10 w-auto object-contain"
          />
        </div>

        <div className="sm:overflow-hidden sm:rounded-2xl sm:border sm:border-gray-200 sm:bg-white sm:shadow-sm">
          <div className="hidden h-1 bg-[var(--brand-primary)] sm:block" aria-hidden />

          <div className="sm:px-6 sm:pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--brand-primary)]">
              {headerLabel}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
              {headerTitle}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {plantao.specialty} · {plantao.modalityLabel}
              {canClaim
                ? ` · ${plantao.vacancies} vaga${plantao.vacancies === 1 ? '' : 's'}`
                : ''}
            </p>
          </div>

          <div className="mt-4 sm:mt-2 sm:px-6">
            <InfoRow label="Data" value={formatDateLabel(plantao.startAt)} />
            <InfoRow
              label="Horário"
              value={`${formatProfissionalEscalaTimeRange(plantao.startAt, plantao.endAt)} · ${plantao.turnLabel}`}
            />
            <InfoRow label="Modalidade" value={plantao.modalityLabel} />
            {local ? <InfoRow label="Local" value={local} /> : null}
            <InfoRow label="Repasse" value={formatValorResumo(plantao)} />
            <InfoRow label="Regras" value={formatRepasseRuleSummary(plantao.repasseRule)} />
          </div>

          {plantao.notes ? (
            <p className="mt-4 border-t border-gray-100 pt-4 text-xs leading-relaxed text-gray-500 sm:mx-6 sm:mt-1">
              {plantao.notes}
            </p>
          ) : null}

          {plantao.prazoAceiteLabel ? (
            <p className="mt-4 text-xs text-gray-500 sm:mx-6">
              Aceite até {plantao.prazoAceiteLabel}.
            </p>
          ) : null}

          {token === PLANTAO_ACEITE_DEMO_TOKEN || token === PLANTAO_ACEITE_DEMO_ESGOTADO_TOKEN ? (
            <p className="mt-4 text-xs text-gray-400 sm:mx-6">
              Demo · CPF: 226.522.048-58
            </p>
          ) : null}

          {canApplyAsReserve ? (
            <div className="mt-4 space-y-2 sm:mx-6">
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                A vaga titular deste plantão já foi preenchida por outro profissional.
              </p>
              <p className="rounded-lg border border-violet-100 bg-violet-50/70 px-3 py-2 text-sm text-violet-900">
                Você pode se candidatar como <strong>médico de reserva</strong> e ser acionado se o
                titular não entrar no horário.
                {plantao.reserveQueueCount > 0
                  ? ` Há ${plantao.reserveQueueCount} profissional(is) na fila.`
                  : ''}
              </p>
            </div>
          ) : null}

          {unavailable ? (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 sm:mx-6">
              Este plantão não está mais disponível.
            </p>
          ) : null}

          <div className="space-y-5 pb-8 pt-6 sm:px-6 sm:py-6">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={acceptedRules}
                onChange={(event) => onAcceptedRulesChange(event.target.checked)}
                disabled={!canProceed || isSubmitting}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
              />
              <span className="text-sm leading-relaxed text-gray-600">
                {canApplyAsReserve
                  ? 'Li e aceito as regras de repasse e entendo que serei acionado apenas se o titular não entrar no plantão.'
                  : 'Li e aceito as regras de repasse e presença deste plantão.'}
              </span>
            </label>

            <div className="space-y-3 sm:hidden">
              {acceptedRules && canProceed ? (
                <>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Digite seu CPF"
                    value={mobileCpf}
                    onChange={(event) => setMobileCpf(maskCpf(event.target.value))}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-center text-lg font-medium tabular-nums tracking-wide text-gray-900 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
                  />
                  {mobileCpfInvalid ? (
                    <p className="text-center text-xs text-red-600">CPF inválido</p>
                  ) : null}
                  {cpfError ? (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                      {cpfError}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      canApplyAsReserve
                        ? onConfirmReserve(cpfDigits(mobileCpf))
                        : onConfirmCpf(cpfDigits(mobileCpf))
                    }
                    disabled={isSubmitting || !isValidCpf(mobileCpf)}
                    className="btn-brand-gradient flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        {canApplyAsReserve ? 'Candidatando…' : 'Reservando…'}
                      </>
                    ) : canApplyAsReserve ? (
                      'Candidatar-se como reserva'
                    ) : (
                      'Pegar plantão'
                    )}
                  </button>
                </>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onOpenCpfDialog}
              disabled={!acceptedRules || !canProceed || isSubmitting}
              className="btn-brand-gradient hidden w-full rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 sm:block"
            >
              {canApplyAsReserve ? 'Candidatar-se como reserva' : 'Aceitar plantão'}
            </button>

            <p className="text-center text-[11px] text-gray-400">
              Publicado em {plantao.publishedAtLabel}
            </p>
          </div>
        </div>
      </div>

      <PlantaoAceiteCpfDialog
        open={cpfDialogOpen}
        specialty={plantao.specialty}
        mode={actionMode}
        isSubmitting={isSubmitting}
        errorMessage={cpfError}
        onClose={onCloseCpfDialog}
        onConfirm={canApplyAsReserve ? onConfirmReserve : onConfirmCpf}
      />
    </>
  )
}
