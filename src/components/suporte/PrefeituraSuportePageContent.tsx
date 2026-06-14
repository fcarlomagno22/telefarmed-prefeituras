import { usePrefeituraAuth } from '../../contexts/PrefeituraAuthContext'
import { PortalSuportePageShell } from './PortalSuportePageShell'

export function PrefeituraSuportePageContent() {
  const { getAccessToken } = usePrefeituraAuth()

  return (
    <PortalSuportePageShell
      variant="prefeitura"
      getAccessToken={getAccessToken}
      summaryTitle="Chamados da rede municipal"
      headerVariant="prefeitura"
      readOnlyForTicket={(ticket) => ticket.source !== 'prefeitura'}
    />
  )
}
