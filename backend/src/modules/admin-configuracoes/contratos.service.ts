import {
  invalidateContratosCatalogCache,
  withCatalogCache,
} from '../../lib/cache/catalogCache.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { ConfiguracoesError } from './errors.js'
import type {
  CommercialRulesDto,
  ContractTypeDto,
  ContratosCatalogDto,
  CreateContractTypeInput,
  SaveCommercialRulesInput,
  UpdateContractTypeInput,
} from './types.js'

export const PRESET_CONTRACT_TYPE_IDS = ['mensal', 'pacote_fechado', 'sob_demanda'] as const

type ContractTypeRow = {
  id: string
  nome: string
  descricao: string
  ativo: boolean
  ordem: number
}

type CommercialRulesRow = {
  id: string
  permite_ultrapassar_pacote_padrao: boolean
  valor_avulso_padrao_brl: number | string
  min_meses_contrato: number
  dias_implantacao_padrao: number
  exige_especialidades_autorizadas: boolean
  bloquear_consulta_pacote_esgotado: boolean
}

const COMMERCIAL_RULES_COLUMNS =
  'id, permite_ultrapassar_pacote_padrao, valor_avulso_padrao_brl, min_meses_contrato, dias_implantacao_padrao, exige_especialidades_autorizadas, bloquear_consulta_pacote_esgotado'

function formatBrl(value: number | string): string {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value))
  if (!Number.isFinite(numeric)) return '0,00'
  return numeric.toFixed(2).replace('.', ',')
}

function parseBrl(value: string): number {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.')
  const numeric = Number.parseFloat(normalized)
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new ConfiguracoesError('Valor avulso padrão inválido.', 'INVALID_DATA', 400)
  }
  return Math.round(numeric * 100) / 100
}

function mapContractTypeRow(row: ContractTypeRow): ContractTypeDto {
  return {
    id: row.id,
    label: row.nome,
    description: row.descricao,
    active: row.ativo,
    sortOrder: row.ordem,
  }
}

function mapCommercialRulesRow(row: CommercialRulesRow): CommercialRulesDto {
  return {
    defaultAllowExceedPackage: row.permite_ultrapassar_pacote_padrao,
    defaultAvulsoUnitValueBrl: formatBrl(row.valor_avulso_padrao_brl),
    minContractMonths: row.min_meses_contrato,
    defaultImplantationDays: row.dias_implantacao_padrao,
    requireAuthorizedSpecialtiesOnContract: row.exige_especialidades_autorizadas,
    blockConsultWhenPackageExceeded: row.bloquear_consulta_pacote_esgotado,
  }
}

async function loadContratosCatalogFromDb(options?: {
  activeOnly?: boolean
}): Promise<ContratosCatalogDto> {
  let contractTypesQuery = supabaseAdmin
    .from('config_tipos_contrato')
    .select('id, nome, descricao, ativo, ordem')
    .order('ordem', { ascending: true })
    .order('nome', { ascending: true })

  if (options?.activeOnly) {
    contractTypesQuery = contractTypesQuery.eq('ativo', true)
  }

  const [contractTypesResult, commercialRulesResult] = await Promise.all([
    contractTypesQuery,
    supabaseAdmin
      .from('config_regras_comerciais')
      .select(COMMERCIAL_RULES_COLUMNS)
      .eq('id', 'global')
      .maybeSingle(),
  ])

  if (contractTypesResult.error) throw contractTypesResult.error
  if (commercialRulesResult.error) throw commercialRulesResult.error

  if (!commercialRulesResult.data) {
    throw new ConfiguracoesError(
      'Regras comerciais globais não configuradas.',
      'NOT_FOUND',
      404,
    )
  }

  return {
    contractTypes: ((contractTypesResult.data ?? []) as ContractTypeRow[]).map(mapContractTypeRow),
    commercialRules: mapCommercialRulesRow(commercialRulesResult.data as CommercialRulesRow),
  }
}

