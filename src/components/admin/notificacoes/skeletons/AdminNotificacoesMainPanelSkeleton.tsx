import { Skeleton } from '../../../ui/Skeleton'
import { dashboardMainPanelSurfaceClass } from '../../../layout/dashboardPageLayout'

const thClass = 'px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500'
const tdClass = 'px-2 py-3 text-center align-middle'

const TABLE_ROW_COUNT = 8

const TABLE_HEADERS = [
  'Assunto',
  'Destinatários',
  'Canais',
  'Prioridade',
  'Enviado por',
  'Data',
  'Ver',
] as const

function TableRowSkeleton({ dualChannel = false }: { dualChannel?: boolean }) {
  return (
    <tr className="text-gray-800">
      <td className={tdClass}>
        <Skeleton className="mx-auto h-3.5 w-[85%] max-w-[12rem]" />
      </td>
      <td className={tdClass}>
        <Skeleton className="mx-auto h-3 w-[80%] max-w-[9rem]" />
        <Skeleton className="mx-auto mt-1 h-2.5 w-10" />
      </td>
      <td className={tdClass}>
        <div className="flex flex-wrap justify-center gap-1">
          {dualChannel ? (
            <>
              <Skeleton className="h-5 w-[4.75rem] rounded-md" />
              <Skeleton className="h-5 w-[3.5rem] rounded-md" />
            </>
          ) : (
            <Skeleton className="h-5 w-[5rem] rounded-md" />
          )}
        </div>
      </td>
      <td className={tdClass}>
        <div className="flex justify-center">
          <Skeleton className="h-5 w-[5.25rem] rounded-md" />
        </div>
      </td>
      <td className={tdClass}>
        <Skeleton className="mx-auto h-3 w-[75%] max-w-[8rem]" />
      </td>
      <td className={tdClass}>
        <Skeleton className="mx-auto h-2.5 w-14" />
      </td>
      <td className={tdClass}>
        <Skeleton className="mx-auto h-7 w-7 rounded-lg" />
      </td>
    </tr>
  )
}

export function AdminNotificacoesMainPanelSkeleton() {
  return (
    <section
      className={[
        dashboardMainPanelSurfaceClass,
        'flex min-h-0 flex-1 flex-col !shrink',
      ].join(' ')}
      aria-busy="true"
      aria-label="Carregando histórico de envios"
    >
      <header className="shrink-0 border-b border-gray-100 px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-base font-bold text-gray-900">Histórico de envios</h2>
          <Skeleton className="mt-1 h-4 w-44" />
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Skeleton className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 rounded" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2 lg:w-[min(100%,36rem)]">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-white">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col style={{ width: '24%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '4%' }} />
          </colgroup>
          <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50">
            <tr>
              {TABLE_HEADERS.map((label) => (
                <th key={label} className={thClass}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {Array.from({ length: TABLE_ROW_COUNT }).map((_, index) => (
              <TableRowSkeleton key={index} dualChannel={index === 2 || index === 5} />
            ))}
          </tbody>
        </table>
      </div>

      <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-3 sm:px-6">
        <Skeleton className="h-3 w-52" />
      </footer>
    </section>
  )
}
