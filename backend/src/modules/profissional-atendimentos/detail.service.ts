import { ProfissionalAtendimentosError } from './errors.js'
import { mergePatientUploadsFromMensagens, mapHistoricoProntuario } from './formatters.js'
import { loadHistoricoProntuario } from './sessao.service.js'
import {
  loadOperacionalRowById,
  mapOperacionalRowsToRecords,
} from './clinical-data.service.js'
import { profissionalOwnsHistoricoConsulta } from './historico-query.service.js'
import { listProfissionalMensagensHistorico } from './mensagens-historico.service.js'
import type {
  ProfissionalAtendimentoDetailApi,
  ProfissionalAttendanceRecordApi,
} from './schemas.js'

export async function getProfissionalAtendimentoDetail(
  profissionalId: string,
  consultaId: string,
): Promise<ProfissionalAtendimentoDetailApi> {
  const row = await loadOperacionalRowById(consultaId)
  if (!row) {
    throw new ProfissionalAtendimentosError('Atendimento não encontrado.', 'NOT_FOUND', 404)
  }

  const owns = await profissionalOwnsHistoricoConsulta(profissionalId, consultaId)
  if (!owns) {
    throw new ProfissionalAtendimentosError('Atendimento não encontrado.', 'NOT_FOUND', 404)
  }

  if (!['concluida', 'interrompida'].includes(String(row.status))) {
    throw new ProfissionalAtendimentosError('Atendimento não finalizado.', 'NOT_FOUND', 404)
  }

  const [baseRecord] = await mapOperacionalRowsToRecords([row])
  const [mensagens, historicoRows] = await Promise.all([
    listProfissionalMensagensHistorico(profissionalId, consultaId),
    loadHistoricoProntuario(String(row.paciente_id), consultaId),
  ])

  const record: ProfissionalAttendanceRecordApi = {
    ...baseRecord,
    patientUploads: mergePatientUploadsFromMensagens(baseRecord.patientUploads, mensagens),
  }

  return {
    record,
    mensagens,
    historicoProntuario: mapHistoricoProntuario(historicoRows),
  }
}
