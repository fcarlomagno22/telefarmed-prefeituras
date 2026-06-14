import type { FastifyInstance } from 'fastify'
import {
  requirePrefeituraAuth,
  requirePrefeituraPagePermission,
} from '../prefeitura-auth/middleware.js'
import { mapPrefeituraRelatoriosError } from './errors.js'
import { getAgendaComparecimentoReport } from './agenda-comparecimento.service.js'
import { getAvaliacoesAtendimentosReport } from './avaliacoes-atendimentos.service.js'
import { getCapacidadeOcupacaoReport } from './capacidade-ocupacao.service.js'
import { getCadastrosIncompletosReport } from './cadastros-incompletos.service.js'
import { getDemandaEspecialidadeReport } from './demanda-especialidade.service.js'
import { getDuracaoMediaReport } from './duracao-media.service.js'
import { getEncaminhamentosEncaixesReport } from './encaminhamentos-encaixes.service.js'
import { getFilaEsperaAbandonoReport } from './fila-espera-abandono.service.js'
import { getHorariosPicoReport } from './horarios-pico.service.js'
import { getInterrupcoesReconexoesReport } from './interrupcoes-reconexoes.service.js'
import { getMedicosPlantaoReport } from './medicos-plantao.service.js'
import { getNovosCadastrosReport } from './novos-cadastros.service.js'
import { getPacientesInativosReport } from './pacientes-inativos.service.js'
import { getPerfilTerritorialReport } from './perfil-territorial.service.js'
import { getProducaoUnidadeReport } from './producao-unidade.service.js'
import { getRetornosPendentesReport } from './retornos-pendentes.service.js'
import { getFluxoTerminalReport } from './fluxo-terminal.service.js'
import { getRankingUbtsReport } from './ranking-ubts.service.js'
import { getSatisfacaoCidadaoReport } from './satisfacao-cidadao.service.js'
import { getUnidadesCriticasReport } from './unidades-criticas.service.js'
import { relatorioPeriodQuerySchema, reportIdParamSchema } from './schemas.js'

const canView = requirePrefeituraPagePermission('relatorios', 'visualizar')

function entidadeId(request: { prefeituraUser?: { entidadeContratanteId: string } }) {
  return request.prefeituraUser!.entidadeContratanteId
}

export async function registerPrefeituraRelatoriosRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requirePrefeituraAuth)

  app.get('/:reportId', { preHandler: canView }, async (request, reply) => {
    const params = reportIdParamSchema.safeParse(request.params)
    const query = relatorioPeriodQuerySchema.safeParse(request.query)
    if (!params.success || !query.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      if (params.data.reportId === 'producao-unidade') {
        const report = await getProducaoUnidadeReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      if (params.data.reportId === 'fila-espera-abandono') {
        const report = await getFilaEsperaAbandonoReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      if (params.data.reportId === 'agenda-comparecimento') {
        const report = await getAgendaComparecimentoReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      if (params.data.reportId === 'novos-cadastros') {
        const report = await getNovosCadastrosReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      if (params.data.reportId === 'cadastros-incompletos') {
        const report = await getCadastrosIncompletosReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      if (params.data.reportId === 'pacientes-inativos') {
        const report = await getPacientesInativosReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      if (params.data.reportId === 'perfil-territorial') {
        const report = await getPerfilTerritorialReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      if (params.data.reportId === 'retornos-pendentes') {
        const report = await getRetornosPendentesReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      if (params.data.reportId === 'ranking-ubts') {
        const report = await getRankingUbtsReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      if (params.data.reportId === 'fluxo-terminal') {
        const report = await getFluxoTerminalReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      if (params.data.reportId === 'demanda-especialidade') {
        const report = await getDemandaEspecialidadeReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      if (params.data.reportId === 'capacidade-ocupacao') {
        const report = await getCapacidadeOcupacaoReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      if (params.data.reportId === 'encaminhamentos-encaixes') {
        const report = await getEncaminhamentosEncaixesReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      if (params.data.reportId === 'horarios-pico') {
        const report = await getHorariosPicoReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      if (params.data.reportId === 'medicos-plantao') {
        const report = await getMedicosPlantaoReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      if (params.data.reportId === 'duracao-media') {
        const report = await getDuracaoMediaReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      if (params.data.reportId === 'interrupcoes-reconexoes') {
        const report = await getInterrupcoesReconexoesReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      if (params.data.reportId === 'avaliacoes-atendimentos') {
        const report = await getAvaliacoesAtendimentosReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      if (params.data.reportId === 'satisfacao-cidadao') {
        const report = await getSatisfacaoCidadaoReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      if (params.data.reportId === 'unidades-criticas') {
        const report = await getUnidadesCriticasReport(
          entidadeId(request),
          request.prefeituraUser!.nome,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(report)
      }

      return reply.status(404).send({ error: 'Relatório não encontrado.' })
    } catch (error) {
      const mapped = mapPrefeituraRelatoriosError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
