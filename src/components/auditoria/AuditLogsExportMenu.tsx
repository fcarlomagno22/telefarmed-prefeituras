import { ExportFormatMenu, type ExportFormat } from '../ui/ExportFormatMenu'

export type AuditLogsExportFormat = ExportFormat

type AuditLogsExportMenuProps = {
  resultCount: number
  onSelect: (format: AuditLogsExportFormat) => void
}

export function AuditLogsExportMenu({ resultCount, onSelect }: AuditLogsExportMenuProps) {
  return (
    <ExportFormatMenu
      resultCount={resultCount}
      itemSingular="evento"
      itemPlural="eventos"
      triggerLabel="Exportar logs"
      onSelect={onSelect}
    />
  )
}
