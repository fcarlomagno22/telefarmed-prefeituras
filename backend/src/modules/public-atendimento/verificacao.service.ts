import { supabaseAdmin } from '../../db/supabase.js'
import { buildDocumentoVerificacaoUrl } from '../../lib/codigoVerificacaoDocumento.js'
import { createAnexoSignedUrl } from '../profissional-atendimentos/clinical-data.service.js'
import { formatDoctorCrm, formatBrazilianDate, formatMessageTime } from '../profissional-atendimentos/formatters.js'
import { PublicAtendimentoError } from './errors.js'

export type DocumentoVerificacaoDto = {
  valido: boolean
  codigoVerificacao: string
  tipo: string
  titulo: string
  emitidoEm: string
  emitidoEmLabel: string
  patientName: string
  doctorName: string
  doctorCrm: string
  doctorRqe: string
  doctorSpecialty: string
  entidadeNome: string
  unitName: string
  verificationUrl: string
  downloadUrl: string | null
  hashSha256: string | null
}

export async function verificarDocumentoClinico(
  codigoVerificacao: string,
): Promise<DocumentoVerificacaoDto> {
  const codigo = codigoVerificacao.trim().toUpperCase()
  if (codigo.length < 10) {
    throw new PublicAtendimentoError('Código de verificação inválido.', 'INVALID_DATA', 400)
  }

  const { data: anexo, error } = await supabaseAdmin
    .from('consulta_anexos')
    .select(
      `
      id,
      consulta_id,
      tipo,
      titulo,
      arquivo_nome,
      storage_path,
      arquivo_url,
      codigo_verificacao,
      metadata,
      criado_em,
      consultas!inner (
        id,
        status,
        entidade_contratante_id,
        paciente_id,
        profissional_id
      )
    `,
    )
    .eq('codigo_verificacao', codigo)
    .maybeSingle()

  if (error) throw error
  if (!anexo) {
    throw new PublicAtendimentoError('Documento não encontrado ou código inválido.', 'NOT_FOUND', 404)
  }

  const consultasRaw = anexo.consultas as
    | {
        id: string
        status: string
        entidade_contratante_id: string
        paciente_id: string
        profissional_id: string | null
      }
    | Array<{
        id: string
        status: string
        entidade_contratante_id: string
        paciente_id: string
        profissional_id: string | null
      }>
  const consulta = Array.isArray(consultasRaw) ? consultasRaw[0] : consultasRaw

  if (!consulta) {
    throw new PublicAtendimentoError('Documento não encontrado ou código inválido.', 'NOT_FOUND', 404)
  }

  if (consulta.status === 'cancelada') {
    throw new PublicAtendimentoError('Este documento não está mais disponível.', 'UNAVAILABLE', 410)
  }

  const [{ data: operacional }, { data: entidade }, { data: profissional }] = await Promise.all([
    supabaseAdmin
      .from('vw_consultas_operacional')
      .select(
        'paciente_nome, profissional_nome, profissional_conselho_sigla, profissional_conselho_numero, profissional_conselho_uf, especialidade_nome, unidade_nome',
      )
      .eq('id', consulta.id)
      .maybeSingle(),
    supabaseAdmin
      .from('entidades_contratantes')
      .select('nome_exibicao')
      .eq('id', consulta.entidade_contratante_id)
      .maybeSingle(),
    consulta.profissional_id
      ? supabaseAdmin
          .from('usuarios_profissionais')
          .select('rqe')
          .eq('id', consulta.profissional_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  const storagePath = String(anexo.storage_path ?? '').trim()
  const downloadUrl = storagePath ? await createAnexoSignedUrl(storagePath) : String(anexo.arquivo_url ?? '') || null
  const metadata = (anexo.metadata ?? {}) as Record<string, unknown>

  return {
    valido: true,
    codigoVerificacao: codigo,
    tipo: String(anexo.tipo),
    titulo: String(anexo.titulo),
    emitidoEm: String(anexo.criado_em),
    emitidoEmLabel: formatBrazilianDate(String(anexo.criado_em)) + ' · ' + formatMessageTime(String(anexo.criado_em)),
    patientName: String(operacional?.paciente_nome ?? 'Paciente'),
    doctorName: String(operacional?.profissional_nome ?? 'Profissional'),
    doctorCrm: formatDoctorCrm({
      profissional_conselho_sigla: operacional?.profissional_conselho_sigla,
      profissional_conselho_numero: operacional?.profissional_conselho_numero,
      profissional_conselho_uf: operacional?.profissional_conselho_uf,
    }),
    doctorRqe: String(profissional?.rqe ?? '').trim(),
    doctorSpecialty: String(operacional?.especialidade_nome ?? 'Teleconsulta'),
    entidadeNome: String(entidade?.nome_exibicao ?? 'Telemedicina Municipal'),
    unitName: String(operacional?.unidade_nome ?? 'Teleatendimento'),
    verificationUrl: buildDocumentoVerificacaoUrl(codigo),
    downloadUrl,
    hashSha256: typeof metadata.hashSha256 === 'string' ? metadata.hashSha256 : null,
  }
}
