import {
  Briefcase,
  Lock,
  Mail,
  Package,
  ScrollText,
} from 'lucide-react'
import type { PrefeituraContratoInfo } from '../../../types/prefeituraContrato'
import type { PrefeituraContratoExpiryView } from '../../../utils/prefeituraContrato'
import type { PrefeituraPackageUsageView } from '../../../utils/prefeituraConsultationPackage'
import {
  prefeituraPackageStatusStyles,
} from '../../../utils/prefeituraConsultationPackage'
import { PrefeituraPackageUsageBar } from '../PrefeituraPackageUsageBar'
import { formatPrefeituraNumber } from '../prefeituraDashboardUi'
import { buildPrefeituraContratoPackageQuantityLabel } from './prefeituraContratoUi'

type PrefeituraContratoSidebarPanelProps = {
  contract: PrefeituraContratoInfo
  expiry: PrefeituraContratoExpiryView
  currentUsage: PrefeituraPackageUsageView
  cycleSectionTitle: string
  usageAnimationKey: string
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-2.5 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="max-w-[58%] text-right text-xs font-semibold text-gray-800">{value}</span>
    </div>
  )
}

function CountdownRing({
  daysRemaining,
  totalDays,
  showCountdown,
}: {
  daysRemaining: number
  totalDays: number
  showCountdown: boolean
}) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(1, daysRemaining / Math.max(totalDays, 1))
  const offset = circumference * (1 - progress)

  return (
    <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--brand-primary)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="relative text-center">
        <p className="text-3xl font-black tabular-nums text-gray-900">{daysRemaining}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          {showCountdown ? 'dias restantes' : 'dias até o fim'}
        </p>
      </div>
    </div>
  )
}

export function PrefeituraContratoSidebarPanel({
  contract,
  expiry,
  currentUsage,
  cycleSectionTitle,
  usageAnimationKey,
}: PrefeituraContratoSidebarPanelProps) {
  const packageStyles = prefeituraPackageStatusStyles[currentUsage.status]
  const usageBarKey = `${usageAnimationKey}-${currentUsage.usagePercent}-${currentUsage.usedInCycle}`

  return (
    <aside className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
          <h2 className="text-base font-bold text-gray-900">Resumo do contrato</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">Dados cadastrais — somente leitura</p>

        <div className="mt-4">
          <CountdownRing
            daysRemaining={expiry.daysRemaining}
            totalDays={expiry.totalDays}
            showCountdown={expiry.showCountdown}
          />
          <p className="mt-3 text-center text-xs font-semibold text-gray-700">{expiry.headline}</p>
          <p className="mt-1 text-center text-[11px] leading-relaxed text-gray-500">
            {expiry.detail}
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-gray-100 bg-slate-50/80 px-3 py-1">
          <DetailRow label="Nº do contrato" value={contract.contractNumber} />
          <DetailRow label="Município" value={contract.municipalityName} />
          <DetailRow label="Início" value={expiry.startsAtLabel} />
          <DetailRow label="Término" value={expiry.endsAtLabel} />
          <DetailRow
            label={
              contract.modalidade === 'pacote_fechado'
                ? 'Franquia global'
                : contract.modalidade === 'sob_demanda'
                  ? 'Modalidade'
                  : 'Pacote mensal'
            }
            value={buildPrefeituraContratoPackageQuantityLabel(contract)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
          <h2 className="text-base font-bold text-gray-900">{cycleSectionTitle}</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {currentUsage.cycleStartLabel} a {currentUsage.cycleCloseLabel}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-gray-100 bg-slate-50/90 px-2 py-2 text-center">
            <p className="text-[9px] font-semibold uppercase text-gray-500">Utilizadas</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900">
              {formatPrefeituraNumber(currentUsage.usedInCycle)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-slate-50/90 px-2 py-2 text-center">
            <p className="text-[9px] font-semibold uppercase text-gray-500">Restantes</p>
            <p className={`mt-0.5 text-sm font-bold tabular-nums ${packageStyles.text}`}>
              {formatPrefeituraNumber(currentUsage.remainingInPackage)}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-[10px] font-semibold text-gray-600">
            <span>Uso do pacote</span>
            <span className="tabular-nums">{currentUsage.usagePercent}%</span>
          </div>
          <PrefeituraPackageUsageBar
            percent={currentUsage.usagePercent}
            barClassName={packageStyles.bar}
            resetKey={usageBarKey}
            trackClassName="mt-1.5 h-2"
          />
          <span
            className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${packageStyles.pill}`}
          >
            {currentUsage.statusLabel}
          </span>
        </div>

        {currentUsage.avulsoCount > 0 ? (
          <p className="mt-3 rounded-lg bg-red-50 px-2.5 py-2 text-[11px] text-red-700">
            <span className="font-semibold">
              {formatPrefeituraNumber(currentUsage.avulsoCount)} avulsas
            </span>{' '}
            no ciclo — cobrança à parte.
          </p>
        ) : null}
      </section>

      <section className="mt-auto shrink-0 rounded-xl border border-dashed border-gray-200 bg-gradient-to-br from-slate-50/90 to-white p-3">
        <p className="flex items-start gap-2 text-[10px] leading-relaxed text-gray-600">
          <Lock className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
          <span>
            Renovação e aditivos seguem o processo licitatório. Para pacote, avulsas ou propostas
            comerciais, fale com a{' '}
            <span className="font-semibold text-gray-800">{contract.commercialTeam}</span>.
          </span>
        </p>
        <a
          href={`mailto:${contract.commercialEmail}?subject=${encodeURIComponent(`Contrato municipal ${contract.contractNumber} — Telefarmed`)}`}
          className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-95"
        >
          <Briefcase className="h-3.5 w-3.5" strokeWidth={2} />
          Falar com o comercial
        </a>
        <p className="mt-1.5 flex items-center justify-center gap-1 text-[9px] text-gray-400">
          <Mail className="h-2.5 w-2.5" strokeWidth={2} />
          {contract.commercialEmail}
        </p>
      </section>
    </aside>
  )
}
