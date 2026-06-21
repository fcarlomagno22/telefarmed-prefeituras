import { normalizeCpf, isValidCpf } from '../../lib/cpf.js'
import { isValidCns, normalizeCns } from '../../lib/cns.js'
import { parseTipoEntidade } from '../../lib/entidadeBranding/terminology.js'
import {
  resolveAceitaPacientesOutrosMunicipios,
} from '../../lib/entidadeBranding/tipo.js'
import {
  addressMatchesEntityTerritory,
  buildTerritoryMismatchMessage,
  PATIENT_TERRITORY_MISMATCH_SUBJECT,
} from '../../lib/municipalityTerritory.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { enrichEnderecoWithMunicipioIbge } from '../../lib/municipiosIbge.js'
import { resolvePacienteFotoPublicUrl, hydratePatientAvatarUrls } from '../../lib/pacienteFoto.js'
import { PacientesError } from './errors.js'
import {
  buildContactsFromInput,
  buildConsentimentoFromInput,
  buildEnderecoFromInput,
  buildResponsavelFromInput,
  escapeIlikeTerm,
  genderToSexo,
  mapListagemToDetail,
  mapListagemToPatient,
  parseBirthDateToIso,
  readEnderecoField,
  type ConsultaRow,
  type ListagemRow,
  type UbtVinculoRow,
} from './formatters.js'
import type {
  AdminMunicipalPatientDetailDto,
  AdminMunicipalPatientDto,
  AdminPatientContractingEntityDto,
  CreatePacienteInput,
  ListPacientesQuery,
  UpdatePacienteInput,
} from './types.js'

function applyListFilters(
  params: ListPacientesQuery,
) {
  let query = supabaseAdmin
    .from('vw_admin_pacientes_listagem')
    .select('*')
    .order('criado_em', { ascending: false })

  if (params.entidadeContratanteId) {
    query = query.eq('entidade_contratante_id', params.entidadeContratanteId)
  }
  if (params.municipio) {
    query = query.eq('municipio', params.municipio)
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }
  if (params.contractStatus && params.contractStatus !== 'all') {
    query = query.eq('contrato_ativo', params.contractStatus === 'ativo')
  }
  if (params.cpf) {
    query = query.eq('cpf', normalizeCpf(params.cpf))
  }
  if (params.search?.trim()) {
    const term = `%${escapeIlikeTerm(params.search.trim())}%`
    query = query.or(
      `nome.ilike.${term},cpf.ilike.${term},municipio.ilike.${term},entidade_razao_social.ilike.${term}`,
    )
  }

  return query
}

async function loadConsultationStats(
  pacienteIds: string[],
): Promise<Map<string, { totalAppointments: number; lastAppointmentIso: string | null }>> {
  const stats = new Map<string, { totalAppointments: number; lastAppointmentIso: string | null }>()
  if (pacienteIds.length === 0) return stats

  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select('paciente_id, criado_em, finalizada_em, status')
    .in('paciente_id', pacienteIds)
    .order('criado_em', { ascending: false })

  if (error) {
    if (error.code === 'PGRST205') return stats
    throw error
  }

  for (const row of data ?? []) {
    const pacienteId = String(row.paciente_id)
    const current = stats.get(pacienteId) ?? { totalAppointments: 0, lastAppointmentIso: null }
    current.totalAppointments += 1
    if (!current.lastAppointmentIso) {
      current.lastAppointmentIso = String(row.finalizada_em ?? row.criado_em)
    }
    stats.set(pacienteId, current)
  }

  return stats
}

export async function listPacientes(params: ListPacientesQuery = {}): Promise<AdminMunicipalPatientDto[]> {
  const { data, error } = await applyListFilters(params)
  if (error) throw error

  const rows = (data ?? []) as ListagemRow[]
  const statsMap = await loadConsultationStats(rows.map((row) => row.id))

  const patients = rows.map((row) => mapListagemToPatient(row, statsMap.get(row.id)))
  return hydratePatientAvatarUrls(rows, patients)
}

