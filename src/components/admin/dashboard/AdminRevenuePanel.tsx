import type { AdminRevenueView } from '../../../utils/adminDashboardFilters'
import { DashCard } from '../../prefeitura/prefeituraDashboardUi'
import { adminDashboardHourlyBodyClass, formatAdminCurrency } from './adminDashboardUi'

type AdminRevenuePanelProps = {
  className?: string
  revenue: AdminRevenueView
  onClick?: () => void
}

export function AdminRevenuePanel({ className = '', revenue, onClick }: AdminRevenuePanelProps) {
  const packageShare =
    revenue.grandTotal > 0 ? Math.round((revenue.packageTotal / revenue.grandTotal) * 100) : 0

  return (
    <DashCard
      title="Receita estimada"
      subtitle="Pacote contratado + consultas avulsas"
      fillHeight
      className={className}
      bodyClassName={[adminDashboardHourlyBodyClass, 'flex flex-col justify-center gap-3 p-4'].join(
        ' ',
      )}
      action={
        onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="text-xs font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)]"
          >
            Por município
          </button>
        ) : null
      }
    >
      <p className="text-center text-2xl font-bold tracking-tight text-gray-900">
        {formatAdminCurrency(revenue.grandTotal)}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Pacote</p>
          <p className="mt-1 text-sm font-bold text-gray-900">
            {formatAdminCurrency(revenue.packageTotal)}
          </p>
          <p className="mt-0.5 text-[10px] text-emerald-700">{packageShare}% do total</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Avulso</p>
          <p className="mt-1 text-sm font-bold text-gray-900">
            {formatAdminCurrency(revenue.avulsoTotal)}
          </p>
          <p className="mt-0.5 text-[10px] text-amber-700">{100 - packageShare}% do total</p>
        </div>
      </div>
    </DashCard>
  )
}
