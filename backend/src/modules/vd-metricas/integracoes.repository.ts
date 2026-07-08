import { supabaseAdmin } from '../../db/supabase.js'
import { VdMetricasError } from './errors.js'
import { rowToIntegracaoMetricasDto } from './integracoes.formatters.js'
import type {
  IntegracaoMetricasDto,
  IntegracoesMetricasListDto,
  PacienteMetricasIntegracaoRow,
  UpdateIntegracaoMetricasResultDto,
  VdMetricasPacienteScope,
} from './types.js'

type IntegracaoRowDb = {
  id: string
  paciente_id: string
  entidade_contratante_id: string
  integration_id: string
  status: 'connected' | 'disconnected'
  permissions: unknown
  metadata: unknown
  conectado_em: string | null
  criado_em: string
  atualizado_em: string
}

function mapIntegracaoRow(row: IntegracaoRowDb): PacienteMetricasIntegracaoRow {
  return {
    id: row.id,
    paciente_id: row.paciente_id,
    entidade_contratante_id: row.entidade_contratante_id,
    integration_id: row.integration_id,
    status: row.status,
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
    metadata:
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    conectado_em: row.conectado_em,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
  }
}

const INTEGRACAO_SELECT =
  'id, paciente_id, entidade_contratante_id, integration_id, status, permissions, metadata, conectado_em, criado_em, atualizado_em'

function isMissingIntegracoesTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const code = (error as { code?: string }).code
  const message = String((error as { message?: string }).message ?? '')

  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    message.includes('paciente_metricas_integracoes')
  )
}

export async function listIntegracoesRows(
  pacienteId: string,
): Promise<PacienteMetricasIntegracaoRow[]> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_integracoes')
    .select(INTEGRACAO_SELECT)
    .eq('paciente_id', pacienteId)
    .order('integration_id', { ascending: true })

  if (error) {
    if (isMissingIntegracoesTableError(error)) {
      return []
    }
    throw error
  }

  return (data ?? []).map((row) => mapIntegracaoRow(row as IntegracaoRowDb))
}

export async function fetchIntegracoesMetricas(
  scope: VdMetricasPacienteScope,
): Promise<IntegracoesMetricasListDto> {
  const rows = await listIntegracoesRows(scope.pacienteId)

  const integrations: Record<string, IntegracaoMetricasDto> = {}
  for (const row of rows) {
    integrations[row.integration_id] = rowToIntegracaoMetricasDto(row)
  }

  return { integrations }
}

export async function upsertIntegracaoMetricas(
  scope: VdMetricasPacienteScope,
  integrationId: string,
  input: {
    status: 'connected' | 'disconnected'
    permissions: string[]
    connectedAt?: string
    connectedDeviceName?: string
    lastSyncedAt?: string
  },
): Promise<UpdateIntegracaoMetricasResultDto> {
  if (
    input.status === 'connected' &&
    input.permissions.length === 0 &&
    integrationId !== 'devices'
  ) {
    throw new VdMetricasError(
      'Informe ao menos uma permissão para conectar.',
      'INVALID_DATA',
      400,
    )
  }

  const { data: existingData, error: existingError } = await supabaseAdmin
    .from('paciente_metricas_integracoes')
    .select(INTEGRACAO_SELECT)
    .eq('paciente_id', scope.pacienteId)
    .eq('integration_id', integrationId)
    .maybeSingle()

  if (existingError) {
    if (isMissingIntegracoesTableError(existingError)) {
      throw new VdMetricasError(
        'Integrações de saúde indisponíveis. Aplique a migration paciente_metricas_integracoes.',
        'INVALID_DATA',
        503,
      )
    }
    throw existingError
  }

  const existing = existingData
    ? mapIntegracaoRow(existingData as IntegracaoRowDb)
    : null

  const nowIso = new Date().toISOString()
  const connectedAt =
    input.status === 'connected' ? (input.connectedAt ?? existing?.conectado_em ?? nowIso) : null

  const metadata: Record<string, unknown> = { ...(existing?.metadata ?? {}) }

  if (input.status === 'connected') {
    metadata.lastSyncedAt = input.lastSyncedAt ?? input.connectedAt ?? nowIso
    if (input.connectedDeviceName) {
      metadata.connectedDeviceName = input.connectedDeviceName
    } else if (integrationId !== 'devices') {
      delete metadata.connectedDeviceName
    }
  } else {
    delete metadata.lastSyncedAt
    delete metadata.connectedDeviceName
  }

  const payload = {
    paciente_id: scope.pacienteId,
    entidade_contratante_id: scope.entidadeContratanteId,
    integration_id: integrationId,
    status: input.status,
    permissions: input.permissions,
    metadata,
    conectado_em: connectedAt,
  }

  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_integracoes')
    .upsert(payload, { onConflict: 'paciente_id,integration_id' })
    .select(INTEGRACAO_SELECT)
    .single()

  if (error) {
    if (isMissingIntegracoesTableError(error)) {
      throw new VdMetricasError(
        'Integrações de saúde indisponíveis. Aplique a migration paciente_metricas_integracoes.',
        'INVALID_DATA',
        503,
      )
    }
    throw error
  }
  if (!data) {
    throw new VdMetricasError('Não foi possível salvar a integração.', 'INVALID_DATA', 400)
  }

  const row = mapIntegracaoRow(data as IntegracaoRowDb)

  return {
    integrationId,
    integration: rowToIntegracaoMetricasDto(row),
  }
}
