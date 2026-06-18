import { verifyAdminAuthorizationPin } from '../admin-auth/service.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { loadContratosBundleForEntidades, loadContratosForEntidade } from './contratos.service.js'
import { ClientesError } from './errors.js'
import {
  brlToCentavos,
  escapeIlikeTerm,
  mapEntidadeRow,
  normalizeCnpj,
  parseBrazilianDateToIso,
  serializeContact,
  serializeOptionalContact,
  type EntidadeRow,
} from './formatters.js'
import {
  deleteEntidadeFavicon,
  uploadEntidadeFavicon,
} from './favicon.service.js'
import { deleteEntidadeLogo, resolveLogoUrlsByEntityId, uploadEntidadeLogo } from './logo.service.js'
import {
  deleteEntidadeLoginBackground,
  resolveLoginBackgroundUrlsByEntityId,
  uploadEntidadeLoginBackground,
} from './loginBackground.service.js'
import {
  resolveFaviconUrlsByEntityId,
} from './favicon.service.js'
import { buildEntidadeBrandingDbPatch } from './entidadeBrandingPatch.js'
import { checkTenantSlugAvailability } from '../../lib/tenant/slugAvailability.js'
import { shouldLockEntidadeSlugOnStatus, slugLockedAtNow } from '../../lib/tenant/slugLock.js'
import type { AdminClienteRowDto } from './types.js'
import type {
  CreateContratoBody,
  CreateEntidadeBody,
  ListEntidadesQuery,
  UpdateEntidadeBody,
  UpdateEntidadeContactsBody,
  UpdateContratoBody,
} from './schemas.js'

const ENTIDADE_COLUMNS =
  'id, nome_exibicao, subtitulo, razao_social, cnpj, municipio, uf, status_cliente, slug, slug_locked_at, logo_hue, logo_storage_path, login_background_storage_path, favicon_storage_path, tipo_entidade, cor_primaria, nome_marca, terminologia, gestor, contato_contrato, contato_ti, contato_saude, atualizado_em'

export async function getClienteSlugAvailability(input: {
  value: string
  excludeEntidadeId?: string
  excludeUbtId?: string
}) {
  return checkTenantSlugAvailability(input)
}

export async function listClientesEntidades(
  queryParams: ListEntidadesQuery,
): Promise<AdminClienteRowDto[]> {
  let query = supabaseAdmin
    .from('entidades_contratantes')
    .select(ENTIDADE_COLUMNS)
    .order('nome_exibicao', { ascending: true })

  if (queryParams.tab === 'implantacao') {
    query = query.eq('status_cliente', 'implantacao')
  } else if (queryParams.tab === 'prospect') {
    query = query.eq('status_cliente', 'prospect')
  } else if (queryParams.tab === 'clientes') {
    query = query.in('status_cliente', ['ativa', 'suspensa', 'sem_contrato'])
  }

  if (queryParams.status && queryParams.status !== 'all') {
    query = query.eq('status_cliente', queryParams.status)
  }

  const search = queryParams.search?.trim()
  if (search) {
    const term = `%${escapeIlikeTerm(search)}%`
    query = query.or(
      `nome_exibicao.ilike.${term},razao_social.ilike.${term},municipio.ilike.${term},cnpj.ilike.${term}`,
    )
  }

  const { data, error } = await query
  if (error) throw error

  const entidades = (data ?? []) as EntidadeRow[]
  if (entidades.length === 0) return []

  const [logoUrls, loginBackgroundUrls, faviconUrls, contratosBundle] = await Promise.all([
    resolveLogoUrlsByEntityId(entidades),
    resolveLoginBackgroundUrlsByEntityId(entidades),
    resolveFaviconUrlsByEntityId(entidades),
    loadContratosBundleForEntidades(entidades.map((row) => row.id)),
  ])

  return entidades.map((row) =>
    mapEntidadeRow(
      row,
      contratosBundle.contratosByEntidade.get(row.id) ?? [],
      {
        logoUrl: logoUrls.get(row.id),
        loginBackgroundUrl: loginBackgroundUrls.get(row.id),
        faviconUrl: faviconUrls.get(row.id),
      },
    ),
  )
}

