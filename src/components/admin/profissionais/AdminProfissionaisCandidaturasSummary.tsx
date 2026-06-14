import { AlertCircle, CheckCircle2, Clock, PauseCircle, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CandidaturasSummaryResponse } from '../../../lib/mockServices/admin/profissionais'
import {
  adminProfissionaisCardsRowClass,
  formatAdminProfissionaisNumber,
} from './adminProfissionaisUi'

type AdminProfissionaisCandidaturasSummaryProps = {
  summary: CandidaturasSummaryResponse | null
}

type SummaryCard = {
  label: string
  hint: string
  value: number
  icon: LucideIcon
  iconGradient: string
  iconRing: string
  topBar: string
  trendClass: string
}

function buildCards(summary: CandidaturasSummaryResponse | null): SummaryCard[] {
  const pendente = summary?.pendente ?? 0
  const incompleto = summary?.incompleto ?? 0
  const aprovado = summary?.aprovado ?? 0
  const reprovado = summary?.reprovado ?? 0
  const emAnalise = summary?.em_analise ?? 0

  return [
    {
      label: 'Pendente',
      hint: 'Aguardando análise',
      value: pendente,
      icon: Clock,
      iconGradient: 'from-blue-500 via-sky-500 to-cyan-600',
      iconRing: 'ring-sky-100/80',
      topBar: 'from-blue-400 to-cyan-500',
      trendClass: 'text-blue-600',
    },
    {
      label: 'Incompleto',
      hint: 'Documentação não entregue',
      value: incompleto,
      icon: AlertCircle,
      iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
      iconRing: 'ring-orange-100/80',
      topBar: 'from-orange-400 to-amber-500',
      trendClass: 'text-orange-600',
    },
    {
      label: 'Aprovado',
      hint: 'Candidatura aprovada',
      value: aprovado,
      icon: CheckCircle2,
      iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
      iconRing: 'ring-emerald-100/80',
      topBar: 'from-emerald-400 to-green-500',
      trendClass: 'text-emerald-600',
    },
    {
      label: 'Reprovado',
      hint: 'Não aprovado',
      value: reprovado,
      icon: XCircle,
      iconGradient: 'from-red-500 via-rose-500 to-orange-600',
      iconRing: 'ring-red-100/80',
      topBar: 'from-red-400 to-rose-500',
      trendClass: 'text-red-600',
    },
    {
      label: 'Em análise',
      hint: 'Documentos em revisão',
      value: emAnalise,
      icon: PauseCircle,
      iconGradient: 'from-indigo-500 via-violet-500 to-indigo-600',
      iconRing: 'ring-indigo-100/80',
      topBar: 'from-indigo-400 to-violet-500',
      trendClass: 'text-indigo-600',
    },
  ]
}

export function AdminProfissionaisCandidaturasSummary({
  summary,
}: AdminProfissionaisCandidaturasSummaryProps) {
  const cards = buildCards(summary)

  return (
    <section className={adminProfissionaisCardsRowClass} aria-label="Indicadores de candidaturas">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <article
            key={card.label}
            className="relative flex h-full min-h-[7.5rem] min-w-0 w-full flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50/50 px-4 py-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
          >
            <span
              className={`absolute inset-x-4 top-0 h-0.5 rounded-full bg-gradient-to-r opacity-80 ${card.topBar}`}
              aria-hidden
            />
            <span
              className={[
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ring-[3px]',
                card.iconGradient,
                card.iconRing,
              ].join(' ')}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
            </span>
            <div className="mt-2 w-full min-w-0">
              <p className="text-xs font-medium leading-snug text-gray-500">{card.label}</p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight text-gray-900">
                {formatAdminProfissionaisNumber(card.value)}
              </p>
              <p className={`mt-0.5 text-[11px] font-medium leading-snug ${card.trendClass}`}>
                {card.hint}
              </p>
            </div>
          </article>
        )
      })}
    </section>
  )
}
