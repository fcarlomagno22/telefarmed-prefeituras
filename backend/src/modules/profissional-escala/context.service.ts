import { supabaseAdmin } from '../../db/supabase.js'
import { ProfissionalEscalaError } from './errors.js'
import type { ProfissionalEscalaContext, ProfissionalSlotDisponivelRow } from './types.js'

export async function loadProfissionalEscalaContext(
  profissionalId: string,
): Promise<ProfissionalEscalaContext> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id, especialidade_id, alocacao, entidade_contratante_id, status')
    .eq('id', profissionalId)
    .maybeSingle()

  if (error) throw error
  if (!data || data.status !== 'ativo') {
    throw new ProfissionalEscalaError('Profissional não encontrado ou inativo.', 'FORBIDDEN', 403)
  }

  const alocacao = data.alocacao === 'por_contrato' ? 'por_contrato' : 'nacional'

  return {
    profissionalId: String(data.id),
    especialidadeId: data.especialidade_id ? String(data.especialidade_id) : null,
    alocacao,
    entidadeContratanteId: data.entidade_contratante_id
      ? String(data.entidade_contratante_id)
      : null,
  }
}

function parsePrefeituraScope(raw: unknown): { mode: 'all' | 'selected'; prefeituraIds: string[] } {
  if (!raw || typeof raw !== 'object') {
    return { mode: 'all', prefeituraIds: [] }
  }
  const obj = raw as Record<string, unknown>
  return {
    mode: obj.mode === 'selected' ? 'selected' : 'all',
    prefeituraIds: Array.isArray(obj.prefeituraIds)
      ? obj.prefeituraIds.map(String).filter(Boolean)
      : [],
  }
}

export function slotMatchesProfissionalScope(
  row: Pick<ProfissionalSlotDisponivelRow, 'especialidade_id' | 'escopo_prefeitura'>,
  ctx: ProfissionalEscalaContext,
): boolean {
  if (ctx.especialidadeId && row.especialidade_id !== ctx.especialidadeId) {
    return false
  }

  if (ctx.alocacao === 'por_contrato' && ctx.entidadeContratanteId) {
    const scope = parsePrefeituraScope(row.escopo_prefeitura)
    if (scope.mode === 'selected' && scope.prefeituraIds.length > 0) {
      if (!scope.prefeituraIds.includes(ctx.entidadeContratanteId)) {
        return false
      }
    }
  }

  return true
}
