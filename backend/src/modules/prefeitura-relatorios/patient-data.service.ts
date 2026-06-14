import { supabaseAdmin } from '../../db/supabase.js'
import {
  monthsWithoutConsultation,
  readEnderecoField,
  type ListagemRow,
} from '../admin-pacientes/formatters.js'
import { periodBounds } from '../prefeitura-consultas/period.js'
import { isMissingRelationError } from './report-shared.js'

export type PatientListagemRow = ListagemRow

export type PatientConsultationStat = {
  pacienteId: string
  lastConsultationIso: string | null
  totalConsultations: number
}

export type PreCadastroLinkRow = {
  paciente_id: string | null
  cpf: string
  unidade_ubt_id: string | null
  admin_usuario_id: string | null
  criado_em: string
}

export type PendingRetornoRow = {
  id: string
  paciente_id: string
  paciente_nome: string
  unidade_ubt_id: string
  unidade_nome: string
  especialidade_id: string
  data: string
  status: string
  kind: 'nao_realizado' | 'nao_agendado'
  daysOverdue: number
}

const PATIENT_SELECT = `
  id,
  cpf,
  nome,
  telefone,
  email,
  endereco,
  contato_emergencia,
  status,
  criado_em,
  sexo,
  data_nascimento,
  municipio,
  uf,
  unidade_ubt_principal_id,
  unidade_ubt_principal_nome
`

export function computeMissingFields(row: PatientListagemRow): string[] {
  const missing: string[] = []
  if (!row.telefone?.trim()) missing.push('telefone')
  if (!row.email?.trim()) missing.push('e-mail')
  const contacts = row.contato_emergencia
  const hasEmergency =
    Array.isArray(contacts) &&
    contacts.some((item) => {
      if (!item || typeof item !== 'object') return false
      const record = item as Record<string, unknown>
      const name = String(record.name ?? record.nome ?? '').trim()
      const phone = String(record.phone ?? record.telefone ?? '').trim()
      return Boolean(name && phone)
    })
  if (!hasEmergency) missing.push('contato de emergência')
  if (!readEnderecoField(row.endereco, 'cep')) missing.push('CEP')
  if (!readEnderecoField(row.endereco, 'bairro')) missing.push('bairro')
  return missing
}

export function resolveRegistrationChannel(
  row: PatientListagemRow,
  preCadastroByPacienteId: Map<string, PreCadastroLinkRow>,
  preCadastroByCpf: Map<string, PreCadastroLinkRow>,
): { key: string; label: string } {
  if (row.status === 'pre_cadastro') {
    return { key: 'pre_cadastro', label: 'Pré-cadastro' }
  }

  const pre =
    preCadastroByPacienteId.get(row.id) ?? preCadastroByCpf.get(row.cpf)
  if (pre?.admin_usuario_id) {
    return { key: 'painel_admin', label: 'Painel administrativo' }
  }
  if (pre?.unidade_ubt_id || row.unidade_ubt_principal_id) {
    return { key: 'ubt', label: 'Unidade de saúde' }
  }
  return { key: 'digital', label: 'Cadastro digital' }
}

export async function loadPatientsForEntity(entidadeId: string): Promise<PatientListagemRow[]> {
  const { data, error } = await supabaseAdmin
    .from('vw_admin_pacientes_listagem')
    .select(PATIENT_SELECT)
    .eq('entidade_contratante_id', entidadeId)

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  return (data ?? []) as PatientListagemRow[]
}

export async function loadPreCadastroLinks(entidadeId: string): Promise<PreCadastroLinkRow[]> {
  const { data, error } = await supabaseAdmin
    .from('paciente_pre_cadastros')
    .select('paciente_id, cpf, unidade_ubt_id, admin_usuario_id, criado_em')
    .eq('entidade_contratante_id', entidadeId)

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  return (data ?? []) as PreCadastroLinkRow[]
}

export async function loadPatientConsultationStats(
  pacienteIds: string[],
): Promise<Map<string, PatientConsultationStat>> {
  const stats = new Map<string, PatientConsultationStat>()
  if (pacienteIds.length === 0) return stats

  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select('paciente_id, criado_em, finalizada_em, status')
    .in('paciente_id', pacienteIds)
    .order('criado_em', { ascending: false })

  if (error) {
    if (isMissingRelationError(error)) return stats
    throw error
  }

  for (const row of data ?? []) {
    const pacienteId = String(row.paciente_id)
    const current = stats.get(pacienteId) ?? {
      pacienteId,
      lastConsultationIso: null,
      totalConsultations: 0,
    }
    current.totalConsultations += 1
    if (!current.lastConsultationIso) {
      current.lastConsultationIso = String(row.finalizada_em ?? row.criado_em)
    }
    stats.set(pacienteId, current)
  }

  return stats
}

