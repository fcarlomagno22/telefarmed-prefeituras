import { useCallback, useState } from 'react'
import { PrefeituraContratoMonthDrawer } from '../components/prefeitura/contrato/PrefeituraContratoMonthDrawer'
import type { PrefeituraContratoMonthDetail } from '../data/prefeituraContratoMonthConsultations'
import {
  fetchPrefeituraContratoMonthDetail,
  isPrefeituraContratoApiError,
} from '../lib/services/prefeitura/contrato'
import type {
  PrefeituraContratoMonthlyRow,
  PrefeituraContratoRecord,
} from '../types/prefeituraContrato'

type UsePrefeituraContratoMonthDrawerOptions = {
  getAccessToken: () => string | null
}

export function usePrefeituraContratoMonthDrawer({
  getAccessToken,
}: UsePrefeituraContratoMonthDrawerOptions) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [detail, setDetail] = useState<PrefeituraContratoMonthDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const openDrawer = useCallback(
    (month: PrefeituraContratoMonthlyRow, contract: PrefeituraContratoRecord) => {
      const token = getAccessToken()
      if (!token) return

      setClosing(false)
      setOpen(true)
      setDetail(null)
      setLoadError(null)
      setIsLoading(true)

      void fetchPrefeituraContratoMonthDetail(token, contract.id, month.year, month.month, {
        contractNumber: contract.info.contractNumber,
        periodLabel: contract.selectorSubtitle,
        municipalityName: contract.info.municipalityName,
        startsAt: contract.info.startsAt,
        endsAt: contract.info.endsAt,
      })
        .then((loaded) => {
          setDetail(loaded)
        })
        .catch((error) => {
          const message = isPrefeituraContratoApiError(error)
            ? error.message
            : 'Não foi possível carregar as consultas do mês.'
          setLoadError(message)
        })
        .finally(() => {
          setIsLoading(false)
        })
    },
    [getAccessToken],
  )

  const requestClose = useCallback(() => {
    setClosing(true)
  }, [])

  const handleTransitionEnd = useCallback(() => {
    if (closing) {
      setOpen(false)
      setClosing(false)
      setDetail(null)
      setLoadError(null)
      setIsLoading(false)
    }
  }, [closing])

  const drawerElement =
    open || closing ? (
      <PrefeituraContratoMonthDrawer
        open={open}
        closing={closing}
        detail={detail}
        isLoading={isLoading}
        loadError={loadError}
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