async function fetchListagemRow(id: string): Promise<ListagemRow> {
  const { data, error } = await supabaseAdmin
    .from('vw_admin_pacientes_listagem')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new PacientesError('Paciente não encontrado.', 'NOT_FOUND', 404)
  return data as ListagemRow
}

async function fetchUbtVinculos(
  pacienteId: string,
  fallback: { municipio: string; uf: string },
): Promise<UbtVinculoRow[]> {
  const { data, error } = await supabaseAdmin
    .from('paciente_vinculos_ubt')
    .select('id, principal, unidade_ubt_id, unidades_ubt!inner(nome)')
    .eq('paciente_id', pacienteId)

  if (error) throw error

  return (data ?? []).map((row) => {
    const unidade = row.unidades_ubt as unknown as { nome: string }
    return {
      id: String(row.id),
      principal: Boolean(row.principal),
      unidade_ubt_id: String(row.unidade_ubt_id),
      nome: unidade.nome,
      municipio: fallback.municipio,
      uf: fallback.uf,
    }
  })
}

async function fetchConsultations(pacienteId: string): Promise<ConsultaRow[]> {
  const { data, error } = await supabaseAdmin
    .from('vw_consultas_operacional')
    .select(
      'id, codigo_atendimento, status, criado_em, finalizada_em, especialidade_nome, profissional_nome, unidade_nome',
    )
    .eq('paciente_id', pacienteId)
    .order('criado_em', { ascending: false })
    .limit(50)

  if (error) {
    if (error.code === 'PGRST205') return []
    throw error
  }
  return (data ?? []) as ConsultaRow[]
}

export async function getPacienteDetail(id: string): Promise<AdminMunicipalPatientDetailDto> {
  const row = await fetchListagemRow(id)
  const [ubts, consultations, statsMap] = await Promise.all([
    fetchUbtVinculos(id, { municipio: row.municipio, uf: row.uf }),
    fetchConsultations(id),
    loadConsultationStats([id]),
  ])

  const detail = mapListagemToDetail(row, {
    ubts,
    consultations,
    stats: statsMap.get(id),
  })

  if (detail.avatarUrl) {
    detail.avatarUrl =
      (await resolvePacienteFotoPublicUrl(detail.avatarUrl)) ?? detail.avatarUrl
  }

  return detail
}

