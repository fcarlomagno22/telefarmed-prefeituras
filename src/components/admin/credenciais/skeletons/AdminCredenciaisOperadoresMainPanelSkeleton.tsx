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

type AdminCredenciaisOperadoresMainPanelSkeletonProps = {
  /** Sem filtro de escopo — abas Prefeitura e UBT. */
  fixedScope?: 'Prefeitura' | 'UBT'
  panelTitle: string
  panelDescription: string
}

function OperadoresTableBodySkeleton() {
  return (
    <>
      {Array.from({ length: 6 }, (_, rowIndex) => (
        <tr key={rowIndex} className="align-middle text-sm">
          <td className="px-5 py-4 sm:px-6">
            <CredentialTableUserCellSkeleton />
          </td>
          <td className="px-3 py-4 text-center align-middle">
            <Skeleton className="mx-auto h-6 w-14 rounded-full" />
          </td>
          <td className="px-3 py-4 text-center align-middle">
            <Skeleton className="mx-auto h-4 w-24" />
          </td>
          <td className="px-3 py-4 text-center align-middle">
            <div className="mx-auto max-w-[8rem] space-y-1">
              <Skeleton className="mx-auto h-3.5 w-20" />
              <Skeleton className="mx-auto h-3 w-full max-w-[7rem]" />
            </div>
          </td>
          <td className="px-3 py-4 text-center align-middle">
            <Skeleton className="mx-auto h-4 w-28" />
          </td>
          <td className="px-3 py-4 text-center align-middle">
            <Skeleton className="mx-auto h-4 w-16" />
          </td>
          <td className="px-5 py-4 text-center align-middle sm:px-6">
            <CredentialTableActionCellSkeleton />
          </td>
        </tr>
      ))}
    </>
  )
}

export function AdminCredenciaisOperadoresMainPanelSkeleton({
  fixedScope,
  panelTitle,
  panelDescription,
}: AdminCredenciaisOperadoresMainPanelSkeletonProps) {
  return (
    <section className={adminPessoasPanelEmbeddedShellClass} aria-hidden>
      <div className="shrink-0 border-b border-gray-200 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900">{panelTitle}</h2>
            <p className="mt-1 text-sm text-gray-500">{panelDescription}</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:max-w-4xl lg:justify-end">
            {!fixedScope ? (
              <FilterSelectSkeleton className="min-w-[140px] w-[8.75rem]" />
            ) : null}
            <FilterSelectSkeleton className="min-w-[190px] w-[11.875rem]" />
            <SearchFieldSkeleton className="lg:min-w-[22rem] lg:max-w-2xl" />
          </div>
        </div>
        <div className="mt-5">
          <KpiCardsRowSkeleton count={4} className="sm:grid-cols-2 xl:grid-cols-4" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[9%]" />
            <col className="w-[14%]" />
            <col className="w-[16%]" />
            <col className="w-[13%]" />
            <col className="w-[12%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3.5 text-left sm:px-6">Usuário</th>
              <th className="px-3 py-3.5 text-center">Escopo</th>
              <th className="px-3 py-3.5 text-center">Unidade</th>
              <th className="px-3 py-3.5 text-center">Unidade contratante</th>
              <th className="px-3 py-3.5 text-center">Perfil</th>
              <th className="px-3 py-3.5 text-center">Último acesso</th>
              <th className="px-5 py-3.5 text-center sm:px-6">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            <OperadoresTableBodySkeleton />
          </tbody>
        </table>
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 sm:px-6">
        <Skeleton className="h-3.5 w-64" />
      </footer>
    </section>
  )
}
