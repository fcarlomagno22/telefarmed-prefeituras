import { TableRowsSkeleton } from '../../../prefeitura/skeletons/prefeituraSkeletonUi'
import { Skeleton } from '../../../ui/Skeleton'

export function AdminProfissionalRepasseTabSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-busy="true" aria-label="Carregando repasse profissionais">
      <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-72 max-w-full" />
        </div>
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>

      <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 lg:flex-row lg:items-center">
        <Skeleton className="h-10 w-full flex-1 rounded-xl lg:max-w-md" />
        <div className="grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-2 py-2">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {Array.from({ length: 10 }).map((_, index) => (
                <th key={index} className="px-4 py-3">
                  <Skeleton className={`mx-auto h-3 ${index === 0 ? 'w-24' : 'w-14'}`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <TableRowsSkeleton
              columns={10}
              rows={8}
              columnWidths={[
                'w-32',
                'w-28',
                'w-16',
                'w-10',
                'w-16',
                'w-12',
                'w-20',
                'w-16',
                'w-20',
                'w-16',
              ]}
            />
          </tbody>
        </table>
      </div>
    </div>
  )
}