export async function getClienteEntidade(entidadeId: string): Promise<AdminClienteRowDto> {
  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select(ENTIDADE_COLUMNS)
    .eq('id', entidadeId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ClientesError('Entidade não encontrada.', 'NOT_FOUND', 404)
  }

  const row = data as EntidadeRow
  const [logoUrls, loginBackgroundUrls, faviconUrls, contratos] = await Promise.all([
    resolveLogoUrlsByEntityId([row]),
    resolveLoginBackgroundUrlsByEntityId([row]),
    resolveFaviconUrlsByEntityId([row]),
    loadContratosForEntidade(entidadeId),
  ])

  return mapEntidadeRow(row, contratos, {
    logoUrl: logoUrls.get(row.id),
    loginBackgroundUrl: loginBackgroundUrls.get(row.id),
    faviconUrl: faviconUrls.get(row.id),
  })
}

export async function createClienteEntidade(
  adminId: string,
  input: CreateEntidadeBody,
): Promise<AdminClienteRowDto> {
  await verifyAdminAuthorizationPin(adminId, input.pin)

  const cnpj = normalizeCnpj(input.cnpj)
  if (cnpj.length !== 14) {
    throw new ClientesError('CNPJ inválido.', 'INVALID_DATA', 400)
  }

  await assertEntidadeCnpjAvailable(cnpj)
  await assertEntidadeSlugAvailable(input.slug)

  let entidadeId: string | null = null

  try {
    const { data, error } = await supabaseAdmin
      .from('entidades_contratantes')
      .insert({
        nome_exibicao: input.nome.trim(),
        subtitulo: input.subtitulo.trim(),
        razao_social: input.razaoSocial.trim(),
        cnpj,
        municipio: input.municipio.trim(),
        uf: input.uf.trim().toUpperCase(),
        slug: input.slug,
        ...(shouldLockEntidadeSlugOnStatus(input.status)
          ? { slug_locked_at: slugLockedAtNow() }
          : {}),
        status: 'ativo',
        status_cliente: input.status,
        logo_hue: input.logoHue ?? 180,
        gestor: serializeOptionalContact(input.gestor),
        contato_contrato: input.contatoContrato ? serializeContact(input.contatoContrato) : null,
        contato_ti: serializeOptionalContact(input.contatoTi),
        contato_saude: serializeOptionalContact(input.contatoSaude),
        ...buildEntidadeBrandingDbPatch({
          tipoEntidade: input.tipoEntidade,
          corPrimaria: input.corPrimaria,
          nomeMarca: input.nomeMarca,
          terminologia: input.terminologia,
        }),
      })
      .select(ENTIDADE_COLUMNS)
      .single()

    if (error) throw error

    const row = data as EntidadeRow
    entidadeId = row.id

    if (input.logoDataUrl) {
      await uploadEntidadeLogo(row.id, input.logoDataUrl)
    }

    if (input.loginBackgroundDataUrl) {
      await uploadEntidadeLoginBackground(row.id, input.loginBackgroundDataUrl)
    }

    if (input.faviconDataUrl) {
      await uploadEntidadeFavicon(row.id, input.faviconDataUrl)
    }

    return getClienteEntidade(row.id)
  } catch (error) {
    if (entidadeId) {
      await supabaseAdmin.from('entidades_contratantes').delete().eq('id', entidadeId)
    }
    throw error
  }
}

async function assertEntidadeSlugAvailable(slug: string, excludeEntidadeId?: string): Promise<void> {
  const availability = await checkTenantSlugAvailability({
    value: slug,
    excludeEntidadeId,
  })

  if (!availability.available) {
    throw new ClientesError(
      availability.reason ?? 'Endereço público indisponível.',
      'DUPLICATE_SLUG',
      409,
    )
  }
}

