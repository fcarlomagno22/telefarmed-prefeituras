import { useCallback, useMemo, useState } from 'react'
import {
  anexarCrmPartnersNotaFiscal,
  buildCrmPartnersIndicadoresData,
  getCrmPartnersIndicadorDetail,
  listCrmPartnersIndicadoresRows,
  marcarCrmPartnersNfEmitida,
} from '../data/crmPartnersIndicadoresMock'

export function useCrmPartnersIndicadoresPage() {
  const [version, setVersion] = useState(0)

  const data = useMemo(() => buildCrmPartnersIndicadoresData(), [version])

  const getDetail = useCallback((id: string) => getCrmPartnersIndicadorDetail(id), [version])

  const marcarNfEmitida = useCallback((id: string) => {
    const updated = marcarCrmPartnersNfEmitida(id)
    if (updated) setVersion((current) => current + 1)
    return updated
  }, [])

  const anexarNotaFiscal = useCallback((id: string, file: File) => {
    const updated = anexarCrmPartnersNotaFiscal(id, file.name)
    if (updated) setVersion((current) => current + 1)
    return updated
  }, [])

  const refreshRows = useCallback(() => listCrmPartnersIndicadoresRows(), [version])

  return {
    rows: data.rows,
    summary: data.summary,
    kpiCards: data.kpiCards,
    getDetail,
    marcarNfEmitida,
    anexarNotaFiscal,
    refreshRows,
  }
}
