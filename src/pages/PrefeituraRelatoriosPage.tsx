import { useEntidadeCopy } from '../hooks/useEntidadeCopy'
import { Navigate, useParams } from 'react-router-dom'
import { PrefeituraRelatoriosHubPanel } from '../components/prefeitura/relatorios/PrefeituraRelatoriosHubPanel'
import { RelatoriosCategoryPanel } from '../components/relatorios/RelatoriosCategoryPanel'
import {
  dashboardPageScrollAreaClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { getReportCategory } from '../config/reportsCategories'
import { prefeituraRoutes } from '../config/prefeituraRoutes'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'

function formatHeaderDate(date = new Date()) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatHeaderTime(date = new Date()) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function PrefeituraRelatoriosPage() {
  const copy = useEntidadeCopy()
  const now = new Date()

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col" aria-label="Relatórios municipais">
      <div className={[dashboardPageShellClass, 'flex min-h-0 flex-1 flex-col bg-slate-50/80 py-5'].join(' ')}>
        <header className="relative z-10 flex shrink-0 flex-col gap-4 overflow-visible sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
              Relatórios
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Catálogo de indicadores operacionais, clínicos e contratuais {copy.daRede}
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-1.5 shadow-sm">
            <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
              {formatHeaderDate(now)}
            </span>
            <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium tabular-nums text-gray-600">
              {formatHeaderTime(now)}
            </span>
          </div>
        </header>

        <div className={[dashboardPageScrollAreaClass, 'mt-4 min-h-0 flex-1 pb-5'].join(' ')}>
          <PrefeituraRelatoriosHubPanel />
        </div>
      </div>
    </div>
  )
}

export function PrefeituraRelatoriosCategoryPage() {
  const { user } = usePrefeituraAuth()
  const { categoryId } = useParams<{ categoryId: string }>()
  const category = getReportCategory(categoryId)

  if (!category) {
    return <Navigate to={prefeituraRoutes.relatorios} replace />
  }

  const Icon = category.icon

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col" aria-label={category.title}>
      <div className={[dashboardPageShellClass, 'flex min-h-0 flex-1 flex-col bg-slate-50/80 py-5'].join(' ')}>
        <header className="relative z-10 shrink-0 overflow-visible">
          <div className="mt-1 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
              <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
              {category.title}
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">{category.pageSubtitle}</p>
        </header>

        <div className={[dashboardPageScrollAreaClass, 'mt-4 min-h-0 flex-1 pb-4'].join(' ')}>
          <RelatoriosCategoryPanel
            category={category}
            portal="prefeitura"
            backPath={prefeituraRoutes.relatorios}
            unitLabel={user?.entidadeRazaoSocial ?? 'Prefeitura'}
          />
        </div>
      </div>
    </div>
  )
}
