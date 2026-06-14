import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/profissional/financeiro'
import * as mock from '../../mockServices/profissional/financeiro'

const useApi = isBackendApiEnabled()

export const ProfissionalFinanceiroApiError = useApi
  ? api.ProfissionalFinanceiroApiError
  : mock.ProfissionalFinanceiroApiError

export const fetchProfissionalFinanceiroSummary = useApi
  ? api.fetchProfissionalFinanceiroSummary
  : mock.fetchProfissionalFinanceiroSummary

export const fetchProfissionalFinanceiroDadosPagamento = useApi
  ? api.fetchProfissionalFinanceiroDadosPagamento
  : mock.fetchProfissionalFinanceiroDadosPagamento

export const updateProfissionalFinanceiroDadosPagamento = useApi
  ? api.updateProfissionalFinanceiroDadosPagamento
  : mock.updateProfissionalFinanceiroDadosPagamento

export const fetchProfissionalFinanceiroRepasses = useApi
  ? api.fetchProfissionalFinanceiroRepasses
  : mock.fetchProfissionalFinanceiroRepasses

export const fetchProfissionalFinanceiroRepasseDetail = useApi
  ? api.fetchProfissionalFinanceiroRepasseDetail
  : mock.fetchProfissionalFinanceiroRepasseDetail

export const submitProfissionalFinanceiroFechamento = useApi
  ? api.submitProfissionalFinanceiroFechamento
  : async () => {
      throw new mock.ProfissionalFinanceiroApiError(
        'Fechamento via API indisponível no modo mock.',
        503,
      )
    }

export const isProfissionalFinanceiroApiError = useApi
  ? api.isProfissionalFinanceiroApiError
  : mock.isProfissionalFinanceiroApiError

export const syncProfissionalFinanceiroRepasse = mock.syncProfissionalFinanceiroRepasse
