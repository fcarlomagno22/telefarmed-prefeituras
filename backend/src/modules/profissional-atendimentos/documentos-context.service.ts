import { supabaseAdmin } from '../../db/supabase.js'
import { calcAgeFromBirthDate } from '../../lib/patientAge.js'
import { resolveLogoUrlsByEntityId } from '../admin-clientes/logo.service.js'
import {
  formatDoctorCrm,
  formatPatientCity,
  maskCpfPartial,
} from './formatters.js'
import type { ConsultaOperacionalFullRow } from './types.js'
import type { ClinicalDocumentContext } from '../../lib/documentos-clinicos/types.js'

export type DocumentContextRow = ConsultaOperacionalFullRow & {
  entidade_contratante_id?: string
  entidade_nome?: string | null
}

const OPERACIONAL_DOCUMENTO_SELECT = `
  id,
  codigo_atendimento,
  entidade_contratante_id,
  paciente_id,
  profissional_id,
  especialidade_id,
  status,
  triagem_resumo,
  notas_clinicas,
  iniciada_em,
  finalizada_em,
  duracao_minutos,
  criado_em,
  paciente_nome,
  paciente_cpf,
  paciente_sexo,
  paciente_data_nascimento,
  paciente_endereco,
  paciente_foto_url,
  profissional_nome,
  profissional_conselho_sigla,
  profissional_conselho_numero,
  profissional_conselho_uf,
  especialidade_nome,
  unidade_nome
`

export async function loadDocumentContextRow(consultaId: string): Promise<DocumentContextRow | null> {
  const { data: consulta, error } = await supabaseAdmin
    .from('vw_consultas_operacional')
    .select(OPERACIONAL_DOCUMENTO_SELECT)
    .eq('id', consultaId)
    .maybeSingle()

  if (error) throw error
  if (!consulta) return null

  const entidadeId = String((consulta as { entidade_contratante_id?: string }).entidade_contratante_id ?? '')
  let entidadeNome = 'Telemedicina Municipal'

  if (entidadeId) {
    const { data: entidade, error: entidadeError } = await supabaseAdmin
      .from('entidades_contratantes')
      .select('id, nome_exibicao, logo_storage_path')
      .eq('id', entidadeId)
      .maybeSingle()

    if (entidadeError) throw entidadeError
    if (entidade?.nome_exibicao?.trim()) {
      entidadeNome = String(entidade.nome_exibicao).trim()
    }
  }

  const profissionalId = consulta.profissional_id ? String(consulta.profissional_id) : null
  let doctorRqe = ''

  if (profissionalId) {
    const { data: prof, error: profError } = await supabaseAdmin
      .from('usuarios_profissionais')
      .select('rqe')
      .eq('id', profissionalId)
      .maybeSingle()

    if (profError) throw profError
    doctorRqe = String(prof?.rqe ?? '').trim()
  }

  return {
    ...(consulta as ConsultaOperacionalFullRow),
    entidade_contratante_id: entidadeId,
    entidade_nome: entidadeNome,
    profissional_rqe: doctorRqe,
  } as DocumentContextRow & { profissional_rqe?: string }
}

export async function buildClinicalDocumentContext(
  row: DocumentContextRow & { profissional_rqe?: string },
  emitidoEm = new Date(),
): Promise<ClinicalDocumentContext> {
  const age = calcAgeFromBirthDate(row.paciente_data_nascimento)
  const gender = String(row.paciente_sexo ?? '') === 'feminino' ? 'Feminino' : 'Masculino'
  const entidadeId = row.entidade_contratante_id?.trim() || undefined
  const entidadeLogoBuffer = entidadeId ? await loadEntidadeLogoBuffer(entidadeId) : null

  return {
    entidadeNome: String(row.entidade_nome ?? 'Telemedicina Municipal'),
    unitName: String(row.unidade_nome || 'Teleatendimento'),
    specialty: String(row.especialidade_nome ?? '—'),
    patientName: String(row.paciente_nome ?? '—'),
    patientCpfMasked: maskCpfPartial(String(row.paciente_cpf ?? '')),
    patientAgeLabel: age > 0 ? `${age} anos · ${gender}` : gender,
    patientCity: formatPatientCity(row.paciente_endereco),
    doctorName: row.profissional_nome?.trim() || 'Profissional',
    doctorSpecialty: String(row.especialidade_nome ?? '—'),
    doctorCrm: formatDoctorCrm(row),
    doctorRqe: String(row.profissional_rqe ?? '').trim(),
    emitidoEmIso: emitidoEm.toISOString(),
    emitidoEmLabel: new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(emitidoEm),
    entidadeLogoBuffer,
  }
}

async function loadEntidadeLogoBuffer(entidadeId: string): Promise<Buffer | null> {
  const url = await resolveEntidadeLogoUrl(entidadeId)
  if (!url) return null

  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const buffer = Buffer.from(await response.arrayBuffer())
    return buffer.length > 0 ? buffer : null
  } catch {
    return null
  }
}

export async function resolveEntidadeLogoUrl(entidadeId: string | undefined): Promise<string | null> {
  if (!entidadeId?.trim()) return null

  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('id, logo_storage_path')
    .eq('id', entidadeId)
    .maybeSingle()

  if (error) throw error
  if (!data?.logo_storage_path) return null

  const map = await resolveLogoUrlsByEntityId([
    { id: String(data.id), logo_storage_path: String(data.logo_storage_path) },
  ])
  return map.get(String(data.id)) ?? null
}
