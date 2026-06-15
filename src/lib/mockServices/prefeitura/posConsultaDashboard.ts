import { Activity, ClipboardCheck, Sparkles, TrendingUp } from 'lucide-react'
import type { KpiStatCardItem } from '../../../components/ui/KpiStatCards'
import { buildPrefeituraPosConsultaDashboardMock } from '../../../data/prefeituraPosConsultaMock'
import type {
  PrefeituraPosConsultaDashboardFilters,
  PrefeituraPosConsultaDashboardView,
} from '../../../types/prefeituraPosConsultaDashboard'
import { mockDelay } from '../delay'

export class PrefeituraPosConsultaDashboardApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'PrefeituraPosConsultaDashboardApiError'
    this.status = status
    this.code = code
  }
}

export function isPrefeituraPosConsultaDashboardApiError(
  error: unknown,
): error is PrefeituraPosConsultaDashboardApiError {
  return error instanceof PrefeituraPosConsultaDashboardApiError
}

export function mapPrefeituraPosConsultaDashboardToKpiCards(
  view: PrefeituraPosConsultaDashboardView,
): KpiStatCardItem[] {
  const { kpis } = view
  const adesaoSuffix =
    kpis.checkinsEnviados > 0
      ? `${kpis.checkinsRespondidos} de ${kpis.checkinsEnviados} check-ins respondidos`
      : 'Sem check-ins enviados no período'

  return [
    {
      label: 'Acompanhamentos ativos',
      value: String(kpis.acompanhamentosAtivos),
      suffix: 'Consultas com plano pós-consulta no recorte',
      icon: Activity,
      iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
      iconRing: 'ring-blue-100/80',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Taxa de adesão',
      value: `${kpis.taxaAdesaoPercent}%`,
      suffix: adesaoSuffix,
      icon: TrendingUp,
      iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
      iconRing: 'ring-emerald-100/80',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Check-ins realizados',
      value: String(kpis.totalCheckinsRealizados),
      suffix: 'Respostas agregadas de pacientes no período',
      icon: ClipboardCheck,
      iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
      iconRing: 'ring-violet-100/80',
      topBar: 'from-violet-400 to-purple-500',
    },
    {
      label: 'Taxa de melhora',
      value: `${kpis.taxaMelhoraPercent}%`,
      suffix:
        kpis.totalCheckinsRealizados > 0
          ? 'Pacientes que reportaram evolução positiva'
          : 'Sem respostas de evolução no período',
      icon: Sparkles,
      iconGradient: 'from-teal-500 via-emerald-500 to-green-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(20,184,166,0.35)]',
      iconRing: 'ring-teal-100/80',
      topBar: 'from-teal-400 to-emerald-500',
    },
  ]
}

export async function fetchPrefeituraPosConsultaDashboard(
  _accessToken: string,
  filters: PrefeituraPosConsultaDashboardFilters,
): Promise<PrefeituraPosConsultaDashboardView> {
  // TODO: conectar API real na fase backend (/prefeitura/dashboard/pos-consulta)
  return mockDelay(buildPrefeituraPosConsultaDashboardMock(filters))
}
