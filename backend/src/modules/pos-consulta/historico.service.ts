import { supabaseAdmin } from '../../db/supabase.js'
import { loadProfissionalEscalaContext } from '../profissional-escala/context.service.js'
import { PosConsultaError } from './errors.js'
import {
  buildCheckinSummary,
  formatPosConsultaDateTimeLabel,
  mapConsultaStatusToHistorico,
  posConsultaCheckinDayNumber,
} from './formatters.js'
import type { PosConsultaCheckinRespostasInput } from './schemas.js'

type HistoricoConsultaRow = {
  id: string
  codigo_atendimento: string
  status: string
  triagem_resumo: string | null
  finalizada_em: string | null
  iniciada_em: string | null
  criado_em: string
  especialidade_id: string
  config_especialidades: { nome: string } | Array<{ nome: string }>
  usuarios_profissionais: { nome: string } | Array<{ nome: string }> | null
}

type HistoricoCheckinRow = {
  id: string
  numero_checkin: number
  respondido_em: string | null
  pos_consulta_planos: { consulta_id: string }
  pos_consulta_respostas:
    | { payload: PosConsultaCheckinRespostasInput; evolucao: string | null }
    | Array<{ payload: PosConsultaCheckinRespostasInput; evolucao: string | null }>
    | null
}

