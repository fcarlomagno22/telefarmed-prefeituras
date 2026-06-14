import { supabaseAdmin } from '../../db/supabase.js'
import { listDistinctBairros } from './pacientes.service.js'
import type { PrefeituraPacientesFiltrosDto } from './types.js'

export async function getPrefeituraPacientesFiltros(
  entidadeId: string,
): Promise<PrefeituraPacientesFiltrosDto> {
  const [{ data: entidade, error: entidadeError }, { data: ubts, error: ubtsError }, bairros] =
    await Promise.all([
      supabaseAdmin
        .from('entidades_contratantes')
        .select('municipio, uf')
        .eq('id', entidadeId)
        .maybeSingle(),
      supabaseAdmin
        .from('unidades_ubt')
        .select('id, nome')
        .eq('entidade_contratante_id', entidadeId)
        .order('nome', { ascending: true }),
      listDistinctBairros(entidadeId),
    ])

  if (entidadeError) throw entidadeError
  if (ubtsError) throw ubtsError
  if (!entidade) {
    throw new Error('Entidade não encontrada.')
  }

  return {
    municipio: String(entidade.municipio),
    uf: String(entidade.uf),
    ubts: (ubts ?? []).map((row) => ({
      id: String(row.id),
      nome: String(row.nome),
    })),
    bairros,
  }
}
