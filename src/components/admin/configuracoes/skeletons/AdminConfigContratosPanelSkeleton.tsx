import {
  CatalogTableActionCellSkeleton,
  CatalogTableNameCellSkeleton,
  CatalogTableSkeleton,
  CatalogTableStatusCellSkeleton,
  CatalogTableTextCellSkeleton,
  ConfigCatalogPanelShellSkeleton,
} from './adminConfiguracoesSkeletonUi'

export function AdminConfigContratosPanelSkeleton() {
  return (
    <ConfigCatalogPanelShellSkeleton headerButtonWidth="w-44" descriptionLines={1}>
      <CatalogTableSkeleton
        columns={[
          { label: 'Nome' },
          { label: 'Descrição', minWidth: 'min-w-[14rem]' },
          { label: 'Status', align: 'center' },
          { label: 'Ações', align: 'center' },
        ]}
        renderRow={() => (
          <>
            <td className="px-4 py-3 align-top">
              <CatalogTableNameCellSkeleton />
            </td>
            <td className="px-3 py-3 align-top">
              <CatalogTableTextCellSkeleton width="w-56" />
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
