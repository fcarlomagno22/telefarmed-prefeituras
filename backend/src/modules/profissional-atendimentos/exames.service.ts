import { supabaseAdmin } from '../../db/supabase.js'
import { ProfissionalAtendimentosError } from './errors.js'
import {
  assertConsultaEmAndamento,
  assertConsultaOwnedByProfissional,
  loadConsultaById,
} from './ownership.js'

export async function registrarProfissionalSolicitacaoExame(
  profissionalId: string,
  consultaId: string,
  exameId: string,
  observacoes?: string,
): Promise<void> {
  const consulta = await loadConsultaById(consultaId)
  await assertConsultaOwnedByProfissional(profissionalId, consulta)
  await assertConsultaEmAndamento(consulta)

  const { data: exam, error: examError } = await supabaseAdmin
    .from('config_exames')
    .select('id')
    .eq('id', exameId.trim())
    .eq('ativo', true)
    .maybeSingle()

  if (examError) throw examError
  if (!exam) {
    throw new ProfissionalAtendimentosError('Exame não encontrado.', 'NOT_FOUND', 404)
  }

  const { error } = await supabaseAdmin.from('consulta_solicitacoes_exame').insert({
    consulta_id: consultaId,
    exame_id: exameId.trim(),
    observacoes: observacoes?.trim() ?? '',
  })

  if (error) throw error
}

export async function listProfissionalExamCatalog(): Promise<
  Array<{ id: string; name: string; category: string }>
> {
  const [categoriesResult, itemsResult] = await Promise.all([
    supabaseAdmin
      .from('config_categorias_exame')
      .select('id, nome')
      .eq('ativo', true)
      .order('ordem', { ascending: true }),
    supabaseAdmin
      .from('config_exames')
      .select('id, nome, categoria_id')
      .eq('ativo', true)
      .order('ordem', { ascending: true }),
  ])

  if (categoriesResult.error) throw categoriesResult.error
  if (itemsResult.error) throw itemsResult.error

  const categoryNames = new Map<string, string>()
  for (const row of categoriesResult.data ?? []) {
    categoryNames.set(String(row.id), String(row.nome))
  }

  return ((itemsResult.data ?? []) as Array<{ id: string; nome: string; categoria_id: string }>).map(
    (row) => ({
      id: String(row.id),
      name: String(row.nome),
      category: categoryNames.get(String(row.categoria_id)) ?? 'Outros',
    }),
  )
}