export async function findPacienteByCpf(
  cpf: string,
  entidadeContratanteId?: string,
): Promise<AdminMunicipalPatientDto | null> {
  let query = supabaseAdmin
    .from('vw_admin_pacientes_listagem')
    .select('*')
    .eq('cpf', normalizeCpf(cpf))
    .limit(1)

  if (entidadeContratanteId) {
    query = query.eq('entidade_contratante_id', entidadeContratanteId)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  if (!data) return null

  const row = data as ListagemRow
  const statsMap = await loadConsultationStats([row.id])
  const [patient] = await hydratePatientAvatarUrls(
    [row],
    [mapListagemToPatient(row, statsMap.get(row.id))],
  )
  return patient
}

export async function findPacienteByCns(
  cns: string,
  entidadeContratanteId?: string,
): Promise<AdminMunicipalPatientDto | null> {
  const normalized = normalizeCns(cns)
  if (!normalized) return null

  let query = supabaseAdmin
    .from('vw_admin_pacientes_listagem')
    .select('*')
    .eq('cns', normalized)
    .limit(1)

  if (entidadeContratanteId) {
    query = query.eq('entidade_contratante_id', entidadeContratanteId)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  if (!data) return null

  const row = data as ListagemRow
  const statsMap = await loadConsultationStats([row.id])
  const [patient] = await hydratePatientAvatarUrls(
    [row],
    [mapListagemToPatient(row, statsMap.get(row.id))],
  )
  return patient
}

async function assertNoDuplicatePaciente(
  entidadeContratanteId: string,
  cpf: string,
  cns: string | null | undefined,
  excludePacienteId?: string,
): Promise<void> {
  const existingCpf = await findPacienteByCpf(cpf, entidadeContratanteId)
  if (existingCpf && existingCpf.id !== excludePacienteId) {
    throw new PacientesError(
      'Já existe um paciente com este CPF nesta entidade contratante.',
      'DUPLICATE_CPF',
      409,
    )
  }

  const normalizedCns = cns ? normalizeCns(cns) : ''
  if (!normalizedCns) return

  const existingCns = await findPacienteByCns(normalizedCns, entidadeContratanteId)
  if (existingCns && existingCns.id !== excludePacienteId) {
    throw new PacientesError(
      'Já existe um paciente com este CNS nesta entidade contratante.',
      'DUPLICATE_CNS',
      409,
    )
  }
}

function resolveCnsFields(input: { cns?: string; cnsPendente?: boolean; cpf?: string }) {
  if (input.cnsPendente) {
    return { cns: null, cns_pendente: true }
  }

  const normalized = normalizeCns(input.cns ?? '')
  if (!normalized) {
    const cpfDigits = normalizeCpf(input.cpf ?? '')
    if (cpfDigits.length === 11 && isValidCpf(cpfDigits)) {
      return { cns: null, cns_pendente: false }
    }

    throw new PacientesError(
      'Informe o CNS/Cartão SUS ou marque como pendência.',
      'INVALID_DATA',
      400,
    )
  }

  if (!isValidCns(normalized)) {
    throw new PacientesError('CNS/Cartão SUS inválido.', 'INVALID_DATA', 400)
  }

  return { cns: normalized, cns_pendente: false }
}

export async function listContractingEntities(): Promise<AdminPatientContractingEntityDto[]> {
  const { data: entidades, error: entidadesError } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('id, razao_social, municipio, uf, tipo_entidade')
    .order('municipio', { ascending: true })

  if (entidadesError) throw entidadesError

  const { data: contratos, error: contratosError } = await supabaseAdmin
    .from('contratos_entidade')
    .select('entidade_contratante_id, status, aceita_pacientes_outros_municipios')
    .eq('status', 'ativo')

  if (contratosError) throw contratosError

  const activeContractByEntity = new Map<string, boolean>()
  for (const row of contratos ?? []) {
    activeContractByEntity.set(
      String(row.entidade_contratante_id),
      Boolean(row.aceita_pacientes_outros_municipios),
    )
  }

  return (entidades ?? []).map((row) => {
    const entityId = String(row.id)
    const hasActiveContract = activeContractByEntity.has(entityId)
    const tipoEntidade = parseTipoEntidade(row.tipo_entidade)
    const aceitaContrato = activeContractByEntity.get(entityId) ?? false

    return {
      id: entityId,
      razaoSocial: String(row.razao_social),
      municipality: String(row.municipio),
      uf: String(row.uf),
      contractStatus: hasActiveContract ? 'ativo' : 'encerrado',
      tipoEntidade,
      aceitaPacientesOutrosMunicipios: resolveAceitaPacientesOutrosMunicipios(
        tipoEntidade,
        aceitaContrato,
      ),
    }
  })
}

export async function getEntityPatientTerritoryPolicy(entidadeContratanteId: string) {
  const { data: entity, error: entityError } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('municipio, uf, tipo_entidade')
    .eq('id', entidadeContratanteId)
    .maybeSingle()

  if (entityError) throw entityError
  if (!entity) {
    throw new PacientesError('Entidade contratante não encontrada.', 'NOT_FOUND', 404)
  }

  const { data: contrato, error: contratoError } = await supabaseAdmin
    .from('contratos_entidade')
    .select('aceita_pacientes_outros_municipios')
    .eq('entidade_contratante_id', entidadeContratanteId)
    .eq('status', 'ativo')
    .order('data_assinatura', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (contratoError) throw contratoError

  const tipoEntidade = parseTipoEntidade(entity.tipo_entidade)
  const aceitaContrato = Boolean(contrato?.aceita_pacientes_outros_municipios ?? false)

  return {
    municipio: String(entity.municipio),
    uf: String(entity.uf),
    tipoEntidade,
    aceitaPacientesOutrosMunicipios: resolveAceitaPacientesOutrosMunicipios(
      tipoEntidade,
      aceitaContrato,
    ),
  }
}

function assertPatientAddressInEntityTerritory(
  territory: { municipio: string; uf: string },
  input: { city?: string; state?: string },
): void {
  const city = input.city?.trim()
  const state = input.state?.trim()

  if (!city || !state) {
    throw new PacientesError(
      'Informe o endereço completo do paciente no município contratante.',
      'INVALID_DATA',
      400,
    )
  }

  if (!addressMatchesEntityTerritory(city, state, territory.municipio, territory.uf)) {
    throw new PacientesError(
      buildTerritoryMismatchMessage(
        territory.municipio,
        territory.uf,
        city,
        state,
        { subject: PATIENT_TERRITORY_MISMATCH_SUBJECT },
      ),
      'INVALID_DATA',
      400,
    )
  }
}

function buildPacienteInsertRow(input: CreatePacienteInput) {
  const cpf = normalizeCpf(input.cpf)
  const birthDate = parseBirthDateToIso(input.birthDate)
  const cnsFields = resolveCnsFields({ ...input, cpf: input.cpf })

  return {
    cpf,
    nome: input.fullName.trim(),
    nome_social: input.socialName?.trim() || null,
    data_nascimento: birthDate,
    sexo: genderToSexo(input.gender),
    nacionalidade: input.nationality,
    raca_cor: input.raceColor,
    cns: cnsFields.cns,
    cns_pendente: cnsFields.cns_pendente,
    telefone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    endereco: buildEnderecoFromInput(input),
    contato_emergencia: buildContactsFromInput(input.contacts),
    responsavel: buildResponsavelFromInput(input),
    consentimento_cadastro: buildConsentimentoFromInput(input.registrationConsent),
    foto_url: input.photoDataUrl?.trim() || null,
    entidade_contratante_id: input.entidadeContratanteId,
    status: input.status ?? 'ativo',
  }
}

async function ensureUbtVinculo(pacienteId: string, unidadeUbtId?: string) {
  if (!unidadeUbtId) return

  const { error } = await supabaseAdmin.from('paciente_vinculos_ubt').upsert(
    {
      paciente_id: pacienteId,
      unidade_ubt_id: unidadeUbtId,
      principal: true,
    },
    { onConflict: 'paciente_id,unidade_ubt_id' },
  )

  if (error) throw error
}

export async function createPaciente(input: CreatePacienteInput): Promise<AdminMunicipalPatientDetailDto> {
  const policy = await getEntityPatientTerritoryPolicy(input.entidadeContratanteId)
  if (!policy.aceitaPacientesOutrosMunicipios) {
    assertPatientAddressInEntityTerritory(
      { municipio: policy.municipio, uf: policy.uf },
      input,
    )
  }

  const insertRow = buildPacienteInsertRow(input)
  await assertNoDuplicatePaciente(
    input.entidadeContratanteId,
    insertRow.cpf,
    insertRow.cns,
  )

  const { data, error } = await supabaseAdmin
    .from('pacientes')
    .insert(insertRow)
    .select('id')
    .single()

  if (error) throw error

  const pacienteId = String(data.id)
  await ensureUbtVinculo(pacienteId, input.unidadeUbtId)
  return getPacienteDetail(pacienteId)
}

export async function updatePaciente(
  id: string,
  input: UpdatePacienteInput,
): Promise<AdminMunicipalPatientDetailDto> {
  const current = await fetchListagemRow(id)
  const patch: Record<string, unknown> = {}

  if (input.fullName?.trim()) patch.nome = input.fullName.trim()
  if (input.socialName !== undefined) patch.nome_social = input.socialName.trim() || null
  if (input.birthDate) patch.data_nascimento = parseBirthDateToIso(input.birthDate)
  if (input.gender) patch.sexo = genderToSexo(input.gender)
  if (input.nationality) patch.nacionalidade = input.nationality
  if (input.raceColor) patch.raca_cor = input.raceColor
  if (input.phone !== undefined) patch.telefone = input.phone.trim() || null
  if (input.email !== undefined) patch.email = input.email.trim() || null
  if (input.photoDataUrl !== undefined) patch.foto_url = input.photoDataUrl.trim() || null

  if (input.cns !== undefined || input.cnsPendente !== undefined) {
    const cnsFields = resolveCnsFields({
      cns: input.cns,
      cnsPendente: input.cnsPendente,
      cpf: current.cpf,
    })
    patch.cns = cnsFields.cns
    patch.cns_pendente = cnsFields.cns_pendente
    await assertNoDuplicatePaciente(
      current.entidade_contratante_id,
      current.cpf,
      cnsFields.cns,
      id,
    )
  }

  const endereco = enrichEnderecoWithMunicipioIbge({
    ...Object.fromEntries(
      Object.entries(current.endereco ?? {}).map(([key, value]) => [key, String(value ?? '')]),
    ),
    ...buildEnderecoFromInput(input),
  })
  if (Object.keys(endereco).length > 0) patch.endereco = endereco

  if (input.contacts) {
    patch.contato_emergencia = buildContactsFromInput(input.contacts)
  }

  if (
    input.guardianName !== undefined ||
    input.guardianCpf !== undefined ||
    input.guardianRelationship !== undefined ||
    input.guardianPhone !== undefined ||
    input.guardianAttendanceAuthorized !== undefined
  ) {
    const existingResponsavel = (current.responsavel ?? {}) as Record<string, unknown>
    patch.responsavel = buildResponsavelFromInput({
      guardianName:
        input.guardianName ??
        String(existingResponsavel.name ?? existingResponsavel.nome ?? '').trim(),
      guardianCpf:
        input.guardianCpf ?? String(existingResponsavel.cpf ?? '').trim(),
      guardianRelationship:
        input.guardianRelationship ??
        String(
          existingResponsavel.parentesco ?? existingResponsavel.relationship ?? '',
        ).trim(),
      guardianPhone:
        input.guardianPhone ??
        String(existingResponsavel.telefone ?? existingResponsavel.phone ?? '').trim(),
      guardianAttendanceAuthorized:
        input.guardianAttendanceAuthorized ??
        Boolean(
          existingResponsavel.autorizacao_atendimento ??
            existingResponsavel.attendanceAuthorized,
        ),
    })
  }

  if (input.registrationConsent) {
    patch.consentimento_cadastro = buildConsentimentoFromInput(input.registrationConsent)
  }

  if (input.city !== undefined || input.state !== undefined) {
    const policy = await getEntityPatientTerritoryPolicy(current.entidade_contratante_id)
    if (!policy.aceitaPacientesOutrosMunicipios) {
      const city = input.city?.trim() || readEnderecoField(current.endereco, 'cidade') || current.municipio
      const state = input.state?.trim() || readEnderecoField(current.endereco, 'uf') || current.uf
      assertPatientAddressInEntityTerritory(
        { municipio: policy.municipio, uf: policy.uf },
        { city, state },
      )
    }
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await supabaseAdmin.from('pacientes').update(patch).eq('id', id)
    if (error) throw error
  }

  return getPacienteDetail(id)
}

export async function inactivatePaciente(id: string): Promise<AdminMunicipalPatientDetailDto> {
  const { error } = await supabaseAdmin
    .from('pacientes')
    .update({ status: 'inativo' })
    .eq('id', id)

  if (error) throw error
  return getPacienteDetail(id)
}

export async function exportPacientesCsv(params: ListPacientesQuery = {}): Promise<string> {
  const rows = await listPacientes(params)
  const lines = [
    'id,nome,cpf,municipio,statusContrato',
    ...rows.map(
      (row) =>
        `${row.id},${row.name.replace(/,/g, ' ')},${row.cpf},${row.municipality},${row.contractStatus}`,
    ),
  ]
  return lines.join('\n')
}
