import { Skeleton } from '../../ui/Skeleton'
import { PrefeituraConsultasDailyChartSkeleton } from './PrefeituraConsultasDailyChartSkeleton'
import { prefeituraConsultasCardClass } from './prefeituraConsultasCardClass'

const SPECIALTY_COUNT = 6

export function PrefeituraConsultasSidebarPanelSkeleton() {
  return (
    <aside
      className="flex h-full min-h-0 flex-col gap-4"
      aria-busy="true"
      aria-label="Carregando painel lateral de consultas"
    >
      <section className={['shrink-0 p-4', prefeituraConsultasCardClass].join(' ')}>
        <Skeleton className="h-4 w-[8.5rem]" />
        <Skeleton className="mt-0.5 h-3 w-44" />
        <div className="mt-2.5">
          <PrefeituraConsultasDailyChartSkeleton />
        </div>
      </section>

      <section className={['flex min-h-0 flex-1 flex-col p-4', prefeituraConsultasCardClass].join(' ')}>
        <div className="shrink-0">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="mt-0.5 h-3 w-40" />
        </div>
        <ul className="mt-3 flex min-h-0 flex-1 flex-col justify-between gap-2">
          {Array.from({ length: SPECIALTY_COUNT }).map((_, index) => (
            <li key={index} className="flex items-center justify-between gap-3">
              <Skeleton
                className={[
                  'h-4 min-w-0 flex-1',
                  index === 0 ? 'max-w-[7rem]' : index === 5 ? 'max-w-[3.5rem]' : 'max-w-[5.5rem]',
                ].join(' ')}
              />
              <Skeleton className="h-6 w-[5.5rem] shrink-0 rounded-full" />
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}
