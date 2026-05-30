import {
  CatalogTableActionCellSkeleton,
  CatalogTableNameCellSkeleton,
  CatalogTableSkeleton,
  CatalogTableStatusCellSkeleton,
  ConfigCatalogPanelShellSkeleton,
} from './adminConfiguracoesSkeletonUi'

export function AdminConfigConsultaPanelSkeleton() {
  return (
    <ConfigCatalogPanelShellSkeleton withSubTabs headerButtonWidth="w-36">
      <CatalogTableSkeleton
        columns={[
          { label: 'Nome' },
          { label: 'Status', align: 'center' },
          { label: 'Ações', align: 'center' },
        ]}
        renderRow={() => (
          <>
            <td className="px-4 py-3 align-top">
              <CatalogTableNameCellSkeleton />
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
