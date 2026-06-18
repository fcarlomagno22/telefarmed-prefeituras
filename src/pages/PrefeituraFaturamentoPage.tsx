import { Receipt } from 'lucide-react'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { DashboardPageHeader } from '../components/users/DashboardPageHeader'

export function PrefeituraFaturamentoPage() {
  return (
    <div className={dashboardPageShellClass} aria-label="Faturamento">
      <div className={dashboardPageHeaderWrapClass}>
        <DashboardPageHeader
          title="Faturamento"
          subtitle="Notas fiscais, competências e cobranças do contrato com a Telefarmed."
        />
      </div>

      <div className={dashboardPageScrollPaddingClass}>
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
            <Receipt className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <h2 className="mt-5 text-base font-semibold text-gray-900">Em breve</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-600">
            Esta área reunirá o histórico de faturamento, notas fiscais e acompanhamento financeiro
            do contrato da entidade.
          </p>
        </div>
      </div>
    </div>
  )
}
