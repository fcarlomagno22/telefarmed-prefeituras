import { Skeleton } from '../../ui/Skeleton'
import { dashboardMainPanelSurfaceClass } from '../../layout/dashboardPageLayout'

const TABLE_ROW_COUNT = 6

const TABLE_HEADERS = [
  'w-14',
  'w-12',
  'w-[4.5rem]',
  'w-14',
  'w-[4.5rem]',
  'w-14',
  'w-14',
  'w-12',
  'w-8',
] as const

type PrefeituraConsultasMainPanelSkeletonProps = {
  fillHeight?: boolean
}

export function PrefeituraConsultasMainPanelSkeleton({
  fillHeight = false,
}: PrefeituraConsultasMainPanelSkeletonProps) {
  return (
    <section
      className={[
        dashboardMainPanelSurfaceClass,
        'flex min-w-0 flex-col',
        fillHeight ? 'h-full min-h-0' : '',
      ].join(' ')}
      aria-busy="true"
      aria-label="Carregando consultas por unidade"
    >
      <header className="shrink-0 border-b border-gray-100 px-4 py-3 sm:px-5">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="mt-0.5 h-3 w-64 max-w-full" />
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-10 min-h-10 w-full flex-1 rounded-xl" />
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Skeleton className="h-10 w-[6.75rem] rounded-xl" />
            <Skeleton className="h-10 w-[8.5rem] rounded-xl" />
          </div>
        </div>
      </header>

      <div
        className={[
          'overflow-y-auto overflow-x-auto bg-white',
          fillHeight ? 'min-h-0 flex-1' : 'max-h-[28rem] min-h-[12rem] flex-1 shrink-0',
        ].join(' ')}
      >
        <table className="w-full min-w-[58rem] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {TABLE_HEADERS.map((width, index) => (
                <th
                  key={index}
                  className={[
                    'px-2 py-2.5',
                    index === 0 ? 'px-4 text-left sm:px-5' : 'text-center',
                    index === TABLE_HEADERS.length - 1 ? 'sm:px-5' : '',
                  ].join(' ')}
                >
                  <Skeleton className={['mx-auto h-3', index === 0 ? 'ml-0' : '', width].join(' ')} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {Array.from({ length: TABLE_ROW_COUNT }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                <td className="px-4 py-2.5 sm:px-5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-0.5 h-3 w-32" />
                </td>
                <td className="px-2 py-2.5 text-center">
                  <Skeleton className="mx-auto h-3 w-14" />
                </td>
                <td className="px-2 py-2.5 text-center">
                  <Skeleton className="mx-auto h-4 w-12" />
                </td>
                <td className="px-2 py-2.5 text-center">
                  <Skeleton className="mx-auto h-4 w-12" />
                </td>
                <td className="px-2 py-2.5 text-center">
                  <Skeleton className="mx-auto h-4 w-10" />
                </td>
                <td className="px-2 py-2.5 text-center">
                  <Skeleton className="mx-auto h-4 w-10" />
                  <Skeleton className="mx-auto mt-0.5 h-3 w-12" />
                </td>
                <td className="px-2 py-2.5 text-center">
                  <Skeleton className="mx-auto h-4 w-14" />
                </td>
                <td className="px-2 py-2.5">
                  <Skeleton className="mx-auto h-6 w-[5.5rem] rounded-full" />
                </td>
                <td className="px-2 py-2.5 text-center sm:px-5">
                  <Skeleton className="mx-auto h-8 w-8 rounded-lg" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="shrink-0 border-t border-gray-200 bg-white px-4 py-2 sm:px-5">
        <Skeleton className="h-3 w-36" />
      </footer>
    </section>
  )
}
