import { ExportFormatMenu, type ExportFormat } from '../ui/ExportFormatMenu'

export type ConsultasExportFormat = ExportFormat

type ConsultasExportMenuProps = {
  resultCount: number
  onSelect: (format: ConsultasExportFormat) => void
}

export function ConsultasExportMenu({ resultCount, onSelect }: ConsultasExportMenuProps) {
  return (
    <ExportFormatMenu
      resultCount={resultCount}
      itemSingular="consulta"
      itemPlural="consultas"
      onSelect={onSelect}
    />
  )
}
