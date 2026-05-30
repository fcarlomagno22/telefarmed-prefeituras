import type { ReactNode } from 'react'
import { Skeleton } from '../../../ui/Skeleton'
import {
  configCatalogTableClass,
  configCatalogTableHeadClass,
  configCatalogTableScrollClass,
  configCatalogTableShellClass,
  configPanelBodyClass,
  configPanelSectionClass,
  configSubTabsClass,
} from '../adminConfiguracoesUi'

export function AdminConfiguracoesTabsSkeleton() {
  const tabWidths = [
    { label: 'w-14', hint: 'w-[9.5rem]' },
    { label: 'w-[4.5rem]', hint: 'w-[7.5rem]' },
    { label: 'w-14', hint: 'w-[7.25rem]' },
    { label: 'w-[7.5rem]', hint: 'w-[6.5rem]' },
  ]

  return (
    <nav
      aria-hidden
      className="flex shrink-0 gap-0 overflow-x-auto border-b border-gray-200 bg-white px-4 sm:px-5"
    >
      {tabWidths.map((widths, index) => (
        <div key={index} className="relative shrink-0 px-4 py-3 sm:px-5">
          <Skeleton className={`h-3.5 ${widths.label}`} />
          <Skeleton className={`mt-1.5 h-2.5 ${widths.hint}`} />
          {index === 0 ? (
            <span
              className="pointer-events-none absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 sm:inset-x-4"
              aria-hidden
            />
          ) : null}
        </div>
      ))}
    </nav>
  )
}

export function ConfigSubTabsSkeleton() {
  return (
    <div className={configSubTabsClass} aria-hidden>
      <Skeleton className="h-7 w-[5.5rem] rounded-lg" />
      <Skeleton className="h-7 w-28 rounded-lg" />
    </div>
  )
}

export function ConfigPanelSectionHeaderSkeleton({
  buttonWidth = 'w-36',
  descriptionLines = 2,
}: {
  buttonWidth?: string
  descriptionLines?: 1 | 2
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-40" />
        {descriptionLines >= 1 ? <Skeleton className="h-4 w-full max-w-md" /> : null}
        {descriptionLines >= 2 ? <Skeleton className="h-4 w-[88%] max-w-sm" /> : null}
      </div>
      <Skeleton className={`h-10 ${buttonWidth} shrink-0 rounded-xl`} />
    </div>
  )
}

export function CatalogTableNameCellSkeleton() {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-3.5 w-32 max-w-full" />
      <Skeleton className="h-2.5 w-20 max-w-full" />
    </div>
  )
}

export function CatalogTableTextCellSkeleton({ width = 'w-28' }: { width?: string }) {
  return <Skeleton className={`h-3.5 ${width} max-w-full`} />
}

export function CatalogTableStatusCellSkeleton() {
  return (
    <div className="flex justify-center">
      <Skeleton className="h-6 w-[6.75rem] rounded-full" />
    </div>
  )
}

export function CatalogTableActionCellSkeleton() {
  return (
    <div className="flex justify-center">
      <Skeleton className="h-9 w-9 rounded-lg" />
    </div>
  )
}

type CatalogTableSkeletonProps = {
  columns: Array<{ label: string; align?: 'left' | 'center'; minWidth?: string }>
  rows?: number
  renderRow: (rowIndex: number) => ReactNode
}

export function CatalogTableSkeleton({ columns, rows = 6, renderRow }: CatalogTableSkeletonProps) {
  return (
    <div className={configCatalogTableShellClass} aria-hidden>
      <div className={configCatalogTableScrollClass}>
        <table className={configCatalogTableClass}>
          <thead className={configCatalogTableHeadClass}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.label}
                  className={[
                    column.minWidth ?? '',
                    column.align === 'center' ? 'text-center' : '',
                    'px-3 py-3 first:px-4 last:px-4',
                  ].join(' ')}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr key={rowIndex}>{renderRow(rowIndex)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ConfigCatalogPanelShellSkeleton({
  withSubTabs = false,
  headerButtonWidth = 'w-36',
  descriptionLines = 2,
  children,
}: {
  withSubTabs?: boolean
  headerButtonWidth?: string
  descriptionLines?: 1 | 2
  children: ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-hidden>
      {withSubTabs ? <ConfigSubTabsSkeleton /> : null}
      <div className={configPanelBodyClass}>
        <section className={configPanelSectionClass}>
          <ConfigPanelSectionHeaderSkeleton
            buttonWidth={headerButtonWidth}
            descriptionLines={descriptionLines}
          />
          {children}
        </section>
      </div>
    </div>
  )
}