async function assertEntidadeCnpjAvailable(cnpj: string, excludeEntidadeId?: string): Promise<void> {
  let query = supabaseAdmin.from('entidades_contratantes').select('id').eq('cnpj', cnpj).limit(1)

  if (excludeEntidadeId) {
    query = query.neq('id', excludeEntidadeId)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  if (data) {
    throw new ClientesError(
      'Já existe um cliente cadastrado com este CNPJ.',
      'DUPLICATE_CNPJ',
      409,
    )
  }
}

export async function updateClienteEntidade(
  adminId: string,
  entidadeId: string,
  input: UpdateEntidadeBody,
): Promise<AdminClienteRowDto> {
  await verifyAdminAuthorizationPin(adminId, input.pin)

  const cnpj = normalizeCnpj(input.cnpj)
  if (cnpj.length !== 14) {
    throw new ClientesError('CNPJ inválido.', 'INVALID_DATA', 400)
  }

  await assertEntidadeCnpjAvailable(cnpj, entidadeId)

  await assertEntidadeCnpjAvailable(cnpj, entidadeId)

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('slug, slug_locked_at')
    .eq('id', entidadeId)
    .maybeSingle()

  if (existingError) throw existingError
  if (!existing) {
    throw new ClientesError('Entidade não encontrada.', 'NOT_FOUND', 404)
  }

  if (input.slug && input.slug !== existing.slug) {
    if (existing.slug_locked_at) {
      throw new ClientesError(
        'O endereço público não pode ser alterado após a publicação.',
        'INVALID_DATA',
        400,
      )
    }
    await assertEntidadeSlugAvailable(input.slug, entidadeId)
  }

  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .update({
      nome_exibicao: input.nome.trim(),
      subtitulo: input.subtitulo.trim(),
      razao_social: input.razaoSocial.trim(),
      cnpj,
      municipio: input.municipio.trim(),
      uf: input.uf.trim().toUpperCase(),
      ...(input.slug ? { slug: input.slug } : {}),
      ...(input.logoHue != null ? { logo_hue: input.logoHue } : {}),
      ...buildEntidadeBrandingDbPatch({
        tipoEntidade: input.tipoEntidade,
        corPrimaria: input.corPrimaria,
        nomeMarca: input.nomeMarca,
        terminologia: input.terminologia,
      }),
    })
    .eq('id', entidadeId)
    .select(ENTIDADE_COLUMNS)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ClientesError('Entidade não encontrada.', 'NOT_FOUND', 404)
  }

  if (input.logoDataUrl) {
    await uploadEntidadeLogo(entidadeId, input.logoDataUrl)
  }

  if (input.loginBackgroundDataUrl) {
    await uploadEntidadeLoginBackground(entidadeId, input.loginBackgroundDataUrl)
  }

  if (input.faviconDataUrl) {
    await uploadEntidadeFavicon(entidadeId, input.faviconDataUrl)
  }

  return getClienteEntidade(entidadeId)
}

export async function updateClienteEntidadeStatus(
  adminId: string,
  entidadeId: string,
  pin: string,
  status: CreateEntidadeBody['status'],
): Promise<AdminClienteRowDto> {
  await verifyAdminAuthorizationPin(adminId, pin)

  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .update({
      status_cliente: status,
      ...(shouldLockEntidadeSlugOnStatus(status) ? { slug_locked_at: slugLockedAtNow() } : {}),
    })
    .eq('id', entidadeId)
    .select(ENTIDADE_COLUMNS)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ClientesError('Entidade não encontrada.', 'NOT_FOUND', 404)
  }

  return getClienteEntidade(entidadeId)
}

export async function updateClienteEntidadeContacts(
  adminId: string,
  entidadeId: string,
  input: UpdateEntidadeContactsBody,
): Promise<AdminClienteRowDto> {
  await verifyAdminAuthorizationPin(adminId, input.pin)

  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .update({
      gestor: serializeContact(input.gestor),
      contato_contrato: input.contatoContrato ? serializeContact(input.contatoContrato) : null,
      contato_ti: serializeContact(input.contatoTi),
      contato_saude: serializeContact(input.contatoSaude),
    })
    .eq('id', entidadeId)
    .select(ENTIDADE_COLUMNS)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ClientesError('Entidade não encontrada.', 'NOT_FOUND', 404)
  }

  return getClienteEntidade(entidadeId)
}

export async function deleteClienteEntidade(
  adminId: string,
  entidadeId: string,
  pin: string,
): Promise<void> {
  await verifyAdminAuthorizationPin(adminId, pin)

  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('id, logo_storage_path, login_background_storage_path, favicon_storage_path')
    .eq('id', entidadeId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ClientesError('Entidade não encontrada.', 'NOT_FOUND', 404)
  }

  const { error: rpcError } = await supabaseAdmin.rpc('excluir_entidade_cliente', {
    p_entidade_id: entidadeId,
  })

  if (rpcError) throw rpcError

  await deleteEntidadeLogo(data.logo_storage_path ? String(data.logo_storage_path) : null)
  await deleteEntidadeLoginBackground(
    data.login_background_storage_path ? String(data.login_background_storage_path) : null,
  )
  await deleteEntidadeFavicon(
    data.favicon_storage_path ? String(data.favicon_storage_path) : null,
  )
}

