import { supabaseAdmin } from '../../db/supabase.js'
import { monthLabelShort, readEnderecoField } from '../admin-pacientes/formatters.js'
import { listPrefeituraPacientes } from './pacientes.service.js'
import type { PrefeituraPacientesAboutDto, PrefeituraPacientesSummaryDto } from './types.js'

type SummaryRow = {
  criado_em: string
  telefone: string | null
  email: string | null
  contato_emergencia: unknown
  endereco: Record<string, unknown> | null
  unidade_ubt_principal_nome: string | null
}

function isIncomplete(row: SummaryRow): boolean {
  if (!row.telefone?.trim()) return true
  if (!row.email?.trim()) return true
  if (!readEnderecoField(row.endereco, 'cep')) return true
  if (!Array.isArray(row.contato_emergencia) || row.contato_emergencia.length === 0) return true
  return false
}

export async function getPrefeituraPacientesSummary(
  entidadeId: string,
): Promise<{ summary: PrefeituraPacientesSummaryDto; about: PrefeituraPacientesAboutDto }> {
  const { data, error } = await supabaseAdmin
    .from('vw_admin_pacientes_listagem')
    .select('criado_em, telefone, email, contato_emergencia, endereco, unidade_ubt_principal_nome')
    .eq('entidade_contratante_id', entidadeId)

  if (error) throw error

  const rows = (data ?? []) as SummaryRow[]
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const newThisMonth = rows.filter((row) => {
    const created = new Date(row.criado_em)
    return created.getMonth() === currentMonth && created.getFullYear() === currentYear
  }).length

  const incompleteRecords = rows.filter(isIncomplete).length

  const listForInactive = await listPrefeituraPacientes(entidadeId, { pageSize: 10_000 })
  const inactiveSixMonths = listForInactive.rows.filter(
    (row) => (row.monthsWithoutConsultation ?? 0) >= 6,
  ).length

  const monthBuckets = new Map<string, number>()
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(currentYear, currentMonth - offset, 1)
    monthBuckets.set(monthLabelShort(date.getMonth()), 0)
  }

  const neighborhoodBuckets = new Map<string, number>()
  const unitBuckets = new Map<string, number>()

  for (const row of rows) {
    const created = new Date(row.criado_em)
    const monthLabel = monthLabelShort(created.getMonth())
    if (monthBuckets.has(monthLabel)) {
      monthBuckets.set(monthLabel, (monthBuckets.get(monthLabel) ?? 0) + 1)
    }

    const bairro = readEnderecoField(row.endereco, 'bairro') || 'Não informado'
    neighborhoodBuckets.set(bairro, (neighborhoodBuckets.get(bairro) ?? 0) + 1)

    const unit = row.unidade_ubt_principal_nome?.trim() || 'Sem UBT principal'
    unitBuckets.set(unit, (unitBuckets.get(unit) ?? 0) + 1)
  }

  return {
    summary: {
      totalPatients: rows.length,
      newThisMonth,
      incompleteRecords,
      inactiveSixMonths,
    },
    about: {
      newRegistrationsByMonth: Array.from(monthBuckets.entries()).map(([label, count]) => ({
        label,
        count,
      })),
      registrationsByNeighborhood: Array.from(neighborhoodBuckets.entries())
        .map(([label, registrations]) => ({ label, registrations }))
        .sort((a, b) => b.registrations - a.registrations)
        .slice(0, 8),
      registrationsByFirstUnit: Array.from(unitBuckets.entries())
        .map(([label, registrations]) => ({ label, registrations }))
        .sort((a, b) => b.registrations - a.registrations)
        .slice(0, 8),
    },
  }
}
