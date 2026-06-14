import { supabaseAdmin } from '../../db/supabase.js'
import { ComunicadosError } from './errors.js'
import type { AdminBroadcastTargetSnapshot, DestinatarioInsert } from './types.js'

type PrefeituraTarget = {
  channel: 'prefeitura'
  mode: 'all' | 'selected' | 'users'
  recipientIds?: string[]
  userIds?: string[]
}

type UbtTarget = {
  channel: 'ubt'
  mode: 'all' | 'selected' | 'users'
  recipientIds?: string[]
  userIds?: string[]
}

type MedicoTarget =
  | {
      channel: 'medico'
      mode: 'users'
      userIds: string[]
    }
  | {
      channel: 'medico'
      mode: 'all'
      audienceScope: 'medico_all' | 'medico_plantao' | 'medico_especialidade'
      specialtyFilter?: string
    }

export type AdminBroadcastTargetInput = PrefeituraTarget | UbtTarget | MedicoTarget

async function loadActivePrefeituraUsers(filters: {
  entidadeIds?: string[]
  userIds?: string[]
}): Promise<Array<{ id: string; nome: string; entidadeId: string }>> {
  let query = supabaseAdmin
    .from('usuarios_prefeitura')
    .select('id, nome, entidade_contratante_id')
    .eq('status', 'ativo')

  if (filters.userIds?.length) {
    query = query.in('id', filters.userIds)
  } else if (filters.entidadeIds?.length) {
    query = query.in('entidade_contratante_id', filters.entidadeIds)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: String(row.id),
    nome: String(row.nome),
    entidadeId: String(row.entidade_contratante_id),
  }))
}

async function loadActiveUbtUsers(filters: {
  unitIds?: string[]
  userIds?: string[]
}): Promise<Array<{ id: string; nome: string; unitId: string | null }>> {
  let query = supabaseAdmin
    .from('usuarios_ubt')
    .select('id, nome, unidade_ubt_id')
    .eq('status', 'ativo')

  if (filters.userIds?.length) {
    query = query.in('id', filters.userIds)
  } else if (filters.unitIds?.length) {
    query = query.in('unidade_ubt_id', filters.unitIds)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: String(row.id),
    nome: String(row.nome),
    unitId: row.unidade_ubt_id ? String(row.unidade_ubt_id) : null,
  }))
}

async function loadActiveProfissionais(filters: {
  audienceScope: 'medico_all' | 'medico_plantao' | 'medico_especialidade'
  specialtyFilter?: string
}): Promise<Array<{ id: string; nome: string; especialidade: string }>> {
  if (filters.audienceScope === 'medico_plantao') {
    const { data: plantaoRows, error: plantaoError } = await supabaseAdmin
      .from('escala_plantoes_confirmados')
      .select('profissional_id, usuarios_profissionais!inner(id, nome, especialidade, status)')
      .eq('status', 'confirmado')

    if (plantaoError) throw plantaoError

    const seen = new Set<string>()
    const result: Array<{ id: string; nome: string; especialidade: string }> = []

    for (const row of plantaoRows ?? []) {
      const profRaw = row.usuarios_profissionais
      const prof = (Array.isArray(profRaw) ? profRaw[0] : profRaw) as {
        id: string
        nome: string
        especialidade: string
        status: string
      } | null
      if (!prof || prof.status !== 'ativo') continue
      const id = String(prof.id)
      if (seen.has(id)) continue
      seen.add(id)
      result.push({ id, nome: String(prof.nome), especialidade: String(prof.especialidade) })
    }

    return result
  }

  let query = supabaseAdmin
    .from('usuarios_profissionais')
    .select('id, nome, especialidade')
    .eq('status', 'ativo')

  if (filters.audienceScope === 'medico_especialidade' && filters.specialtyFilter?.trim()) {
    query = query.ilike('especialidade', filters.specialtyFilter.trim())
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((row) => ({
    id: String(row.id),
    nome: String(row.nome),
    especialidade: String(row.especialidade),
  }))
}

async function loadAllEntidadeIds(): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('id')
    .in('status_cliente', ['ativa', 'suspensa', 'implantacao', 'sem_contrato'])

  if (error) throw error
  return (data ?? []).map((row) => String(row.id))
}