export async function createClienteContrato(
  adminId: string,
  entidadeId: string,
  input: CreateContratoBody,
): Promise<AdminClienteRowDto> {
  await verifyAdminAuthorizationPin(adminId, input.pin)

  await assertContratoCommercialDataValid(input)

  const payload = buildContratoRpcPayload(entidadeId, input)

  const { data: contratoId, error } = await supabaseAdmin.rpc('criar_contrato_entidade_cliente', {
    p_payload: payload,
  })

  if (error) throw error
  if (!contratoId) {
    throw new ClientesError('Não foi possível criar o contrato.', 'INVALID_DATA', 400)
  }

  if (input.contatoContrato) {
    const { error: contactError } = await supabaseAdmin
      .from('entidades_contratantes')
      .update({ contato_contrato: serializeContact(input.contatoContrato) })
      .eq('id', entidadeId)

    if (contactError) throw contactError
  }

  return getClienteEntidade(entidadeId)
}

export async function updateClienteContrato(
  adminId: string,
  contratoId: string,
  input: UpdateContratoBody,
): Promise<AdminClienteRowDto> {
  await verifyAdminAuthorizationPin(adminId, input.pin)

  const { data: contratoRow, error: contratoError } = await supabaseAdmin
    .from('contratos_entidade')
    .select('id, entidade_contratante_id')
    .eq('id', contratoId)
    .maybeSingle()

  if (contratoError) throw contratoError
  if (!contratoRow) {
    throw new ClientesError('Contrato não encontrado.', 'NOT_FOUND', 404)
  }

  await assertContratoCommercialDataValid(input)

  const payload = buildContratoUpdateRpcPayload(input)

  const { data: updatedId, error } = await supabaseAdmin.rpc('atualizar_contrato_entidade_cliente', {
    p_contrato_id: contratoId,
    p_payload: payload,
  })

  if (error) throw error
  if (!updatedId) {
    throw new ClientesError('Não foi possível atualizar o contrato.', 'INVALID_DATA', 400)
  }

  return getClienteEntidade(String(contratoRow.entidade_contratante_id))
}

export async function updateClienteContratoStatus(
  adminId: string,
  contratoId: string,
  pin: string,
  action: 'suspender' | 'reativar' | 'encerrar',
): Promise<AdminClienteRowDto> {
  await verifyAdminAuthorizationPin(adminId, pin)

  const statusMap = {
    suspender: 'suspenso',
    reativar: 'ativo',
    encerrar: 'encerrado',
  } as const

  const { data, error } = await supabaseAdmin
    .from('contratos_entidade')
    .update({ status: statusMap[action] })
    .eq('id', contratoId)
    .select('entidade_contratante_id')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ClientesError('Contrato não encontrado.', 'NOT_FOUND', 404)
  }

  return getClienteEntidade(String(data.entidade_contratante_id))
}

export async function deleteClienteContrato(
  adminId: string,
  contratoId: string,
  pin: string,
): Promise<AdminClienteRowDto> {
  await verifyAdminAuthorizationPin(adminId, pin)

  const { data, error } = await supabaseAdmin
    .from('contratos_entidade')
    .select('entidade_contratante_id')
    .eq('id', contratoId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ClientesError('Contrato não encontrado.', 'NOT_FOUND', 404)
  }

  const entidadeId = String(data.entidade_contratante_id)

  const { error: deleteError } = await supabaseAdmin
    .from('contratos_entidade')
    .delete()
    .eq('id', contratoId)

  if (deleteError) throw deleteError

  return getClienteEntidade(entidadeId)
}

function buildContratoRpcPayload(entidadeId: string, input: CreateContratoBody) {
  return {
    entidadeId,
    status: 'ativo',
    ...buildContratoCommercialRpcPayload(input),
  }
}

function buildContratoUpdateRpcPayload(input: UpdateContratoBody) {
  return buildContratoCommercialRpcPayload(input)
}