type HistoricoAnexoRow = {
  id: string
  consulta_id: string
  tipo: string
  titulo: string
  criado_em: string
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function mapAnexoKind(tipo: string): string {
  const allowed = [
    'receita',
    'pedido_exame',
    'cardapio',
    'plano_alimentar',
    'orientacao',
    'atestado',
    'encaminhamento',
    'relatorio',
    'laudo',
    'avaliacao_presencial',
    'internacao',
  ]
  return allowed.includes(tipo) ? tipo : 'orientacao'
}

export async function getProfissionalPacientePosConsultaHistorico(
  profissionalId: string,
  pacienteId: string,
  specialtyLabel: string,
): Promise<{
  pacienteId: string
  patientName: string
  specialty: string
  consultas: Array<{
    consultaId: string
    attendanceId: string
    dateTimeIso: string
    dateTimeLabel: string
    doctorName: string
    specialty: string
    status: 'concluido' | 'interrompido'
    triageSummary: string
    issuedDocuments: Array<{
      id: string
      kind: string
      title: string
      signedAtLabel: string
    }>
    posConsultaCheckins: Array<{
      id: string
      checkinNumber: number
      planDayNumber: number
      respondedAtLabel: string
      evolucaoComparacao: 'melhorou' | 'igual' | 'piorou'
      intensidadeSintoma: number | null
      medicacaoAdesao: 'sim' | 'parcial' | 'nao' | null
      summary: string
    }>
  }>
}> {
  const ctx = await loadProfissionalEscalaContext(profissionalId)
  if (!ctx.especialidadeId) {
    throw new PosConsultaError('Especialidade do profissional não configurada.', 'FORBIDDEN', 403)
  }

  const { data: paciente, error: pacienteError } = await supabaseAdmin
    .from('pacientes')
    .select('id, nome')
    .eq('id', pacienteId)
    .maybeSingle()

  if (pacienteError) throw pacienteError
  if (!paciente) {
    throw new PosConsultaError('Paciente não encontrado.', 'NOT_FOUND', 404)
  }

  const { data: consultas, error: consultasError } = await supabaseAdmin
    .from('consultas')
    .select(
      `
      id,
      codigo_atendimento,
      status,
      triagem_resumo,
      finalizada_em,
      iniciada_em,
      criado_em,
      especialidade_id,
      config_especialidades!inner ( nome ),
      usuarios_profissionais ( nome )
    `,
    )
    .eq('paciente_id', pacienteId)
    .eq('especialidade_id', ctx.especialidadeId)
    .in('status', ['concluida', 'interrompida'])
    .order('finalizada_em', { ascending: false, nullsFirst: false })

  if (consultasError) throw consultasError

  const rows = (consultas ?? []) as HistoricoConsultaRow[]
  const specialtyName =
    unwrapOne(rows[0]?.config_especialidades)?.nome?.trim() || specialtyLabel.trim() || 'Teleconsulta'

  const consultaIds = rows.map((row) => row.id)
  if (consultaIds.length === 0) {
    return {
      pacienteId,
      patientName: String(paciente.nome),
      specialty: specialtyName,
      consultas: [],
    }
  }

  const [planosResult, anexosResult] = await Promise.all([
    supabaseAdmin
      .from('pos_consulta_planos')
      .select('id, consulta_id')
      .in('consulta_id', consultaIds),
    supabaseAdmin
      .from('consulta_anexos')
      .select('id, consulta_id, tipo, titulo, criado_em')
      .in('consulta_id', consultaIds)
      .eq('origem', 'profissional')
      .order('criado_em', { ascending: true }),
  ])

  if (planosResult.error) throw planosResult.error
  if (anexosResult.error) throw anexosResult.error

  const planos = planosResult.data ?? []
  const planIds = planos.map((row) => String(row.id))
  const planConsultaById = new Map(planos.map((row) => [String(row.id), String(row.consulta_id)]))

  let checkinsData: Array<{
    id: string
    numero_checkin: number
    respondido_em: string | null
    plano_id: string
    pos_consulta_respostas:
      | { payload: PosConsultaCheckinRespostasInput; evolucao: string | null }
      | Array<{ payload: PosConsultaCheckinRespostasInput; evolucao: string | null }>
      | null
  }> = []

  if (planIds.length > 0) {
    const checkinsResult = await supabaseAdmin
      .from('pos_consulta_checkins')
      .select(
        `
        id,
        numero_checkin,
        respondido_em,
        plano_id,
        pos_consulta_respostas ( payload, evolucao )
      `,
      )
      .in('plano_id', planIds)
      .eq('status', 'respondido')
      .order('numero_checkin', { ascending: true })

    if (checkinsResult.error) throw checkinsResult.error
    checkinsData = (checkinsResult.data ?? []) as typeof checkinsData
  }

  const checkinsByConsulta = new Map<string, HistoricoCheckinRow[]>()
  for (const row of checkinsData) {
    const consultaId = planConsultaById.get(String(row.plano_id))
    if (!consultaId) continue
    const normalized: HistoricoCheckinRow = {
      id: row.id,
      numero_checkin: row.numero_checkin,
      respondido_em: row.respondido_em,
      pos_consulta_planos: { consulta_id: consultaId },
      pos_consulta_respostas: row.pos_consulta_respostas,
    }
    const current = checkinsByConsulta.get(consultaId) ?? []
    current.push(normalized)
    checkinsByConsulta.set(consultaId, current)
  }

  const anexosByConsulta = new Map<string, HistoricoAnexoRow[]>()
  for (const row of (anexosResult.data ?? []) as HistoricoAnexoRow[]) {
    const consultaId = String(row.consulta_id)
    const current = anexosByConsulta.get(consultaId) ?? []
    current.push(row)
    anexosByConsulta.set(consultaId, current)
  }

  const mappedConsultas = rows.map((row) => {
    const especialidade = unwrapOne(row.config_especialidades)
    const profissional = unwrapOne(row.usuarios_profissionais)
    const reference = row.finalizada_em ?? row.iniciada_em ?? row.criado_em
    const checkins = checkinsByConsulta.get(row.id) ?? []
    const anexos = anexosByConsulta.get(row.id) ?? []

    return {
      consultaId: row.id,
      attendanceId: row.codigo_atendimento,
      dateTimeIso: reference,
      dateTimeLabel: formatPosConsultaDateTimeLabel(reference),
      doctorName: String(profissional?.nome ?? 'Profissional'),
      specialty: String(especialidade?.nome ?? specialtyName),
      status: mapConsultaStatusToHistorico(row.status),
      triageSummary: row.triagem_resumo?.trim() || '—',
      issuedDocuments: anexos.map((anexo) => ({
        id: anexo.id,
        kind: mapAnexoKind(String(anexo.tipo)),
        title: anexo.titulo?.trim() || 'Documento clínico',
        signedAtLabel: formatPosConsultaDateTimeLabel(anexo.criado_em).split(' · ').pop() ?? '—',
      })),
      posConsultaCheckins: checkins
        .map((checkin) => {
          const resposta = unwrapOne(checkin.pos_consulta_respostas)
          if (!resposta?.evolucao) return null
          return {
            id: checkin.id,
            checkinNumber: checkin.numero_checkin,
            planDayNumber: posConsultaCheckinDayNumber(checkin.numero_checkin),
            respondedAtLabel: formatPosConsultaDateTimeLabel(checkin.respondido_em),
            evolucaoComparacao: resposta.evolucao as 'melhorou' | 'igual' | 'piorou',
            intensidadeSintoma: resposta.payload.intensidadeSintoma,
            medicacaoAdesao: resposta.payload.medicacaoAdesao,
            summary: buildCheckinSummary(resposta.payload, resposta.evolucao),
          }
        })
        .filter(Boolean) as Array<{
        id: string
        checkinNumber: number
        planDayNumber: number
        respondedAtLabel: string
        evolucaoComparacao: 'melhorou' | 'igual' | 'piorou'
        intensidadeSintoma: number | null
        medicacaoAdesao: 'sim' | 'parcial' | 'nao' | null
        summary: string
      }>,
    }
  })

  return {
    pacienteId,
    patientName: String(paciente.nome),
    specialty: specialtyName,
    consultas: mappedConsultas,
  }
}
