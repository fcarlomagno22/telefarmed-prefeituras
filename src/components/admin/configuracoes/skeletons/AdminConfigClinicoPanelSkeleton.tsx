import { Skeleton } from '../../../ui/Skeleton'
import {
  CatalogTableActionCellSkeleton,
  CatalogTableNameCellSkeleton,
  CatalogTableSkeleton,
  CatalogTableStatusCellSkeleton,
  CatalogTableTextCellSkeleton,
  ConfigCatalogPanelShellSkeleton,
} from './adminConfiguracoesSkeletonUi'

export function AdminConfigClinicoPanelSkeleton() {
  return (
    <ConfigCatalogPanelShellSkeleton withSubTabs headerButtonWidth="w-[8.75rem]">
      <CatalogTableSkeleton
        columns={[
          { label: 'Nome' },
          { label: 'Conselho', minWidth: 'min-w-[14rem]' },
          { label: 'Sigla', align: 'center' },
          { label: 'Status', align: 'center' },
          { label: 'Ações', align: 'center' },
        ]}
        renderRow={() => (
          <>
            <td className="px-4 py-3 align-top">
              <CatalogTableNameCellSkeleton />
            </td>
            <td className="px-3 py-3 align-top">
              <CatalogTableTextCellSkeleton width="w-40" />
            </td>
            <td className="px-3 py-3 text-center align-middle">
              <div className="flex justify-center">
                <Skeleton className="h-3.5 w-10" />
              </div>
            </td>
            <td className="px-3 py-3 text-center align-middle">
              <CatalogTableStatusCellSkeleton />
            </td>
            <td className="px-4 py-3 text-center align-middle">
              <CatalogTableActionCellSkeleton />
            </td>
          </>
        )}
      />
    </ConfigCatalogPanelShellSkeleton>
  )
}
