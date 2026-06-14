import { supabaseAdmin } from '../../db/supabase.js'
import { ConfiguracoesError } from './errors.js'
import type {
  ConsultaCatalogDto,
  CreateExamCategoryInput,
  CreateExamItemInput,
  ExamCategoryDto,
  ExamItemDto,
  UpdateExamCategoryInput,
  UpdateExamItemInput,
} from './types.js'

type ExamCategoryRow = {
  id: string
  nome: string
  ativo: boolean
  ordem: number
}

type ExamItemRow = {
  id: string
  nome: string
  categoria_id: string
  ativo: boolean
  ordem: number
}

const CATEGORY_COLUMNS = 'id, nome, ativo, ordem'
const ITEM_COLUMNS = 'id, nome, categoria_id, ativo, ordem'

function mapExamCategoryRow(row: ExamCategoryRow): ExamCategoryDto {
  return {
    id: row.id,
    name: row.nome,
    active: row.ativo,
    sortOrder: row.ordem,
  }
}

function mapExamItemRow(row: ExamItemRow): ExamItemDto {
  return {
    id: row.id,
    name: row.nome,
    categoryId: row.categoria_id,
    active: row.ativo,
    sortOrder: row.ordem,
  }
}

async function assertExamCategoryExists(categoryId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('config_categorias_exame')
    .select('id')
    .eq('id', categoryId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ConfiguracoesError('Categoria de exame não encontrada.', 'NOT_FOUND', 404)
  }
}

export async function getConsultaCatalog(options?: {
  activeOnly?: boolean
}): Promise<ConsultaCatalogDto> {
  let categoriesQuery = supabaseAdmin
    .from('config_categorias_exame')
    .select(CATEGORY_COLUMNS)
    .order('ordem', { ascending: true })
    .order('nome', { ascending: true })

  let itemsQuery = supabaseAdmin
    .from('config_exames')
    .select(ITEM_COLUMNS)
    .order('ordem', { ascending: true })
    .order('nome', { ascending: true })

  if (options?.activeOnly) {
    categoriesQuery = categoriesQuery.eq('ativo', true)
    itemsQuery = itemsQuery.eq('ativo', true)
  }

  const [categoriesResult, itemsResult] = await Promise.all([categoriesQuery, itemsQuery])

  if (categoriesResult.error) throw categoriesResult.error
  if (itemsResult.error) throw itemsResult.error

  return {
    examCategories: ((categoriesResult.data ?? []) as ExamCategoryRow[]).map(mapExamCategoryRow),
    examItems: ((itemsResult.data ?? []) as ExamItemRow[]).map(mapExamItemRow),
  }
}

export async function createExamCategory(input: CreateExamCategoryInput): Promise<ExamCategoryDto> {
  const { count, error: countError } = await supabaseAdmin
    .from('config_categorias_exame')
    .select('id', { count: 'exact', head: true })

  if (countError) throw countError

  const { data, error } = await supabaseAdmin
    .from('config_categorias_exame')
    .insert({
      id: input.id,
      nome: input.name,
      ativo: input.active ?? true,
      ordem: (count ?? 0) + 1,
    })
    .select(CATEGORY_COLUMNS)
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ConfiguracoesError(
        'Já existe uma categoria com este ID ou nome.',
        'DUPLICATE_NAME',
        409,
      )
    }
    throw error
  }

  return mapExamCategoryRow(data as ExamCategoryRow)
}

export async function updateExamCategory(
  id: string,
  input: UpdateExamCategoryInput,
): Promise<ExamCategoryDto> {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('config_categorias_exame')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (existingError) throw existingError
  if (!existing) {
    throw new ConfiguracoesError('Categoria de exame não encontrada.', 'NOT_FOUND', 404)
  }

  const { data, error } = await supabaseAdmin
    .from('config_categorias_exame')
    .update({ nome: input.name })
    .eq('id', id)
    .select(CATEGORY_COLUMNS)
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ConfiguracoesError(
        'Já existe uma categoria com este nome.',
        'DUPLICATE_NAME',
        409,
      )
    }
    throw error
  }

  return mapExamCategoryRow(data as ExamCategoryRow)
}

