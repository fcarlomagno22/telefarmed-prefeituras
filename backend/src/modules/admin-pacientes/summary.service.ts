import { supabaseAdmin } from '../../db/supabase.js'
import { monthLabelShort } from './formatters.js'
import type { ListPacientesQuery, PacientesSummaryDto } from './types.js'

type SummaryCountRow = {
  municipio: string
  contrato_ativo: boolean
  criado_em: string
  telefone: string | null
  email: string | null
  contato_emergencia: unknown
  endereco: Record<string, unknown> | null
}

function isIncomplete(row: SummaryCountRow): boolean {
  if (!row.telefone?.trim()) return true
  if (!row.email?.trim()) return true
  const cep =
    row.endereco && typeof row.endereco.cep === 'string' ? row.endereco.cep.trim() : ''
  if (!cep) return true
  if (!Array.isArray(row.contato_emergencia) || row.contato_emergencia.length === 0) return true
  return false
}

export async function getPacientesSummary(
  params: Pick<ListPacientesQuery, 'municipio' | 'entidadeContratanteId'> = {},
): Promise<PacientesSummaryDto> {
  let baseQuery = supabaseAdmin
    .from('vw_admin_pacientes_listagem')
    .select('municipio, contrato_ativo, criado_em, telefone, email, contato_emergencia, endereco')

  if (params.municipio) baseQuery = baseQuery.eq('municipio', params.municipio)
  if (params.entidadeContratanteId) {
    baseQuery = baseQuery.eq('entidade_contratante_id', params.entidadeContratanteId)
  }

  const { data, error } = await baseQuery
  if (error) throw error

  const rows = (data ?? []) as SummaryCountRow[]
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const novosNoMesAtual = rows.filter((row) => {
    const created = new Date(row.criado_em)
    return created.getMonth() === currentMonth && created.getFullYear() === currentYear
  }).length

  const contratoAtivo = rows.filter((row) => row.contrato_ativo).length
  const contratoEncerrado = rows.length - contratoAtivo
  const registrosIncompletos = rows.filter(isIncomplete).length
  const municipios = Array.from(new Set(rows.map((row) => row.municipio))).sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  )

  const monthBuckets = new Map<string, number>()
  for (let offset = 4; offset >= 0; offset -= 1) {
    const date = new Date(currentYear, currentMonth - offset, 1)
    const label = monthLabelShort(date.getMonth())
    monthBuckets.set(label, 0)
  }

  for (const row of rows) {
    const created = new Date(row.criado_em)
    const label = monthLabelShort(created.getMonth())
    if (monthBuckets.has(label)) {
      monthBuckets.set(label, (monthBuckets.get(label) ?? 0) + 1)
    }
  }

  return {
    totalPacientes: rows.length,
    novosNoMesAtual,
    contratoAtivo,
    contratoEncerrado,
    registrosIncompletos,
    novosCadastrosPorMes: Array.from(monthBuckets.entries()).map(([label, count]) => ({
      label,
      count,
    })),
    cadastrosPorMunicipio: municipios.map((municipio) => ({
      label: municipio,
      registrations: rows.filter((row) => row.municipio === municipio).length,
    })),
    basePorStatusContratual: [
      { label: 'Ativo', registrations: contratoAtivo },
      { label: 'Encerrado', registrations: contratoEncerrado },
    ],
    municipios,
  }
}
