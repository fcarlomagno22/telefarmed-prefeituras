import { useCallback, useState } from 'react'
import { PrefeituraUbsDetailDrawer } from '../components/prefeitura/PrefeituraUbsDetailDrawer'
import type { PrefeituraUbsRow } from '../types/prefeituraDashboard'
import type { PrefeituraRedeUnit } from '../data/prefeituraRedeMock'
import type { PrefeituraRedeUnitCadastral } from '../data/prefeituraRedeUnitDetail'
import { buildPrefeituraUbsDetail } from '../data/prefeituraUbsDetails'
import {
  mapRedeDetailToCadastral,
  mapRedeDetailToUbsDetail,
  type PrefeituraRedeUnitDetailApi,
} from '../lib/services/prefeitura/rede'

type UsePrefeituraUbsDetailDrawerOptions = {
  filterSummaryLines?: string[]
  loadUnitDetail?: (unitId: string) => Promise<PrefeituraRedeUnitDetailApi | null>
}

export function usePrefeituraUbsDetailDrawer(options: UsePrefeituraUbsDetailDrawerOptions = {}) {
  const { filterSummaryLines, loadUnitDetail } = options
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [detail, setDetail] = useState<ReturnType<typeof buildPrefeituraUbsDetail> | null>(null)
  const [cadastral, setCadastral] = useState<PrefeituraRedeUnitCadastral | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const openDrawer = useCallback(
    async (row: PrefeituraUbsRow) => {
      setClosing(false)
      setOpen(true)

      if (loadUnitDetail) {
        setLoadingDetail(true)
        setCadastral(null)
        setDetail(null)

        const apiDetail = await loadUnitDetail(row.id)
        if (apiDetail) {
          setDetail(mapRedeDetailToUbsDetail(apiDetail))
          setCadastral(mapRedeDetailToCadastral(apiDetail))
          setLoadingDetail(false)
          return
        }
      }

      setDetail(buildPrefeituraUbsDetail(row))
      setCadastral(null)
      setLoadingDetail(false)
    },
    [loadUnitDetail],
  )

  const openDrawerFromRedeUnit = useCallback(
    async (unit: PrefeituraRedeUnit) => {
      setClosing(false)
      setOpen(true)
      setLoadingDetail(true)
      setCadastral(null)
      setDetail(null)

      if (loadUnitDetail) {
        const apiDetail = await loadUnitDetail(unit.id)
        if (apiDetail) {
          setDetail(mapRedeDetailToUbsDetail(apiDetail))
          setCadastral(mapRedeDetailToCadastral(apiDetail))
          setLoadingDetail(false)
          return
        }
      }

      setDetail(buildPrefeituraUbsDetail({
        id: unit.id,
        name: unit.name,
        region: unit.region,
        regionKey: unit.regionKey === 'centro' ? 'central' : (unit.regionKey as PrefeituraUbsRow['regionKey']),
        type: 'Tipo I',
        typeKey: 'tipo1',
        consultationsToday: 0,
        queueNow: 0,
        avgWait: '—',
        absencesToday: 0,
        sla: unit.status === 'ativa' ? 'normal' : unit.status === 'manutencao' ? 'atencao' : 'critico',
        statusDot: unit.status === 'ativa' ? 'normal' : unit.status === 'manutencao' ? 'atencao' : 'critico',
      }))
      setLoadingDetail(false)
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
      setCadastral(null)
      setLoadingDetail(false)
    }
  }, [closing])

  const drawerElement = open ? (
    <PrefeituraUbsDetailDrawer
      open={open}
      closing={closing}
      detail={
        detail ??
        buildPrefeituraUbsDetail({
          id: 'loading',
          name: loadingDetail ? 'Carregando…' : '—',
          region: '—',
          regionKey: 'central',
          type: '—',
          typeKey: 'tipo1',
          consultationsToday: 0,
          queueNow: 0,
          avgWait: '—',
          absencesToday: 0,
          sla: 'normal',
          statusDot: 'normal',
        })
      }
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