async function loadAllActiveUnitIds(): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('unidades_ubt')
    .select('id')
    .eq('status', 'ativo')

  if (error) throw error
  return (data ?? []).map((row) => String(row.id))
}

export async function resolveAdminBroadcastTarget(
  target: AdminBroadcastTargetInput,
): Promise<{ destinatarios: DestinatarioInsert[]; snapshot: AdminBroadcastTargetSnapshot }> {
  if (target.channel === 'medico') {
    if (target.mode === 'users') {
      const { data, error } = await supabaseAdmin
        .from('usuarios_profissionais')
        .select('id, nome, especialidade')
        .eq('status', 'ativo')
        .in('id', target.userIds)

      if (error) throw error
      const profissionais = data ?? []
      if (profissionais.length === 0) {
        throw new ComunicadosError('Nenhum profissional ativo encontrado.', 'NO_RECIPIENTS', 400)
      }

      return {
        destinatarios: profissionais.map((item) => ({
          tipo: 'profissional',
          profissionalId: String(item.id),
          rotuloDestinatario: String(item.nome),
        })),
        snapshot: {
          channel: 'medico',
          mode: 'users',
          userIds: target.userIds,
          recipientIds: [],
          recipientLabels: profissionais.slice(0, 5).map((item) => String(item.nome)),
          count: profissionais.length,
        },
      }
    }

    const profissionais = await loadActiveProfissionais({
      audienceScope: target.audienceScope,
      specialtyFilter: target.specialtyFilter,
    })

    return {
      destinatarios: profissionais.map((item) => ({
        tipo: 'profissional',
        profissionalId: item.id,
        rotuloDestinatario: item.nome,
      })),
      snapshot: {
        channel: 'medico',
        mode: 'all',
        audienceScope: target.audienceScope,
        specialtyFilter: target.specialtyFilter,
        recipientIds: [],
        recipientLabels: profissionais.slice(0, 5).map((item) => item.nome),
        count: profissionais.length,
      },
    }
  }

  if (target.channel === 'prefeitura') {
    let entidadeIds: string[] | undefined
    let userIds: string[] | undefined

    if (target.mode === 'all') {
      entidadeIds = await loadAllEntidadeIds()
    } else if (target.mode === 'selected') {
      entidadeIds = target.recipientIds ?? []
    } else {
      userIds = target.userIds ?? []
    }

    const users = await loadActivePrefeituraUsers({ entidadeIds, userIds })

    let recipientLabels: string[] = []
    if (target.mode === 'all' || target.mode === 'selected') {
      const { data } = await supabaseAdmin
        .from('entidades_contratantes')
        .select('id, nome_exibicao')
        .in('id', entidadeIds ?? [])
      recipientLabels = (data ?? []).map((row) => String(row.nome_exibicao))
    } else {
      recipientLabels = users.slice(0, 5).map((item) => item.nome)
    }

    return {
      destinatarios: users.map((item) => ({
        tipo: 'usuario_prefeitura',
        usuarioPrefeituraId: item.id,
        rotuloDestinatario: item.nome,
      })),
      snapshot: {
        channel: 'prefeitura',
        mode: target.mode,
        recipientIds: target.recipientIds ?? [],
        userIds: target.userIds,
        recipientLabels,
        count: users.length,
      },
    }
  }

  let unitIds: string[] | undefined
  let userIds: string[] | undefined

  if (target.mode === 'all') {
    unitIds = await loadAllActiveUnitIds()
  } else if (target.mode === 'selected') {
    unitIds = target.recipientIds ?? []
  } else {
    userIds = target.userIds ?? []
  }

  const users = await loadActiveUbtUsers({ unitIds, userIds })

  let recipientLabels: string[] = []
  if (target.mode === 'all' || target.mode === 'selected') {
    const { data } = await supabaseAdmin
      .from('unidades_ubt')
      .select('id, nome')
      .in('id', unitIds ?? [])
    recipientLabels = (data ?? []).map((row) => String(row.nome))
  } else {
    recipientLabels = users.slice(0, 5).map((item) => item.nome)
  }

  return {
    destinatarios: users.map((item) => ({
      tipo: 'usuario_ubt',
      usuarioUbtId: item.id,
      unidadeUbtId: item.unitId,
      rotuloDestinatario: item.nome,
    })),
    snapshot: {
      channel: 'ubt',
      mode: target.mode,
      recipientIds: target.recipientIds ?? [],
      userIds: target.userIds,
      recipientLabels,
      count: users.length,
    },
  }
}