export async function setExamCategoryStatus(id: string, active: boolean): Promise<ExamCategoryDto> {
  const { data, error } = await supabaseAdmin
    .from('config_categorias_exame')
    .update({ ativo: active })
    .eq('id', id)
    .select(CATEGORY_COLUMNS)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ConfiguracoesError('Categoria de exame não encontrada.', 'NOT_FOUND', 404)
  }

  return mapExamCategoryRow(data as ExamCategoryRow)
}

export async function deleteExamCategory(id: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('config_categorias_exame')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ConfiguracoesError('Categoria de exame não encontrada.', 'NOT_FOUND', 404)
  }
}

export async function createExamItem(input: CreateExamItemInput): Promise<ExamItemDto> {
  await assertExamCategoryExists(input.categoryId)

  const { count, error: countError } = await supabaseAdmin
    .from('config_exames')
    .select('id', { count: 'exact', head: true })
    .eq('categoria_id', input.categoryId)

  if (countError) throw countError

  const { data, error } = await supabaseAdmin
    .from('config_exames')
    .insert({
      id: input.id,
      nome: input.name,
      categoria_id: input.categoryId,
      ativo: input.active ?? true,
      ordem: (count ?? 0) + 1,
    })
    .select(ITEM_COLUMNS)
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ConfiguracoesError(
        'Já existe um exame com este ID ou nome nesta categoria.',
        'DUPLICATE_NAME',
        409,
      )
    }
    throw error
  }

  return mapExamItemRow(data as ExamItemRow)
}

export async function updateExamItem(id: string, input: UpdateExamItemInput): Promise<ExamItemDto> {
  await assertExamCategoryExists(input.categoryId)

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('config_exames')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (existingError) throw existingError
  if (!existing) {
    throw new ConfiguracoesError('Exame não encontrado.', 'NOT_FOUND', 404)
  }

  const { data, error } = await supabaseAdmin
    .from('config_exames')
    .update({
      nome: input.name,
      categoria_id: input.categoryId,
    })
    .eq('id', id)
    .select(ITEM_COLUMNS)
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ConfiguracoesError(
        'Já existe um exame com este nome nesta categoria.',
        'DUPLICATE_NAME',
        409,
      )
    }
    throw error
  }

  return mapExamItemRow(data as ExamItemRow)
}

export async function setExamItemStatus(id: string, active: boolean): Promise<ExamItemDto> {
  const { data, error } = await supabaseAdmin
    .from('config_exames')
    .update({ ativo: active })
    .eq('id', id)
    .select(ITEM_COLUMNS)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ConfiguracoesError('Exame não encontrado.', 'NOT_FOUND', 404)
  }

  return mapExamItemRow(data as ExamItemRow)
}

export async function deleteExamItem(id: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('config_exames')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ConfiguracoesError('Exame não encontrado.', 'NOT_FOUND', 404)
  }
}

const BULK_MAX_ITEMS = 200

export async function createExamCategoriesBulk(
  inputs: CreateExamCategoryInput[],
): Promise<ExamCategoryDto[]> {
  if (inputs.length === 0) return []
  if (inputs.length > BULK_MAX_ITEMS) {
    throw new ConfiguracoesError(
      `Máximo de ${BULK_MAX_ITEMS} categorias por requisição.`,
      'INVALID_DATA',
      400,
    )
  }

  const { count, error: countError } = await supabaseAdmin
    .from('config_categorias_exame')
    .select('id', { count: 'exact', head: true })

  if (countError) throw countError

  const baseOrder = count ?? 0
  const rows = inputs.map((input, index) => ({
    id: input.id,
    nome: input.name,
    ativo: input.active ?? true,
    ordem: baseOrder + index + 1,
  }))

  const { data, error } = await supabaseAdmin
    .from('config_categorias_exame')
    .insert(rows)
    .select(CATEGORY_COLUMNS)

  if (error) {
    if (error.code === '23505') {
      throw new ConfiguracoesError(
        'Já existe uma categoria com este ID ou nome.',
        'DUPLICATE_NAME',
        409,
      )
    }
    throw error
  }

  return ((data ?? []) as ExamCategoryRow[]).map(mapExamCategoryRow)
}

