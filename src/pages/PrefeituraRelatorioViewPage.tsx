import { Navigate, useParams } from 'react-router-dom'
import { prefeituraRoutes } from '../config/prefeituraRoutes'
import { PrefeituraProducaoUnidadeReportView } from '../components/prefeitura/relatorios/PrefeituraProducaoUnidadeReportView'
import { PrefeituraFilaEsperaAbandonoReportView } from '../components/prefeitura/relatorios/PrefeituraFilaEsperaAbandonoReportView'
import { PrefeituraAgendaComparecimentoReportView } from '../components/prefeitura/relatorios/PrefeituraAgendaComparecimentoReportView'
import { PrefeituraRankingUbtsReportView } from '../components/prefeitura/relatorios/PrefeituraRankingUbtsReportView'
import { PrefeituraFluxoTerminalReportView } from '../components/prefeitura/relatorios/PrefeituraFluxoTerminalReportView'
import { PrefeituraDemandaEspecialidadeReportView } from '../components/prefeitura/relatorios/PrefeituraDemandaEspecialidadeReportView'
import { PrefeituraCapacidadeOcupacaoReportView } from '../components/prefeitura/relatorios/PrefeituraCapacidadeOcupacaoReportView'
import { PrefeituraEncaminhamentosEncaixesReportView } from '../components/prefeitura/relatorios/PrefeituraEncaminhamentosEncaixesReportView'
import { PrefeituraHorariosPicoReportView } from '../components/prefeitura/relatorios/PrefeituraHorariosPicoReportView'
import { PrefeituraMedicosPlantaoReportView } from '../components/prefeitura/relatorios/PrefeituraMedicosPlantaoReportView'
import { PrefeituraDuracaoMediaReportView } from '../components/prefeitura/relatorios/PrefeituraDuracaoMediaReportView'
import { PrefeituraInterrupcoesReconexoesReportView } from '../components/prefeitura/relatorios/PrefeituraInterrupcoesReconexoesReportView'
import { PrefeituraAvaliacoesAtendimentosReportView } from '../components/prefeitura/relatorios/PrefeituraAvaliacoesAtendimentosReportView'
import { PrefeituraSatisfacaoCidadaoReportView } from '../components/prefeitura/relatorios/PrefeituraSatisfacaoCidadaoReportView'
import { PrefeituraUnidadesCriticasReportView } from '../components/prefeitura/relatorios/PrefeituraUnidadesCriticasReportView'
import { PrefeituraNovosCadastrosReportView } from '../components/prefeitura/relatorios/PrefeituraNovosCadastrosReportView'
import { PrefeituraCadastrosIncompletosReportView } from '../components/prefeitura/relatorios/PrefeituraCadastrosIncompletosReportView'
import { PrefeituraPacientesInativosReportView } from '../components/prefeitura/relatorios/PrefeituraPacientesInativosReportView'
import { PrefeituraPerfilTerritorialReportView } from '../components/prefeitura/relatorios/PrefeituraPerfilTerritorialReportView'
import { PrefeituraRetornosPendentesReportView } from '../components/prefeitura/relatorios/PrefeituraRetornosPendentesReportView'
import type { PrefeituraRelatorioId } from '../types/prefeituraRelatorios'

const REPORT_VIEWS: Record<PrefeituraRelatorioId, () => JSX.Element> = {
  'producao-unidade': PrefeituraProducaoUnidadeReportView,
  'fila-espera-abandono': PrefeituraFilaEsperaAbandonoReportView,
  'agenda-comparecimento': PrefeituraAgendaComparecimentoReportView,
  'ranking-ubts': PrefeituraRankingUbtsReportView,
  'fluxo-terminal': PrefeituraFluxoTerminalReportView,
  'demanda-especialidade': PrefeituraDemandaEspecialidadeReportView,
  'capacidade-ocupacao': PrefeituraCapacidadeOcupacaoReportView,
  'encaminhamentos-encaixes': PrefeituraEncaminhamentosEncaixesReportView,
  'horarios-pico': PrefeituraHorariosPicoReportView,
  'medicos-plantao': PrefeituraMedicosPlantaoReportView,
  'duracao-media': PrefeituraDuracaoMediaReportView,
  'interrupcoes-reconexoes': PrefeituraInterrupcoesReconexoesReportView,
  'avaliacoes-atendimentos': PrefeituraAvaliacoesAtendimentosReportView,
  'satisfacao-cidadao': PrefeituraSatisfacaoCidadaoReportView,
  'unidades-criticas': PrefeituraUnidadesCriticasReportView,
  'novos-cadastros': PrefeituraNovosCadastrosReportView,
  'cadastros-incompletos': PrefeituraCadastrosIncompletosReportView,
  'pacientes-inativos': PrefeituraPacientesInativosReportView,
  'perfil-territorial': PrefeituraPerfilTerritorialReportView,
  'retornos-pendentes': PrefeituraRetornosPendentesReportView,
}

export function PrefeituraRelatorioViewPage() {
  const { reportId } = useParams<{ reportId: string }>()
  const View = reportId ? REPORT_VIEWS[reportId as PrefeituraRelatorioId] : undefined

  if (!View) {
    return <Navigate to={prefeituraRoutes.relatorios} replace />
  }

  return <View />
}
