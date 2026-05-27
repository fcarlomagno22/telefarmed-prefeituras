import { adminClientesSummary } from '../../../data/adminClientesMock'
import { formatAdminClientesNumber } from './adminClientesUi'

const overviewStatusDots = {
  ativas: 'bg-emerald-500',
  implantacao: 'bg-blue-500',
  prospects: 'bg-violet-500',
  suspensas: 'bg-orange-500',
  semContrato: 'bg-gray-400',
} as const

const statusBreakdown = [
  { key: 'ativas', label: 'Ativas', count: adminClientesSummary.porStatus.ativas },
  { key: 'implantacao', label: 'Implantação', count: adminClientesSummary.porStatus.implantacao },
  { key: 'prospects', label: 'Prospects', count: adminClientesSummary.porStatus.prospects },
  { key: 'suspensas', label: 'Suspensas', count: adminClientesSummary.porStatus.suspensas },
  { key: 'semContrato', label: 'Sem contrato', count: adminClientesSummary.porStatus.semContrato },
] as const

const columnShellClass =
  'relative flex min-w-0 flex-col justify-center px-5 py-4 max-md:border-b max-md:border-gray-200 md:px-6'

const columnCenteredClass = [columnShellClass, 'text-center'].join(' ')

const columnVerticalDividerClass =
  'pointer-events-none absolute right-0 top-4 bottom-4 hidden w-px bg-gray-200 md:block'

export function AdminClientesOverviewRow() {
  return (
    <section
      className="min-w-0 w-full overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]"
      aria-label="Indicadores de clientes"
    >
      <div className="grid min-w-0 grid-cols-1 md:grid-cols-3">
        <div className={columnCenteredClass}>
          <span className={columnVerticalDividerClass} aria-hidden />
          <p className="text-xs font-medium text-gray-500">Total de clientes cadastrados</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-gray-900">
            {formatAdminClientesNumber(adminClientesSummary.totalCadastrados)}
          </p>
          <p className="mt-1 text-xs text-gray-400">100% do total</p>
        </div>

        <div className={columnCenteredClass}>
          <span className={columnVerticalDividerClass} aria-hidden />
          <p className="text-xs font-medium text-gray-500">Últimas atualizações</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {adminClientesSummary.ultimaAtualizacaoMunicipio}
          </p>
        </div>

        <div className={columnShellClass}>
          <p className="mb-2 text-xs font-medium text-gray-500">Clientes por status</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-2">
            {statusBreakdown.map((item) => (
              <li key={item.key} className="inline-flex items-center gap-1.5 text-xs">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${overviewStatusDots[item.key]}`}
                  aria-hidden
                />
                <span className="text-gray-500">{item.label}</span>
                <span className="font-bold tabular-nums text-gray-900">
                  {formatAdminClientesNumber(item.count)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
