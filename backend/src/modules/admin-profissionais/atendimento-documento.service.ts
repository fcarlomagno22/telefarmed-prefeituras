import { logAtendimentoConsultaEventoSafe } from '../../lib/auditoria/atendimento-events.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { resolveDocumentoDownloadUrl } from '../profissional-atendimentos/documentos-clinicos.service.js'
import { ProfissionalAtendimentosError } from '../profissional-atendimentos/errors.js'
import { ProfissionaisError } from './errors.js'

export async function resolveAdminProfissionalAtendimentoDocumentDownloadUrl(
  profissionalId: string,
  consultaId: string,
  documentId: string,
): Promise<string> {
  if (!documentId.startsWith('anexo-')) {
    throw new ProfissionaisError('Documento não encontrado.', 'NOT_FOUND', 404)
  }

  const anexoId = documentId.slice('anexo-'.length)

  const { data: consulta, error: consultaError } = await supabaseAdmin
    .from('consultas')
    .select('id, profissional_id, codigo_atendimento')
    .eq('id', consultaId)
    .maybeSingle()

  if (consultaError) throw consultaError
  if (!consulta || String(consulta.profissional_id) !== profissionalId) {
    throw new ProfissionaisError('Atendimento não encontrado.', 'NOT_FOUND', 404)
  }

  const { data: anexo, error: anexoError } = await supabaseAdmin
    .from('consulta_anexos')
    .select('id, origem')
    .eq('id', anexoId)
    .eq('consulta_id', consultaId)
    .maybeSingle()

  if (anexoError) throw anexoError
  if (!anexo || anexo.origem !== 'profissional') {
    throw new ProfissionaisError('Documento não encontrado.', 'NOT_FOUND', 404)
  }

  const url = await resolveDocumentoDownloadUrl(anexoId).catch((error: unknown) => {
    if (error instanceof ProfissionalAtendimentosError) {
      throw new ProfissionaisError(
        error.message,
        error.code === 'NOT_FOUND' ? 'NOT_FOUND' : 'INVALID_STATE',
        error.statusCode,
      )
    }
    throw error
  })

  logAtendimentoConsultaEventoSafe({
    acao: 'acao_sensivel',
    descricao: 'Download de documento clínico (admin)',
    consultaId,
    profissionalId,
    codigoAtendimento: consulta.codigo_atendimento,
    payload: { documentId, anexoId },
  })

  return url
}
