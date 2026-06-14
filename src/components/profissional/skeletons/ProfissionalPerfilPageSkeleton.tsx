import { Skeleton } from '../../ui/Skeleton'
import {
  profissionalPerfilCardBodyClass,
  profissionalPerfilCardClass,
  profissionalPerfilCardHeaderClass,
  profissionalPerfilTopRowBodyClass,
  profissionalPerfilTopRowCardClass,
  profissionalPerfilTopRowHeaderClass,
} from '../perfil/profissionalPerfilUi'

const perfilGridClass = [
  'grid w-full grid-cols-1 gap-x-5 gap-y-4',
  '@min-[920px]:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)_288px]',
  '@min-[920px]:grid-rows-[auto_auto]',
  '@min-[920px]:items-stretch',
  '@min-[920px]:gap-y-3',
].join(' ')

function PerfilCardSkeleton({
  className,
  headerClassName,
  bodyClassName,
  fieldRows = 4,
  wide = false,
}: {
  className?: string
  headerClassName?: string
  bodyClassName?: string
  fieldRows?: number
  wide?: boolean
}) {
  return (
    <section className={[profissionalPerfilCardClass, className].filter(Boolean).join(' ')}>
      <header
        className={[profissionalPerfilCardHeaderClass, headerClassName].filter(Boolean).join(' ')}
      >
        <Skeleton className="h-[18px] w-[18px] shrink-0 rounded" />
        <Skeleton className="h-4 w-40" />
      </header>
      <div className={[profissionalPerfilCardBodyClass, bodyClassName].filter(Boolean).join(' ')}>
        <div className={wide ? 'grid gap-3.5 sm:grid-cols-2' : 'space-y-3'}>
          {Array.from({ length: fieldRows }).map((_, index) => (
            <div key={index} className={wide && index < 2 ? 'sm:col-span-1' : undefined}>
              <Skeleton className="mb-1 h-3 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
        {wide ? (
          <>
            <Skeleton className="mt-3 h-14 w-full rounded-lg" />
            <div className="flex justify-end pt-1">
              <Skeleton className="h-10 w-40 rounded-lg" />
            </div>
          </>
        ) : (
          <div className="flex justify-end pt-2">
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        )}
      </div>
    </section>
  )
}

function PerfilFotoCardSkeleton() {
  return (
    <section className={profissionalPerfilCardClass}>
      <header className={profissionalPerfilCardHeaderClass}>
        <Skeleton className="h-[18px] w-[18px] shrink-0 rounded" />
        <Skeleton className="h-4 w-28" />
      </header>
      <div className={[profissionalPerfilCardBodyClass, 'items-center text-center'].join(' ')}>
        <Skeleton className="h-28 w-28 rounded-full" />
        <Skeleton className="mt-3 h-9 w-full max-w-[12rem] rounded-lg" />
        <Skeleton className="mt-2 h-3 w-40" />
      </div>
    </section>
  )
}

function PerfilDocumentosCardSkeleton() {
  return (
    <section className={profissionalPerfilCardClass}>
      <header className={profissionalPerfilCardHeaderClass}>
        <Skeleton className="h-[18px] w-[18px] shrink-0 rounded" />
        <Skeleton className="h-4 w-32" />
      </header>
      <div className={profissionalPerfilCardBodyClass}>
        <ul className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <li
              key={index}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                <div className="min-w-0 space-y-1">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-8 w-20 shrink-0 rounded-lg" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function PerfilResumoCardSkeleton() {
  return (
    <section className={[profissionalPerfilCardClass, 'shrink-0'].join(' ')}>
      <header className={profissionalPerfilCardHeaderClass}>
        <Skeleton className="h-[18px] w-[18px] shrink-0 rounded" />
        <Skeleton className="h-4 w-32" />
      </header>
      <div className={profissionalPerfilCardBodyClass}>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg border border-gray-100 bg-gray-50/60 p-2.5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-1 text-center">
              <Skeleton className="mx-auto h-2.5 w-14" />
              <Skeleton className="mx-auto h-3 w-10" />
              <Skeleton className="mx-auto h-2.5 w-12" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-3 h-14 w-full rounded-lg" />
      </div>
    </section>
  )
}

function PerfilAssinaturaCardSkeleton() {
  return (
    <section
      className={[
        profissionalPerfilCardClass,
        '@min-[920px]:col-start-2',
        profissionalPerfilTopRowCardClass,
      ].join(' ')}
    >
      <header className={[profissionalPerfilCardHeaderClass, profissionalPerfilTopRowHeaderClass].join(' ')}>
        <Skeleton className="h-[18px] w-[18px] shrink-0 rounded" />
        <Skeleton className="h-4 w-36" />
      </header>
      <div className={[profissionalPerfilCardBodyClass, profissionalPerfilTopRowBodyClass].join(' ')}>
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </section>
  )
}

export function ProfissionalPerfilPageSkeleton() {
  return (
    <div className={perfilGridClass} aria-busy="true" aria-label="Carregando perfil">
      <PerfilCardSkeleton
        className={['@min-[920px]:col-start-1', profissionalPerfilTopRowCardClass].join(' ')}
        headerClassName={profissionalPerfilTopRowHeaderClass}
        bodyClassName={profissionalPerfilTopRowBodyClass}
        fieldRows={6}
      />

      <PerfilAssinaturaCardSkeleton />

      <div className="flex flex-col gap-4 @min-[920px]:col-start-3 @min-[920px]:row-span-2 @min-[920px]:row-start-1">
        <PerfilFotoCardSkeleton />
        <PerfilDocumentosCardSkeleton />
        <PerfilResumoCardSkeleton />
      </div>

      <PerfilCardSkeleton
        className="@min-[920px]:col-span-2 @min-[920px]:col-start-1 @min-[920px]:row-start-2"
        bodyClassName="gap-3.5"
        fieldRows={6}
        wide
      />
    </div>
  )
}
