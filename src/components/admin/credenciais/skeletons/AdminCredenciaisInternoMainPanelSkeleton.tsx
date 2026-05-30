import { Skeleton } from '../../../ui/Skeleton'
import { adminPessoasPanelEmbeddedShellClass } from '../../pessoas/adminPessoasMainPanelShell'
import {
  CredentialTableActionCellSkeleton,
  CredentialTableUserCellSkeleton,
  FilterSelectSkeleton,
  KpiCardsRowSkeleton,
  PanelTitleBlockSkeleton,
  SearchFieldSkeleton,
} from './adminCredenciaisSkeletonUi'

function InternoTableBodySkeleton() {
  return (
    <>
      {Array.from({ length: 6 }, (_, rowIndex) => (
        <tr key={rowIndex} className="text-sm">
          <td className="px-5 py-4 sm:px-6">
            <CredentialTableUserCellSkeleton />
          </td>
          <td className="px-3 py-4 text-center">
            <Skeleton className="mx-auto h-4 w-20" />
          </td>
          <td className="px-3 py-4 text-center">
            <Skeleton className="mx-auto h-4 w-24" />
          </td>
          <td className="px-3 py-4 text-center">
            <Skeleton className="mx-auto h-6 w-[4.5rem] rounded-full" />
          </td>
          <td className="px-3 py-4 text-center">
            <Skeleton className="mx-auto h-6 w-14 rounded-full" />
          </td>
          <td className="px-3 py-4 text-center">
            <Skeleton className="mx-auto h-4 w-16" />
          </td>
          <td className="px-5 py-4 text-center sm:px-6">
            <CredentialTableActionCellSkeleton />
          </td>
        </tr>
      ))}
    </>
  )
}

export function AdminCredenciaisInternoMainPanelSkeleton() {
  return (
    <section className={adminPessoasPanelEmbeddedShellClass} aria-hidden>
      <div className="shrink-0 border-b border-gray-200 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <PanelTitleBlockSkeleton titleWidth="w-40" descriptionWidth="w-full max-w-sm" />
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:max-w-3xl lg:justify-end">
            <FilterSelectSkeleton className="min-w-[160px] w-[10rem] sm:w-[10rem]" />
            <SearchFieldSkeleton />
          </div>
        </div>
        <div className="mt-5">
          <KpiCardsRowSkeleton count={4} className="sm:grid-cols-2 xl:grid-cols-4" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[24%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3.5 sm:px-6">Colaborador</th>
              <th className="px-3 py-3.5 text-center">Área</th>
              <th className="px-3 py-3.5 text-center">Função</th>
              <th className="px-3 py-3.5 text-center">Nível</th>
              <th className="px-3 py-3.5 text-center">Status</th>
              <th className="px-3 py-3.5 text-center">Último acesso</th>
              <th className="px-5 py-3.5 text-center sm:px-6">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            <InternoTableBodySkeleton />
          </tbody>
        </table>
      </div>

      <footer className="flex shrink-0 border-t border-gray-200 px-5 py-4 sm:px-6">
        <Skeleton className="h-3.5 w-56" />
      </footer>
    </section>
  )
}
