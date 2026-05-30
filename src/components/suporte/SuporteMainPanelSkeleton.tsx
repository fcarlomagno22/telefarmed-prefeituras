import { Skeleton } from '../ui/Skeleton'
import { TableRowsSkeleton } from '../prefeitura/skeletons/prefeituraSkeletonUi'

const TABLE_ROW_COUNT = 6

type SuporteMainPanelSkeletonProps = {
  showUbtColumn?: boolean
  showToolbarAction?: boolean
}

export function SuporteMainPanelSkeleton({
  showUbtColumn = false,
  showToolbarAction = false,
}: SuporteMainPanelSkeletonProps) {
  const columnCount = showUbtColumn ? 7 : 6
  const headerWidths = showUbtColumn
    ? ['w-20', 'w-24', 'w-28', 'w-16', 'w-16', 'w-20', 'w-8']
    : ['w-20', 'w-32', 'w-16', 'w-16', 'w-20', 'w-8']

  return (
    <section
      className="flex h-full min-h-[28rem] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
      aria-busy="true"
      aria-label="Carregando chamados de suporte"
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
        <Skeleton className="h-10 min-h-10 flex-1 rounded-xl sm:max-w-md" />
        <div className="flex flex-wrap items-center gap-2">
          {showUbtColumn ? (
            <Skeleton className="h-10 w-[8.5rem] rounded-xl" />
          ) : null}
          <Skeleton className="h-10 w-40 rounded-xl" />
          {showToolbarAction ? <Skeleton className="h-10 w-44 rounded-xl" /> : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-3 py-2 sm:px-4">
        <div className="mb-2 flex gap-2 border-b border-gray-100 pb-2">
          {headerWidths.map((width) => (
            <Skeleton key={width} className={`h-3 shrink-0 ${width}`} />
          ))}
        </div>
        <table className="w-full">
          <tbody>
            <TableRowsSkeleton
              columns={columnCount}
              rows={TABLE_ROW_COUNT}
              columnWidths={
                showUbtColumn
                  ? ['w-16', 'w-28', 'w-36', 'w-20', 'w-16', 'w-20', 'w-8']
                  : ['w-16', 'w-40', 'w-20', 'w-16', 'w-20', 'w-8']
              }
            />
          </tbody>
        </table>
      </div>

      <footer className="flex shrink-0 flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Skeleton className="h-3 w-56" />
        <div className="flex justify-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="size-8 rounded-lg" />
          ))}
        </div>
      </footer>
    </section>
  )
}
