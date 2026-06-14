import { supabaseAdmin } from '../../db/supabase.js'
import { upsertConsultaAvaliacao } from '../../lib/consultaAvaliacao.js'
import { logAtendimentoConsultaEventoSafe } from '../../lib/auditoria/atendimento-events.js'
import { createProfissionalFotoSignedUrl } from '../admin-profissionais/documentos.service.js'
import { PublicAtendimentoError } from './errors.js'
import type { RegistrarAvaliacaoPublicaBody } from './schemas.js'
import type { PublicAvaliacaoSessaoDto } from './types.js'

export type { PublicAvaliacaoSessaoDto } from './types.js'

const STATUS_BLOQUEADOS = new Set(['cancelada'])

async function loadConsultaByCodigo(codigoAtendimento: string) {
  const { data, error } = await supabaseAdmin
    .from('vw_consultas_operacional')
    .select(
      `
      id,
      codigo_atendimento,
      status,
      profissional_id,
      profissional_nome,
      profissional_especialidade_texto,
      especialidade_nome
    `,
    )
    .eq('codigo_atendimento', codigoAtendimento)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new PublicAtendimentoError('Sessão de atendimento não encontrada.', 'NOT_FOUND', 404)
  }

  return data
}

async function loadAvaliacaoEnviada(consultaId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('consulta_avaliacoes')
    .select('id')
    .eq('consulta_id', consultaId)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

async function loadProfissionalFoto(profissionalId: string | null): Promise<string | null> {
  if (!profissionalId) return null

  const { data, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('foto_storage_path')
    .eq('id', profissionalId)
    .maybeSingle()

  if (error) throw error
  const signedUrl = await createProfissionalFotoSignedUrl(data?.foto_storage_path)
  return signedUrl ?? null
}

function resolveDoctorName(row: Record<string, unknown>): string {
  const nome = String(row.profissional_nome ?? '').trim()
  return nome || 'Profissional de plantão'
}

function resolveDoctorSpecialty(row: Record<string, unknown>): string {
  const especialidade = String(row.especialidade_nome ?? '').trim()
  const textoProf = String(row.profissional_especialidade_texto ?? '').trim()
  return especialidade || textoProf || 'Teleconsulta'
}

export async function getPublicAvaliacaoSessao(
  codigoAtendimento: string,
): Promise<PublicAvaliacaoSessaoDto> {
  const consulta = await loadConsultaByCodigo(codigoAtendimento)

  if (STATUS_BLOQUEADOS.has(String(consulta.status))) {
    throw new PublicAtendimentoError('Este atendimento não está disponível.', 'UNAVAILABLE', 410)
  }

  const consultaId = String(consulta.id)
  const [avaliacaoEnviada, doctorPhotoUrl] = await Promise.all([
    loadAvaliacaoEnviada(consultaId),
    loadProfissionalFoto(consulta.profissional_id ? String(consulta.profissional_id) : null),
  ])

  return {
    token: codigoAtendimento,
    consultaId,
    consultaStatus: String(consulta.status),
    doctorName: resolveDoctorName(consulta),
    doctorSpecialty: resolveDoctorSpecialty(consulta),
    doctorPhotoUrl,
    avaliacaoEnviada,
  }
}

export async function registrarPublicAvaliacao(
  codigoAtendimento: string,
  body: RegistrarAvaliacaoPublicaBody,
): Promise<void> {
  const consulta = await loadConsultaByCodigo(codigoAtendimento)

  if (STATUS_BLOQUEADOS.has(String(consulta.status))) {
    throw new PublicAtendimentoError('Este atendimento não está disponível.', 'UNAVAILABLE', 410)
  }

  const consultaId = String(consulta.id)
  const result = await upsertConsultaAvaliacao(
    consultaId,
    {
      notaProfissional: body.notaProfissional,
      comentarioProfissional: body.comentarioProfissional,
      notaTeleconsulta: body.notaTeleconsulta,
      comentarioTeleconsulta: body.comentarioTeleconsulta,
    },
    {
      allowUpdate: false,
      profissionalId: consulta.profissional_id ? String(consulta.profissional_id) : null,
      consultaStatus: String(consulta.status),
    },
  )

  if (!result.created) {
    throw new PublicAtendimentoError('Avaliação já registrada para este atendimento.', 'ALREADY_RATED', 409)
  }

  logAtendimentoConsultaEventoSafe({
    acao: 'inserir',
    descricao: 'Avaliação pós-consulta registrada pelo paciente',
    consultaId,
    codigoAtendimento,
    payload: {
      notaProfissional: body.notaProfissional,
      notaTeleconsulta: body.notaTeleconsulta,
    },
  })
}