function buildContratoCommercialRpcPayload(
  input: Pick<
    CreateContratoBody,
    | 'numero'
    | 'tipo'
    | 'dataAssinatura'
    | 'dataEncerramento'
    | 'consultasContratadas'
    | 'permiteUltrapassar'
    | 'aceitaPacientesOutrosMunicipios'
    | 'especialidadesAutorizadas'
    | 'precosPorProfissao'
    | 'precosPorEspecialidade'
    | 'excedentePrecosPorProfissao'
    | 'excedentePrecosPorEspecialidade'
  >,
) {
  const dataEncerramento =
    input.dataEncerramento && input.dataEncerramento.trim()
      ? parseBrazilianDateToIso(input.dataEncerramento)
      : null

  return {
    numero: input.numero?.trim() ?? '',
    tipo: input.tipo,
    dataAssinatura: parseBrazilianDateToIso(input.dataAssinatura),
    dataEncerramento,
    consultasContratadas:
      input.consultasContratadas == null ? null : String(input.consultasContratadas),
    permiteUltrapassar: input.permiteUltrapassar,
    aceitaPacientesOutrosMunicipios: input.aceitaPacientesOutrosMunicipios ?? false,
    especialidadesAutorizadas: input.especialidadesAutorizadas,
    precosProfissao: [
      ...input.precosPorProfissao.map((item) => ({
        professionId: item.professionId,
        tipo: 'contratado',
        valorCentavos: brlToCentavos(item.valorConsulta),
      })),
      ...(input.excedentePrecosPorProfissao ?? []).map((item) => ({
        professionId: item.professionId,
        tipo: 'excedente',
        valorCentavos: brlToCentavos(item.valorConsulta),
      })),
    ],
    precosEspecialidade: [
      ...input.precosPorEspecialidade.map((item) => ({
        specialtyId: item.specialtyId,
        tipo: 'contratado',
        valorCentavos: brlToCentavos(item.valorConsulta),
      })),
      ...(input.excedentePrecosPorEspecialidade ?? []).map((item) => ({
        specialtyId: item.specialtyId,
        tipo: 'excedente',
        valorCentavos: brlToCentavos(item.valorConsulta),
      })),
    ],
  }
}

async function assertContratoCommercialDataValid(
  input: Pick<
    CreateContratoBody,
    | 'tipo'
    | 'especialidadesAutorizadas'
    | 'precosPorProfissao'
    | 'precosPorEspecialidade'
    | 'excedentePrecosPorProfissao'
    | 'excedentePrecosPorEspecialidade'
  >,
): Promise<void> {
  const { data: tipoRow, error: tipoError } = await supabaseAdmin
    .from('config_tipos_contrato')
    .select('id')
    .eq('id', input.tipo)
    .eq('ativo', true)
    .maybeSingle()

  if (tipoError) throw tipoError
  if (!tipoRow) {
    throw new ClientesError('Tipo de contrato inválido ou inativo.', 'INVALID_DATA', 400)
  }

  const specialtyIds = new Set<string>([
    ...input.especialidadesAutorizadas,
    ...input.precosPorEspecialidade.map((item) => item.specialtyId),
    ...(input.excedentePrecosPorEspecialidade ?? []).map((item) => item.specialtyId),
  ])

  if (specialtyIds.size > 0) {
    const { data: specialtyRows, error: specialtyError } = await supabaseAdmin
      .from('config_especialidades')
      .select('id')
      .in('id', [...specialtyIds])
      .eq('ativo', true)

    if (specialtyError) throw specialtyError

    const activeSpecialtyIds = new Set((specialtyRows ?? []).map((row) => String(row.id)))
    const invalidSpecialty = [...specialtyIds].find((id) => !activeSpecialtyIds.has(id))
    if (invalidSpecialty) {
      throw new ClientesError(
        'Especialidade inválida ou inativa no catálogo clínico.',
        'INVALID_DATA',
        400,
      )
    }
  }

  const professionIds = new Set<string>([
    ...input.precosPorProfissao.map((item) => item.professionId),
    ...(input.excedentePrecosPorProfissao ?? []).map((item) => item.professionId),
  ])

  if (professionIds.size > 0) {
    const { data: professionRows, error: professionError } = await supabaseAdmin
      .from('config_profissoes')
      .select('id')
      .in('id', [...professionIds])
      .eq('ativo', true)

    if (professionError) throw professionError

    const activeProfessionIds = new Set((professionRows ?? []).map((row) => String(row.id)))
    const invalidProfession = [...professionIds].find((id) => !activeProfessionIds.has(id))
    if (invalidProfession) {
      throw new ClientesError(
        'Profissão inválida ou inativa no catálogo clínico.',
        'INVALID_DATA',
        400,
      )
    }
  }
}
