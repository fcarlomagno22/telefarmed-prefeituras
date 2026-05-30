import type { ReactNode } from 'react'
import { Skeleton } from '../../../ui/Skeleton'
import {
  adminDashboardHourlyBodyClass,
  adminDashboardTopRowBodyClass,
  adminDashboardTopRowDashCardClass,
} from '../adminDashboardUi'

const KPI_GRID_CLASS = 'grid h-full min-h-0 grid-cols-3 grid-rows-2 gap-3'
const NOC_SKELETON_ROWS = 5
const MUNICIPALITY_TABLE_ROWS = 6

const KPI_CARD_SKELETON_CLASS = [
  'relative flex min-h-0 w-full flex-col items-center justify-center rounded-2xl border border-gray-200',
  'bg-gradient-to-b from-white to-gray-50/50 px-4 py-4 text-center',
  'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]',
].join(' ')

function AdminDashboardDashCardSkeleton({
  title,
  subtitle,
  className = '',
  bodyClassName = 'p-4',
  fillHeight = false,
  action,
  children,
}: {
  title: string
  subtitle?: string
  className?: string
  bodyClassName?: string
  fillHeight?: boolean
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <article
      className={[
        'overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]',
        fillHeight ? 'flex h-full min-h-[14rem] w-full flex-col' : 'shrink-0',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    >
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div
        className={[fillHeight ? 'flex min-h-0 flex-1 flex-col' : '', bodyClassName]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </article>
  )
}

function AdminDashboardKpiCardSkeleton() {
  return (
    <article className={KPI_CARD_SKELETON_CLASS}>
      <Skeleton className="absolute inset-x-2.5 top-0 h-0.5 rounded-full" />
      <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
      <span className="mt-0.5 block w-full min-w-0 text-center">
        <Skeleton className="mx-auto h-3 w-[4.5rem]" />
        <Skeleton className="mx-auto mt-0.5 h-6 w-12" />
        <Skeleton className="mx-auto mt-0.5 h-3 w-20" />
      </span>
    </article>
  )
}

export function AdminDashboardKpiGridSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={[KPI_GRID_CLASS, className].filter(Boolean).join(' ')} aria-hidden>
      {Array.from({ length: 6 }, (_, index) => (
        <AdminDashboardKpiCardSkeleton key={index} />
      ))}
    </div>
  )
}

function AdminNocIncidentListSkeleton() {
  return (
    <ul className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto overscroll-y-contain [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5">
      {Array.from({ length: NOC_SKELETON_ROWS }, (_, index) => (
        <li key={index} className="border-l-4 border-l-gray-200/90">
          <div className="flex w-full items-start gap-3 px-4 py-3">
            <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <Skeleton className="h-3.5 w-[72%] max-w-xs" />
                <Skeleton className="h-[11px] w-10 shrink-0" />
              </span>
              <span className="mt-0.5 flex flex-wrap items-center gap-2">
                <Skeleton className="h-3 w-28 max-w-[55%]" />
                <Skeleton className="h-4 w-14 rounded bg-gray-100" />
              </span>
              <span className="mt-1.5 flex flex-wrap items-center gap-2">
                <Skeleton className="h-5 w-[4.5rem] rounded-md" />
                <Skeleton className="h-2.5 w-32" />
                <Skeleton className="h-2.5 w-14" />
              </span>
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function AdminNocCentralPanelSkeleton({ className = '' }: { className?: string }) {
  return (
    <AdminDashboardDashCardSkeleton
      title="Central de incidentes"
      subtitle="Operação Telefarmed · não confundir com alertas da prefeitura"
      fillHeight
      className={[className, adminDashboardTopRowDashCardClass].filter(Boolean).join(' ')}
      bodyClassName={[adminDashboardTopRowBodyClass, 'p-0'].join(' ')}
      action={
        <span className="inline-flex items-center gap-2">
          <Skeleton className="h-5 min-w-[1.25rem] rounded-full px-2" />
          <span className="inline-flex items-center gap-0.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3.5 w-3.5 rounded" />
          </span>
        </span>
      }
    >
      <AdminNocIncidentListSkeleton />
    </AdminDashboardDashCardSkeleton>
  )
}

function AdminPlatformPackageStatCellSkeleton({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-lg border border-gray-100 bg-slate-50/90 px-2 py-1 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <Skeleton className="mt-1 h-5 w-12 sm:h-6 sm:w-14" />
    </div>
  )
}

export function AdminPlatformPackagePanelSkeleton({ className = '' }: { className?: string }) {
  return (
    <AdminDashboardDashCardSkeleton
      title="Pacote agregado"
      subtitle="Todos os contratos no recorte"
      fillHeight
      className={[className, adminDashboardTopRowDashCardClass].filter(Boolean).join(' ')}
      bodyClassName={[adminDashboardTopRowBodyClass, 'gap-2 !p-3'].join(' ')}
      action={
        <span className="inline-flex items-center gap-1">
          <Skeleton className="h-3.5 w-3.5 rounded" />
          <Skeleton className="h-3 w-14" />
        </span>
      }
    >
      <div className="flex h-full min-h-0 flex-1 flex-col gap-2">
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
          <AdminPlatformPackageStatCellSkeleton label="Contratadas" />
          <AdminPlatformPackageStatCellSkeleton label="Utilizadas" />
          <AdminPlatformPackageStatCellSkeleton label="Restantes" />
        </div>
        <div className="flex shrink-0 flex-col gap-2 rounded-lg border border-gray-100 bg-gradient-to-b from-slate-50/90 to-white px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-baseline gap-2">
              <div className="flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                <Skeleton className="h-3.5 w-3.5 rounded" />
                Uso agregado
              </div>
              <Skeleton className="h-6 w-10" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
          <p className="text-center text-[10px] leading-snug text-gray-300">
            Consumo médio de todos os contratos no recorte atual
          </p>
        </div>
      </div>
    </AdminDashboardDashCardSkeleton>
  )
}

export function AdminTerminalsPanelSkeleton({ className = '' }: { className?: string }) {
  return (
    <AdminDashboardDashCardSkeleton
      title="Terminais UBT"
      subtitle="Status agregado no recorte"
      fillHeight
      className={className}
      bodyClassName={[adminDashboardHourlyBodyClass, 'flex flex-col justify-center gap-3 p-4'].join(
        ' ',
      )}
      action={<Skeleton className="h-3 w-14" />}
    >
      <div className="flex items-center justify-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <Skeleton className="h-full w-[68%] rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-emerald-50 px-2 py-2 font-semibold text-emerald-800">
          Online
          <Skeleton className="mx-auto mt-0.5 h-5 w-8" />
        </div>
        <div className="rounded-lg bg-red-50 px-2 py-2 font-semibold text-red-700">
          Offline
          <Skeleton className="mx-auto mt-0.5 h-5 w-8" />
        </div>
        <div className="rounded-lg bg-amber-50 px-2 py-2 font-semibold text-amber-800">
          <span className="inline-flex items-center justify-center gap-1">
            <Skeleton className="h-3 w-3 rounded" />
            Manutenção
          </span>
          <Skeleton className="mx-auto mt-0.5 h-5 w-8" />
        </div>
      </div>
    </AdminDashboardDashCardSkeleton>
  )
}

export function AdminRevenuePanelSkeleton({ className = '' }: { className?: string }) {
  return (
    <AdminDashboardDashCardSkeleton
      title="Receita estimada"
      subtitle="Pacote contratado + consultas avulsas"
      fillHeight
      className={className}
      bodyClassName={[adminDashboardHourlyBodyClass, 'flex flex-col justify-center gap-3 p-4'].join(
        ' ',
      )}
      action={<Skeleton className="h-3 w-20" />}
    >
      <Skeleton className="mx-auto h-8 w-36" />
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700/60">
            Pacote
          </p>
          <Skeleton className="mx-auto mt-1 h-4 w-20" />
          <Skeleton className="mx-auto mt-0.5 h-2.5 w-16" />
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700/60">Avulso</p>
          <Skeleton className="mx-auto mt-1 h-4 w-20" />
          <Skeleton className="mx-auto mt-0.5 h-2.5 w-16" />
        </div>
      </div>
    </AdminDashboardDashCardSkeleton>
  )
}

function AdminOperationalMetricSkeleton({
  borderClass,
  bgClass,
  iconBgClass,
}: {
  borderClass: string
  bgClass: string
  iconBgClass: string
}) {
  return (
    <div
      className={['rounded-lg border px-2 py-2 text-center', borderClass, bgClass].join(' ')}
    >
      <span
        className={[
          'mx-auto flex h-7 w-7 items-center justify-center rounded-lg',
          iconBgClass,
        ].join(' ')}
      >
        <Skeleton className="h-3.5 w-3.5 rounded" />
      </span>
      <Skeleton className="mx-auto mt-1 h-6 w-10" />
      <Skeleton className="mx-auto mt-1 h-2.5 w-14" />
    </div>
  )
}

export function AdminOperationalSummaryPanelSkeleton({ className = '' }: { className?: string }) {
  return (
    <AdminDashboardDashCardSkeleton
      title="Resumo operacional"
      subtitle="Recorte atual"
      fillHeight
      className={className}
      bodyClassName={[adminDashboardHourlyBodyClass, 'flex flex-col justify-between gap-2 p-3'].join(
        ' ',
      )}
      action={
        <span className="inline-flex items-center gap-0.5">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3.5 w-3.5 rounded" />
        </span>
      }
    >
      <div className="grid grid-cols-3 gap-1.5">
        <AdminOperationalMetricSkeleton
          borderClass="border-sky-100"
          bgClass="bg-sky-50/70"
          iconBgClass="bg-sky-100"
        />
        <AdminOperationalMetricSkeleton
          borderClass="border-red-200/90"
          bgClass="bg-red-50/80"
          iconBgClass="bg-red-100"
        />
        <AdminOperationalMetricSkeleton
          borderClass="border-orange-100"
          bgClass="bg-orange-50/60"
          iconBgClass="bg-orange-100"
        />
      </div>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-2.5 py-1.5">
        <Skeleton className="h-2.5 w-40 max-w-[55%]" />
        <ul className="flex shrink-0 items-center gap-2">
          {[0, 1, 2].map((index) => (
            <li key={index} className="inline-flex items-center gap-1">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-2.5 w-4" />
            </li>
          ))}
        </ul>
      </div>
    </AdminDashboardDashCardSkeleton>
  )
}

function AdminMunicipalityTableRowSkeleton() {
  return (
    <tr className="text-gray-800">
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-2">
          <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-14" />
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 shrink-0 rounded" />
          <Skeleton className="h-4 w-36 max-w-[12rem]" />
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <Skeleton className="mx-auto h-3 w-6" />
      </td>
      <td className="px-4 py-3 text-center">
        <Skeleton className="mx-auto h-3 w-14" />
      </td>
      <td className="px-4 py-3 text-center">
        <Skeleton className="mx-auto h-3.5 w-8" />
      </td>
      <td className="px-4 py-3 text-center">
        <Skeleton className="mx-auto h-3.5 w-10" />
      </td>
      <td className="px-4 py-3 text-center">
        <span className="inline-flex items-center justify-center gap-0.5">
          <Skeleton className="h-3.5 w-6" />
          <Skeleton className="h-3 w-8" />
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <Skeleton className="mx-auto h-6 min-w-[1.5rem] rounded-full px-2" />
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-center">
          <Skeleton className="h-6 w-[5.5rem] rounded-md" />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-center">
          <Skeleton className="size-8 rounded-lg" />
        </div>
      </td>
    </tr>
  )
}

export function AdminMunicipalitiesTableSkeleton() {
  return (
    <AdminDashboardDashCardSkeleton
      className="w-full min-w-0 xl:col-span-12"
      title="Municípios contratados"
      subtitle="Semáforo operacional · clique para drill-down"
      bodyClassName="p-0"
      action={
        <span className="inline-flex items-center gap-0.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3.5 w-3.5 rounded" />
        </span>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-slate-50/50 px-4 py-3">
        <Skeleton className="h-3.5 w-48 max-w-full" />
        <Skeleton className="h-10 w-48 rounded-xl sm:min-w-[12rem]" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Semáforo</th>
              <th className="px-4 py-3">Município</th>
              <th className="px-4 py-3 text-center">UF</th>
              <th className="px-4 py-3 text-center">Contrato</th>
              <th className="px-4 py-3 text-center">Hoje</th>
              <th className="px-4 py-3 text-center">Pacote</th>
              <th className="px-4 py-3 text-center">Terminais</th>
              <th className="px-4 py-3 text-center">Incidentes</th>
              <th className="px-4 py-3 text-center">SLA</th>
              <th className="px-4 py-3 text-center">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: MUNICIPALITY_TABLE_ROWS }, (_, index) => (
              <AdminMunicipalityTableRowSkeleton key={index} />
            ))}
          </tbody>
        </table>
      </div>
    </AdminDashboardDashCardSkeleton>
  )
}

export function AdminDashboardHeaderSkeleton() {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-1 h-7 w-full max-w-2xl sm:h-8" />
        <Skeleton className="mt-1 h-4 w-full max-w-2xl" />
      </div>
      <div className="relative shrink-0">
        <div className="inline-flex items-center justify-end gap-1 rounded-md px-1 py-0.5">
          <Skeleton className="h-2.5 w-28" />
          <span className="text-[10px] text-gray-300" aria-hidden>
            ·
          </span>
          <Skeleton className="h-2.5 w-[4.5rem]" />
          <Skeleton className="ml-0.5 h-3 w-3 shrink-0 rounded" />
        </div>
      </div>
    </header>
  )
}
