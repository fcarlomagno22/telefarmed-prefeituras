import { useCallback, useState } from 'react'
import { PrefeituraUbsDetailDrawer } from '../components/prefeitura/PrefeituraUbsDetailDrawer'
import type { PrefeituraUbsRow } from '../data/prefeituraDashboardMock'
import type { PrefeituraRedeUnit } from '../data/prefeituraRedeMock'
import {
  buildPrefeituraRedeUnitFullDetail,
  type PrefeituraRedeUnitCadastral,
  type PrefeituraRedeUnitCadastralProfile,
} from '../data/prefeituraRedeUnitDetail'
import { buildPrefeituraUbsDetail } from '../data/prefeituraUbsDetails'

type UsePrefeituraUbsDetailDrawerOptions = {
  cadastralProfilesByUnitId?: Record<string, PrefeituraRedeUnitCadastralProfile>
  filterSummaryLines?: string[]
}

export function usePrefeituraUbsDetailDrawer(options: UsePrefeituraUbsDetailDrawerOptions = {}) {
  const { cadastralProfilesByUnitId, filterSummaryLines } = options
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [detail, setDetail] = useState<ReturnType<typeof buildPrefeituraUbsDetail> | null>(null)
  const [cadastral, setCadastral] = useState<PrefeituraRedeUnitCadastral | null>(null)

  const openDrawer = useCallback((row: PrefeituraUbsRow) => {
    setDetail(buildPrefeituraUbsDetail(row))
    setCadastral(null)
    setClosing(false)
    setOpen(true)
  }, [])

  const openDrawerFromRedeUnit = useCallback(
    (unit: PrefeituraRedeUnit) => {
      const profile = cadastralProfilesByUnitId?.[unit.id]
      const full = buildPrefeituraRedeUnitFullDetail(unit, profile)
      setDetail(full.metrics)
      setCadastral(full.cadastral)
      setClosing(false)
      setOpen(true)
    },
    [cadastralProfilesByUnitId],
  )

  const requestClose = useCallback(() => {
    setClosing(true)
  }, [])

  const handleTransitionEnd = useCallback(() => {
    if (closing) {
      setOpen(false)
      setClosing(false)
      setDetail(null)
      setCadastral(null)
    }
  }, [closing])

  const drawerElement = detail ? (
    <PrefeituraUbsDetailDrawer
      open={open}
      closing={closing}
      detail={detail}
      cadastral={cadastral}
      filterSummaryLines={filterSummaryLines}
      onClose={requestClose}
      onTransitionEnd={handleTransitionEnd}
    />
  ) : null

  return {
    openDrawer,
    openDrawerFromRedeUnit,
    drawerElement,
  }
}
