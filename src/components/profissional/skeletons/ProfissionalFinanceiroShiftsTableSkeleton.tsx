import { Skeleton } from '../../ui/Skeleton'
import { TableRowsSkeleton } from '../../prefeitura/skeletons/prefeituraSkeletonUi'

const SHIFTS_ROW_COUNT = 5

export function ProfissionalFinanceiroShiftsTableSkeleton() {
  return (
    <div className="overflow-hidden px-3 py-2 sm:px-4" aria-busy="true" aria-label="Carregando extrato">
      <div className="mb-2 flex gap-3 border-b border-gray-100 pb-2">
        {['w-12', 'w-16', 'w-20', 'w-14', 'w-16'].map((width, index) => (
          <Skeleton key={`header-col-${index}`} className={`h-3 shrink-0 ${width}`} />
        ))}
      </div>
      <table className="w-full">
        <tbody>
          <TableRowsSkeleton
            columns={5}
            rows={SHIFTS_ROW_COUNT}
            columnWidths={['w-16', 'w-24', 'w-20', 'w-16', 'w-20']}
          />
        </tbody>
      </table>
    </div>
  )
}
