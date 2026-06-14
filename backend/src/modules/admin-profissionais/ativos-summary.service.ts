import { supabaseAdmin } from '../../db/supabase.js'
import type { AtivosSummaryDto, ProfissionalAtivoRow } from './types.js'

export async function getAtivosSummary(): Promise<AtivosSummaryDto> {
  const { data, error } = await supabaseAdmin.from('vw_admin_profissionais_ativos').select('*')

  if (error) throw error

  const rows = (data ?? []) as ProfissionalAtivoRow[]
  const total = rows.length
  const ativos = rows.filter((row) => row.status === 'ativo').length
  const inativos = total - ativos
  const online = rows.filter((row) => row.online_agora).length
  const emPlantao = rows.filter((row) => row.plantao_rotulo.trim() && row.plantao_rotulo !== 'Indisponível').length
  const nacional = rows.filter((row) => row.alocacao === 'nacional').length
  const porContrato = total - nacional

  const ratingSum = rows.reduce((acc, row) => acc + (Number(row.rating_media) || 0), 0)
  const patientsSum = rows.reduce((acc, row) => acc + (row.pacientes_mes_atual || 0), 0)

  return {
    total,
    ativos,
    inativos,
    online,
    emPlantao,
    nacional,
    porContrato,
    medicos: rows.filter((row) => row.formacao === 'medicina').length,
    psicologos: rows.filter((row) => row.formacao === 'psicologia').length,
    nutricionistas: rows.filter((row) => row.formacao === 'nutricao').length,
    fonoaudiologos: rows.filter((row) => row.formacao === 'fonoaudiologia').length,
    averageRating: total > 0 ? ratingSum / total : 0,
    avgPatientsMonth: total > 0 ? patientsSum / total : 0,
  }
}
