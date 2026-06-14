import { useCallback, useState } from 'react'
import { PrefeituraConsultasUnitDetailDrawer } from '../components/prefeitura/consultas/PrefeituraConsultasUnitDetailDrawer'
import type { PrefeituraConsultasUnitDetail } from '../data/prefeituraConsultasUnitDetail'
import {
  buildPrefeituraConsultasUnitDetail,
} from '../data/prefeituraConsultasUnitDetail'
import type { PrefeituraConsultasUnitRow } from '../data/prefeituraConsultasMock'
import { isBackendApiEnabled } from '../lib/api/config'

export type PrefeituraConsultasUnitDetailDrawerPayload = {
  unit: PrefeituraConsultasUnitRow
  periodStart: string
  periodEnd: string
  allUnits: PrefeituraConsultasUnitRow[]
}

type UsePrefeituraConsultasUnitDetailDrawerOptions = {
  loadUnitDetail?: (
    unitId: string,
    periodStart: string,
    periodEnd: string,
  ) => Promise<PrefeituraConsultasUnitDetail | null>
}

export function usePrefeituraConsultasUnitDetailDrawer(
  options?: UsePrefeituraConsultasUnitDetailDrawerOptions,
) {
  const { loadUnitDetail } = options ?? {}
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [detail, setDetail] = useState<PrefeituraConsultasUnitDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const openDrawer = useCallback(
    async (payload: PrefeituraConsultasUnitDetailDrawerPayload) => {
      setClosing(false)
      setOpen(true)
      setIsLoading(Boolean(loadUnitDetail && isBackendApiEnabled()))

      if (loadUnitDetail && isBackendApiEnabled()) {
        const apiDetail = await loadUnitDetail(
          payload.unit.id,
          payload.periodStart,
          payload.periodEnd,
        )
        if (apiDetail) {
          setDetail(apiDetail)
          setIsLoading(false)
          return
        }
      }

      setDetail(
        buildPrefeituraConsultasUnitDetail(
          payload.unit,
          payload.periodStart,
          payload.periodEnd,
          payload.allUnits,
        ),
      )
      setIsLoading(false)
    },
    [loadUnitDetail],
  )

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

  const drawerElement =
    detail && !isLoading ? (
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
