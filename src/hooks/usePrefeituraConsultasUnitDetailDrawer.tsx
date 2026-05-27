import { useCallback, useState } from 'react'
import { PrefeituraConsultasUnitDetailDrawer } from '../components/prefeitura/consultas/PrefeituraConsultasUnitDetailDrawer'
import {
  buildPrefeituraConsultasUnitDetail,
  type PrefeituraConsultasUnitDetail,
} from '../data/prefeituraConsultasUnitDetail'
import type { PrefeituraConsultasUnitRow } from '../data/prefeituraConsultasMock'

export type PrefeituraConsultasUnitDetailDrawerPayload = {
  unit: PrefeituraConsultasUnitRow
  periodStart: string
  periodEnd: string
  allUnits: PrefeituraConsultasUnitRow[]
}

export function usePrefeituraConsultasUnitDetailDrawer() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [detail, setDetail] = useState<PrefeituraConsultasUnitDetail | null>(null)

  const openDrawer = useCallback((payload: PrefeituraConsultasUnitDetailDrawerPayload) => {
    setDetail(
      buildPrefeituraConsultasUnitDetail(
        payload.unit,
        payload.periodStart,
        payload.periodEnd,
        payload.allUnits,
      ),
    )
    setClosing(false)
    setOpen(true)
  }, [])

  const requestClose = useCallback(() => {
    setClosing(true)
  }, [])

  const handleTransitionEnd = useCallback(() => {
    if (closing) {
      setOpen(false)
      setClosing(false)
      setDetail(null)
    }
  }, [closing])

  const drawerElement = detail ? (
    <PrefeituraConsultasUnitDetailDrawer
      open={open}
      closing={closing}
      detail={detail}
      onClose={requestClose}
      onTransitionEnd={handleTransitionEnd}
    />
  ) : null

  return {
    openDrawer,
    drawerElement,
  }
}
