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
