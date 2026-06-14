import { supabaseAdmin } from '../../db/supabase.js'
import { parseConfigRede } from './formatters.js'
import { PrefeituraRedeError } from './errors.js'
import type { SettingsBody } from './schemas.js'
import type { RedeConfigRede, RedeSettingsApi } from './types.js'
import { loadRedeUnitRows } from './units.service.js'

async function loadPackageConsultationsTotal(entidadeId: string): Promise<number | null> {
  const { data, error } = await supabaseAdmin
    .from('contratos_entidade')
    .select('consultas_contratadas, status')
    .eq('entidade_contratante_id', entidadeId)
    .eq('status', 'ativo')
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data || data.consultas_contratadas == null) return null
  return Number(data.consultas_contratadas)
}

function buildUnitDailyLimits(
  config: RedeConfigRede,
  unitIds: string[],
  rows: Awaited<ReturnType<typeof loadRedeUnitRows>>,
): Record<string, string> {
  const limits: Record<string, string> = {}
  const rowsById = new Map(rows.map((row) => [row.id, row]))

  for (const unitId of unitIds) {
    const fromConfig = config.unitDailyLimits?.[unitId]
    if (fromConfig != null) {
      limits[unitId] = String(fromConfig)
      continue
    }
    const row = rowsById.get(unitId)
    limits[unitId] = String(row?.capacidade_diaria ?? 0)
  }

  return limits
}

function buildUnitSpecialties(
  config: RedeConfigRede,
  unitIds: string[],
  rows: Awaited<ReturnType<typeof loadRedeUnitRows>>,
): Record<string, string[]> {
  const specialties: Record<string, string[]> = {}
  const rowsById = new Map(rows.map((row) => [row.id, row]))

  for (const unitId of unitIds) {
    specialties[unitId] = config.unitSpecialties?.[unitId] ?? rowsById.get(unitId)?.especialidades ?? []
  }

  return specialties
}

export async function getRedeSettings(entidadeId: string): Promise<RedeSettingsApi> {
  const [entityResult, rows, packageTotal] = await Promise.all([
    supabaseAdmin.from('entidades_contratantes').select('config_rede').eq('id', entidadeId).maybeSingle(),
    loadRedeUnitRows(entidadeId),
    loadPackageConsultationsTotal(entidadeId),
  ])

  if (entityResult.error) throw entityResult.error
  if (!entityResult.data) {
    throw new PrefeituraRedeError('Entidade não encontrada.', 'NOT_FOUND', 404)
  }

  const config = parseConfigRede(entityResult.data.config_rede)
  const unitIds = rows.map((row) => row.id)

  return {
    limitDailyCapacity: Boolean(config.limitDailyCapacity),
    dailyCapacity: typeof config.dailyCapacity === 'number' ? config.dailyCapacity : 0,
    limitPerUnit: Boolean(config.limitPerUnit),
    unitDailyLimits: buildUnitDailyLimits(config, unitIds, rows),
    unitSpecialties: buildUnitSpecialties(config, unitIds, rows),
    allowAvulso: config.allowAvulso !== false,
    packageConsultationsTotal: packageTotal,
  }
}

export async function updateRedeSettings(
  entidadeId: string,
  body: SettingsBody,
): Promise<RedeSettingsApi> {
  const rows = await loadRedeUnitRows(entidadeId)
  const unitIds = new Set(rows.map((row) => row.id))

  if (body.unitDailyLimits) {
    for (const unitId of Object.keys(body.unitDailyLimits)) {
      if (!unitIds.has(unitId)) {
        throw new PrefeituraRedeError('Unidade inválida nas configurações.', 'INVALID_DATA', 400)
      }
    }
  }

  if (body.unitSpecialties) {
    for (const unitId of Object.keys(body.unitSpecialties)) {
      if (!unitIds.has(unitId)) {
        throw new PrefeituraRedeError('Unidade inválida nas configurações.', 'INVALID_DATA', 400)
      }
    }
  }

  const configRede: RedeConfigRede = {
    limitDailyCapacity: body.limitDailyCapacity,
    dailyCapacity: body.dailyCapacity,
    limitPerUnit: body.limitPerUnit,
    unitDailyLimits: body.unitDailyLimits ?? {},
    unitSpecialties: body.unitSpecialties ?? {},
    allowAvulso: body.allowAvulso,
  }

  const { error: entityError } = await supabaseAdmin
    .from('entidades_contratantes')
    .update({ config_rede: configRede })
    .eq('id', entidadeId)

  if (entityError) throw entityError

  if (body.limitPerUnit && body.unitDailyLimits) {
    const limitResults = await Promise.all(
      Object.entries(body.unitDailyLimits).map(([unitId, value]) =>
        supabaseAdmin
          .from('unidades_ubt')
          .update({ capacidade_diaria: Math.max(0, parseInt(value, 10) || 0) })
          .eq('id', unitId)
          .eq('entidade_contratante_id', entidadeId),
      ),
    )
    for (const result of limitResults) {
      if (result.error) throw result.error
    }
  }

  if (body.unitSpecialties) {
    const specialtyResults = await Promise.all(
      Object.entries(body.unitSpecialties).map(([unitId, specialtyIds]) =>
        supabaseAdmin
          .from('unidades_ubt')
          .update({ especialidades: specialtyIds })
          .eq('id', unitId)
          .eq('entidade_contratante_id', entidadeId),
      ),
    )
    for (const result of specialtyResults) {
      if (result.error) throw result.error
    }
  }

  return getRedeSettings(entidadeId)
}
