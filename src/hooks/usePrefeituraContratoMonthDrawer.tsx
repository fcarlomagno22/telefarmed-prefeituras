import { useCallback, useState } from 'react'
import { PrefeituraContratoMonthDrawer } from '../components/prefeitura/contrato/PrefeituraContratoMonthDrawer'
import {
  buildPrefeituraContratoMonthDetail,
  type PrefeituraContratoMonthDetail,
} from '../data/prefeituraContratoMonthConsultations'
import type {
  PrefeituraContratoMonthlyRow,
  PrefeituraContratoRecord,
} from '../data/prefeituraContratoMock'

export function usePrefeituraContratoMonthDrawer() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [detail, setDetail] = useState<PrefeituraContratoMonthDetail | null>(null)

  const openDrawer = useCallback(
    (month: PrefeituraContratoMonthlyRow, contract: PrefeituraContratoRecord) => {
      setDetail(
        buildPrefeituraContratoMonthDetail(month, {
          contractNumber: contract.info.contractNumber,
          periodLabel: contract.selectorSubtitle,
          municipalityName: contract.info.municipalityName,
          startsAt: contract.info.startsAt,
          endsAt: contract.info.endsAt,
        }),
      )
      setClosing(false)
      setOpen(true)
    },
    [],
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

  const drawerElement = detail ? (
    <PrefeituraContratoMonthDrawer
      open={open}
      closing={closing}
      detail={detail}
      onClose={requestClose}
      onTransitionEnd={handleTransitionEnd}
    />
  ) : null

  return {
    openDrawer,
    requestClose,
    drawerElement,
  }
}