export async function resolvePrefeituraBroadcastRecipients(input: {
  entidadeId: string
  unitIds: string[]
  recipientScope: 'ubt' | 'responsible' | 'operators'
  operatorIds?: string[]
}): Promise<{ destinatarios: DestinatarioInsert[]; audience: 'ubt_all' | 'ubt_responsible' | 'ubt_user'; summary: string }> {
  if (input.unitIds.length === 0) {
    throw new ComunicadosError('Selecione ao menos uma unidade.', 'INVALID_DATA', 400)
  }

  const { data: units, error: unitsError } = await supabaseAdmin
    .from('unidades_ubt')
    .select('id, nome')
    .eq('entidade_contratante_id', input.entidadeId)
    .eq('status', 'ativo')
    .in('id', input.unitIds)

  if (unitsError) throw unitsError
  if (!units?.length) {
    throw new ComunicadosError('Unidades inválidas para esta entidade.', 'INVALID_DATA', 400)
  }

  const validUnitIds = units.map((row) => String(row.id))

  let query = supabaseAdmin
    .from('usuarios_ubt')
    .select('id, nome, unidade_ubt_id, eh_responsavel_ubt')
    .eq('entidade_contratante_id', input.entidadeId)
    .eq('status', 'ativo')
    .in('unidade_ubt_id', validUnitIds)

  if (input.recipientScope === 'responsible') {
    query = query.eq('eh_responsavel_ubt', true)
  } else if (input.recipientScope === 'operators') {
    query = query.eq('eh_responsavel_ubt', false)
    if (input.operatorIds?.length) {
      query = query.in('id', input.operatorIds)
    }
  }

  const { data: users, error: usersError } = await query
  if (usersError) throw usersError

  const rows = users ?? []
  if (rows.length === 0) {
    throw new ComunicadosError(
      input.recipientScope === 'responsible'
        ? 'Nenhum responsável encontrado nas unidades selecionadas.'
        : input.recipientScope === 'operators'
          ? 'Nenhum operador encontrado nas unidades selecionadas.'
          : 'Nenhum usuário UBT encontrado nas unidades selecionadas.',
      'NO_RECIPIENTS',
      400,
    )
  }

  const audience =
    input.recipientScope === 'responsible'
      ? 'ubt_responsible'
      : input.recipientScope === 'operators'
        ? 'ubt_user'
        : 'ubt_all'

  const summary =
    input.recipientScope === 'ubt'
      ? `${validUnitIds.length} unidade${validUnitIds.length === 1 ? '' : 's'}`
      : `${rows.length} destinatário${rows.length === 1 ? '' : 's'}`

  return {
    audience,
    summary,
    destinatarios: rows.map((row) => ({
      tipo: 'usuario_ubt',
      usuarioUbtId: String(row.id),
      unidadeUbtId: row.unidade_ubt_id ? String(row.unidade_ubt_id) : null,
      rotuloDestinatario: String(row.nome),
    })),
  }
}

export async function resolveRedeUnitNotifyRecipients(
  entidadeId: string,
  unitId: string,
  scope: 'ubt' | 'responsible' | 'operators',
): Promise<{ destinatarios: DestinatarioInsert[]; audience: 'ubt_all' | 'ubt_responsible' | 'ubt_user'; summary: string; count: number }> {
  const resolved = await resolvePrefeituraBroadcastRecipients({
    entidadeId,
    unitIds: [unitId],
    recipientScope: scope,
  })

  return {
    destinatarios: resolved.destinatarios,
    audience: resolved.audience,
    summary: resolved.summary,
    count: resolved.destinatarios.length,
  }
}