export async function createExamItemsBulk(inputs: CreateExamItemInput[]): Promise<ExamItemDto[]> {
  if (inputs.length === 0) return []
  if (inputs.length > BULK_MAX_ITEMS) {
    throw new ConfiguracoesError(
      `Máximo de ${BULK_MAX_ITEMS} exames por requisição.`,
      'INVALID_DATA',
      400,
    )
  }

  const categoryIds = [...new Set(inputs.map((input) => input.categoryId))]
  const { data: categories, error: categoriesError } = await supabaseAdmin
    .from('config_categorias_exame')
    .select('id')
    .in('id', categoryIds)

  if (categoriesError) throw categoriesError

  const existingCategoryIds = new Set((categories ?? []).map((row) => row.id as string))
  for (const categoryId of categoryIds) {
    if (!existingCategoryIds.has(categoryId)) {
      throw new ConfiguracoesError('Categoria de exame não encontrada.', 'NOT_FOUND', 404)
    }
  }

  const countsByCategory = new Map<string, number>()
  for (const categoryId of categoryIds) {
    const { count, error: countError } = await supabaseAdmin
      .from('config_exames')
      .select('id', { count: 'exact', head: true })
      .eq('categoria_id', categoryId)

    if (countError) throw countError
    countsByCategory.set(categoryId, count ?? 0)
  }

  const rows = inputs.map((input) => {
    const currentOrder = (countsByCategory.get(input.categoryId) ?? 0) + 1
    countsByCategory.set(input.categoryId, currentOrder)
    return {
      id: input.id,
      nome: input.name,
      categoria_id: input.categoryId,
      ativo: input.active ?? true,
      ordem: currentOrder,
    }
  })

  const { data, error } = await supabaseAdmin
    .from('config_exames')
    .insert(rows)
    .select(ITEM_COLUMNS)

  if (error) {
    if (error.code === '23505') {
      throw new ConfiguracoesError(
        'Já existe um exame com este ID ou nome nesta categoria.',
        'DUPLICATE_NAME',
        409,
      )
    }
    throw error
  }

  return ((data ?? []) as ExamItemRow[]).map(mapExamItemRow)
}

export type DeleteExamItemsBulkInput =
  | { ids: string[] }
  | { categoryId: string; allInCategory: true }

export type DeleteExamItemsBulkResult = {
  deletedCount: number
  deletedIds: string[]
}

export async function deleteExamItemsBulk(
  payload: DeleteExamItemsBulkInput,
): Promise<DeleteExamItemsBulkResult> {
  if ('allInCategory' in payload && payload.allInCategory) {
    await assertExamCategoryExists(payload.categoryId)

    const { data, error } = await supabaseAdmin
      .from('config_exames')
      .delete()
      .eq('categoria_id', payload.categoryId)
      .select('id')

    if (error) throw error

    const deletedIds = ((data ?? []) as { id: string }[]).map((row) => row.id)
    return { deletedCount: deletedIds.length, deletedIds }
  }

  if (!('ids' in payload)) {
    return { deletedCount: 0, deletedIds: [] }
  }

  const ids = payload.ids
  if (ids.length === 0) {
    return { deletedCount: 0, deletedIds: [] }
  }

  const { data, error } = await supabaseAdmin
    .from('config_exames')
    .delete()
    .in('id', ids)
    .select('id')

  if (error) throw error

  const deletedIds = ((data ?? []) as { id: string }[]).map((row) => row.id)
  return { deletedCount: deletedIds.length, deletedIds }
}
