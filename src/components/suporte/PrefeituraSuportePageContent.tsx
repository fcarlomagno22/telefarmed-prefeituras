import { useEntidadeCopy } from '../../hooks/useEntidadeCopy'
import { usePrefeituraAuth } from '../../contexts/PrefeituraAuthContext'
import { PortalSuportePageShell } from './PortalSuportePageShell'

export function PrefeituraSuportePageContent() {
  const { getAccessToken } = usePrefeituraAuth()
  const copy = useEntidadeCopy()

  return (
    <PortalSuportePageShell
      variant="prefeitura"
      getAccessToken={getAccessToken}
      summaryTitle={`Chamados ${copy.daRede}`}
      headerVariant="prefeitura"
      readOnlyForTicket={(ticket) => ticket.source !== 'prefeitura'}
    />
  )
}
