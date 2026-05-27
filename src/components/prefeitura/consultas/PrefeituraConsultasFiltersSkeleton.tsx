import { Skeleton } from '../../ui/Skeleton'
import { prefeituraConsultasCardClass } from './prefeituraConsultasCardClass'

const FILTER_FIELDS = [
  { labelWidth: 'w-[6.5rem]' },
  { labelWidth: 'w-12' },
  { labelWidth: 'w-14' },
] as const

export function PrefeituraConsultasFiltersSkeleton() {
  return (
    <section className={['p-4', prefeituraConsultasCardClass].join(' ')} aria-hidden>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-4 w-36" />
        <div className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2">
          <Skeleton className="h-3.5 w-3.5 rounded" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {FILTER_FIELDS.map((field, index) => (
          <div key={index}>
            <Skeleton className={['mb-1.5 h-3', field.labelWidth].join(' ')} />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </section>
  )
}