export function filterPatientsCreatedInPeriod(
  rows: PatientListagemRow[],
  periodStart: string,
  periodEnd: string,
) {
  const { startIso, endIso } = periodBounds(periodStart, periodEnd)
  return rows.filter((row) => row.criado_em >= startIso && row.criado_em <= endIso)
}

export function enrichPatientRow(
  row: PatientListagemRow,
  consultationStats: Map<string, PatientConsultationStat>,
) {
  const stat = consultationStats.get(row.id)
  const lastConsultationIso = stat?.lastConsultationIso ?? null
  return {
    ...row,
    missingFields: computeMissingFields(row),
    monthsWithoutConsultation: monthsWithoutConsultation(lastConsultationIso),
    totalConsultations: stat?.totalConsultations ?? 0,
    lastConsultationIso,
  }
}

export async function loadPendingRetornos(
  entidadeId: string,
  unitIds: string[],
  periodStart: string,
  periodEnd: string,
): Promise<PendingRetornoRow[]> {
  if (unitIds.length === 0) return []

  const lookbackStart = new Date(`${periodStart}T12:00:00-03:00`)
  lookbackStart.setDate(lookbackStart.getDate() - 60)
  const lookbackIso = lookbackStart.toISOString().slice(0, 10)

  const { data, error } = await supabaseAdmin
    .from('agenda_consultas')
    .select(
      `
      id,
      paciente_id,
      unidade_ubt_id,
      especialidade_id,
      data,
      status,
      tipo,
      pacientes!inner ( nome ),
      unidades_ubt!inner ( nome )
    `,
    )
    .eq('entidade_contratante_id', entidadeId)
    .in('unidade_ubt_id', unitIds)
    .eq('tipo', 'retorno')
    .gte('data', lookbackIso)
    .lte('data', periodEnd)
    .in('status', ['agendado', 'aguardando', 'faltou'])

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  const periodEndDate = new Date(`${periodEnd}T23:59:59-03:00`)
  const rows: PendingRetornoRow[] = []

  for (const raw of data ?? []) {
    const pacienteRaw = (raw as { pacientes: unknown }).pacientes
    const paciente = (Array.isArray(pacienteRaw) ? pacienteRaw[0] : pacienteRaw) as {
      nome?: string
    } | null
    const unitRaw = (raw as { unidades_ubt: unknown }).unidades_ubt
    const unit = (Array.isArray(unitRaw) ? unitRaw[0] : unitRaw) as { nome?: string } | null
    const dataAgenda = String((raw as { data: string }).data)
    const appointmentDate = new Date(`${dataAgenda}T12:00:00-03:00`)
    const daysOverdue = Math.max(
      0,
      Math.floor((periodEndDate.getTime() - appointmentDate.getTime()) / 86_400_000),
    )

    rows.push({
      id: String((raw as { id: string }).id),
      paciente_id: String((raw as { paciente_id: string }).paciente_id),
      paciente_nome: paciente?.nome ? String(paciente.nome) : 'Paciente',
      unidade_ubt_id: String((raw as { unidade_ubt_id: string }).unidade_ubt_id),
      unidade_nome: unit?.nome ? String(unit.nome) : 'Unidade',
      especialidade_id: String((raw as { especialidade_id: string }).especialidade_id),
      data: dataAgenda,
      status: String((raw as { status: string }).status),
      kind: daysOverdue > 0 ? 'nao_realizado' : 'nao_agendado',
      daysOverdue,
    })
  }

  const { data: completedConsultas, error: completedError } = await supabaseAdmin
    .from('consultas')
    .select('paciente_id, criado_em, finalizada_em')
    .eq('entidade_contratante_id', entidadeId)
    .in('unidade_ubt_id', unitIds)
    .eq('status', 'concluida')
    .gte('criado_em', periodBounds(periodStart, periodEnd).startIso)
    .lte('criado_em', periodBounds(periodStart, periodEnd).endIso)

  if (!completedError && completedConsultas) {
    const patientsWithRetorno = new Set(rows.map((row) => row.paciente_id))
    const completedByPatient = new Map<string, string>()
    for (const row of completedConsultas) {
      const pacienteId = String(row.paciente_id)
      if (!completedByPatient.has(pacienteId)) {
        completedByPatient.set(
          pacienteId,
          String(row.finalizada_em ?? row.criado_em),
        )
      }
    }

    for (const [pacienteId] of completedByPatient) {
      if (patientsWithRetorno.has(pacienteId)) continue
      rows.push({
        id: `pending-${pacienteId}`,
        paciente_id: pacienteId,
        paciente_nome: 'Paciente',
        unidade_ubt_id: unitIds[0] ?? '',
        unidade_nome: '—',
        especialidade_id: '—',
        data: periodEnd,
        status: 'pendente',
        kind: 'nao_agendado',
        daysOverdue: 0,
      })
    }
  }

  return rows
}