export async function getContratosCatalog(options?: {
  activeOnly?: boolean
}): Promise<ContratosCatalogDto> {
  const cacheKey = options?.activeOnly ? 'active' : 'all'
  return withCatalogCache('contratos', cacheKey, () => loadContratosCatalogFromDb(options))
}

export async function createContractType(input: CreateContractTypeInput): Promise<ContractTypeDto> {
  const { count, error: countError } = await supabaseAdmin
    .from('config_tipos_contrato')
    .select('id', { count: 'exact', head: true })

  if (countError) throw countError

  const { data, error } = await supabaseAdmin
    .from('config_tipos_contrato')
    .insert({
      id: input.id,
      nome: input.label,
      descricao: input.description,
      ativo: input.active ?? true,
      ordem: (count ?? 0) + 1,
    })
    .select('id, nome, descricao, ativo, ordem')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ConfiguracoesError(
        'Já existe um tipo de contrato com este ID ou nome.',
        'DUPLICATE_NAME',
        409,
      )
    }
    throw error
  }

  invalidateContratosCatalogCache()
  return mapContractTypeRow(data as ContractTypeRow)
}

export async function updateContractType(
  id: string,
  input: UpdateContractTypeInput,
): Promise<ContractTypeDto> {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('config_tipos_contrato')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (existingError) throw existingError
  if (!existing) {
    throw new ConfiguracoesError('Tipo de contrato não encontrado.', 'NOT_FOUND', 404)
  }

  const { data, error } = await supabaseAdmin
    .from('config_tipos_contrato')
    .update({
      nome: input.label,
      descricao: input.description,
    })
    .eq('id', id)
    .select('id, nome, descricao, ativo, ordem')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ConfiguracoesError(
        'Já existe um tipo de contrato com este nome.',
        'DUPLICATE_NAME',
        409,
      )
    }
    throw error
  }

  invalidateContratosCatalogCache()
  return mapContractTypeRow(data as ContractTypeRow)
}

export async function setContractTypeStatus(id: string, active: boolean): Promise<ContractTypeDto> {
  const { data, error } = await supabaseAdmin
    .from('config_tipos_contrato')
    .update({ ativo: active })
    .eq('id', id)
    .select('id, nome, descricao, ativo, ordem')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ConfiguracoesError('Tipo de contrato não encontrado.', 'NOT_FOUND', 404)
  }

  invalidateContratosCatalogCache()
  return mapContractTypeRow(data as ContractTypeRow)
}

export async function deleteContractType(id: string): Promise<void> {
  if ((PRESET_CONTRACT_TYPE_IDS as readonly string[]).includes(id)) {
    throw new ConfiguracoesError(
      'Tipos de contrato padrão da plataforma não podem ser excluídos.',
      'FORBIDDEN',
      403,
    )
  }

  const { data, error } = await supabaseAdmin
    .from('config_tipos_contrato')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ConfiguracoesError('Tipo de contrato não encontrado.', 'NOT_FOUND', 404)
  }

  invalidateContratosCatalogCache()
}

export async function saveCommercialRules(
  input: SaveCommercialRulesInput,
): Promise<CommercialRulesDto> {
  const valorAvulso = parseBrl(input.defaultAvulsoUnitValueBrl)

  const { data, error } = await supabaseAdmin
    .from('config_regras_comerciais')
    .update({
      permite_ultrapassar_pacote_padrao: input.defaultAllowExceedPackage,
      valor_avulso_padrao_brl: valorAvulso,
      min_meses_contrato: input.minContractMonths,
      dias_implantacao_padrao: input.defaultImplantationDays,
      exige_especialidades_autorizadas: input.requireAuthorizedSpecialtiesOnContract,
      bloquear_consulta_pacote_esgotado: input.blockConsultWhenPackageExceeded,
    })
    .eq('id', 'global')
    .select(COMMERCIAL_RULES_COLUMNS)
    .single()

  if (error) throw error

  invalidateContratosCatalogCache()
  return mapCommercialRulesRow(data as CommercialRulesRow)
}
