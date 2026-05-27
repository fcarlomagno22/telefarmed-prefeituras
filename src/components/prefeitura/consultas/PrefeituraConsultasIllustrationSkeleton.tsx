import { Skeleton } from '../../ui/Skeleton'
import { prefeituraConsultasCardClass } from './prefeituraConsultasCardClass'

type PrefeituraConsultasIllustrationSkeletonProps = {
  className?: string
}

export function PrefeituraConsultasIllustrationSkeleton({
  className = '',
}: PrefeituraConsultasIllustrationSkeletonProps) {
  return (
    <section
      className={['flex min-h-0 flex-col overflow-hidden', prefeituraConsultasCardClass, className]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    >
      <div className="flex min-h-0 flex-1 items-end justify-center overflow-hidden bg-gradient-to-b from-slate-50/70 to-white px-4 pt-5 pb-3">
        <Skeleton className="h-[min(100%,18rem)] w-full max-w-[280px] rounded-lg opacity-50" />
      </div>
    </section>
  )
}
