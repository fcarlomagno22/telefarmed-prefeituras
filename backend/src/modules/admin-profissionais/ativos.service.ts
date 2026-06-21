import { normalizeCpf } from '../../lib/cpf.js'
import {
  resolveEspecialidadeIdByName,
  resolveFormacaoEspecialidadeId,
} from '../../lib/config-clinico/formacao-especialidade.js'
import { ProfissionalCadastroError } from '../profissional-cadastro/errors.js'
import { buildProfissionalCboFields } from '../../lib/faturamento/formacaoCbo.js'
import { hashPassword } from '../../lib/password.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { createProfissionalFotoSignedUrl } from './documentos.service.js'
import {
  type EspecialidadeRegistrada,
  loadProfissionalEspecialidadesMap,
} from './especialidades.service.js'
import { ProfissionaisError } from './errors.js'
import { escapeIlikeTerm, formacaoFromProfession, formatProfissionalAtivo } from './formatters.js'
import { loadAdminProfissionalDetailExtras } from './ativos-detail.service.js'
import type { CreateAtivoBody, ListAtivosQuery, UpdateAtivoBody } from './schemas.js'
import type { FormacaoCandidatura, ProfissionalAtivoRow } from './types.js'

const FORMACAO_CONSELHO_SIGLA: Record<FormacaoCandidatura, string> = {
  medicina: 'CRM',
  psicologia: 'CRP',
  nutricao: 'CRN',
  fonoaudiologia: 'CRFa',
}

const DEFAULT_PERMISSOES_PAGINAS = {
  agenda: ['visualizar', 'inserir', 'editar', 'excluir'],
  atendimentos: ['visualizar', 'inserir', 'editar', 'excluir'],
  escala: ['visualizar', 'inserir', 'editar', 'excluir'],
  financeiro: ['visualizar', 'inserir', 'editar', 'excluir'],
  avaliacao: ['visualizar', 'inserir', 'editar', 'excluir'],
  suporte: ['visualizar', 'inserir', 'editar', 'excluir'],
  notificacoes: ['visualizar', 'inserir', 'editar', 'excluir'],
  perfil: ['visualizar', 'inserir', 'editar', 'excluir'],
}

async function resolveEspecialidadeId(
  formacao: FormacaoCandidatura,
  specialtyName: string,
): Promise<string> {
  if (formacao === 'medicina') {
    try {
      return await resolveEspecialidadeIdByName(specialtyName)
    } catch (error) {
      if (error instanceof ProfissionalCadastroError) {
        throw new ProfissionaisError(error.message, 'SPECIALTY_NOT_FOUND', 400)
      }
      throw error
    }
  }

  try {
    return await resolveFormacaoEspecialidadeId(formacao)
  } catch (error) {
    if (error instanceof ProfissionalCadastroError) {
      throw new ProfissionaisError(error.message, 'SPECIALTY_NOT_FOUND', 400)
    }
    throw error
  }
}

async function loadProfissionalAtivo(id: string): Promise<ProfissionalAtivoRow> {
  const { data, error } = await supabaseAdmin
    .from('vw_admin_profissionais_ativos')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ProfissionaisError('Profissional não encontrado.', 'NOT_FOUND', 404)
  }

  return data as ProfissionalAtivoRow
}

async function formatProfissionalRow(
  row: ProfissionalAtivoRow,
  especialidadesMap?: Map<string, EspecialidadeRegistrada[]>,
  detail?: Awaited<ReturnType<typeof loadAdminProfissionalDetailExtras>>,
) {
  const avatarUrl = await createProfissionalFotoSignedUrl(row.foto_storage_path)
  return formatProfissionalAtivo(row, avatarUrl, especialidadesMap?.get(row.id) ?? [], detail)
}

export async function listProfissionaisAtivos(params: ListAtivosQuery) {
  let query = supabaseAdmin.from('vw_admin_profissionais_ativos').select('*')

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.allocation && params.allocation !== 'all') {
    query = query.eq('alocacao', params.allocation)
  }

  if (params.profession && params.profession !== 'all') {
    const formacao = formacaoFromProfession(params.profession)
    if (formacao) query = query.eq('formacao', formacao)
  }

  if (params.search) {
    const term = escapeIlikeTerm(params.search.trim())
    query = query.or(`nome.ilike.%${term}%,especialidade_nome.ilike.%${term}%`)
  }

  query = query.order('nome', { ascending: true })

  const { data, error } = await query
  if (error) throw error

  const rows = (data ?? []) as ProfissionalAtivoRow[]
  const especialidadesMap = await loadProfissionalEspecialidadesMap(rows.map((row) => row.id))
  return Promise.all(rows.map((row) => formatProfissionalRow(row, especialidadesMap)))
}

export async function getProfissionalAtivoDetail(id: string) {
  const row = await loadProfissionalAtivo(id)
  const [especialidadesMap, detailExtras] = await Promise.all([
    loadProfissionalEspecialidadesMap([id]),
    loadAdminProfissionalDetailExtras(id),
  ])
  return formatProfissionalRow(row, especialidadesMap, detailExtras)
}

export async function createProfissionalAtivo(payload: CreateAtivoBody) {
  const cpf = normalizeCpf(payload.cpf)
  const especialidadeId = await resolveEspecialidadeId(payload.formation, payload.specialty)
  const senhaHash = await hashPassword(payload.password)

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id')
    .eq('cpf', cpf)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) {
    throw new ProfissionaisError('Já existe um profissional com este CPF.', 'DUPLICATE_CPF', 409)
  }

  const cbo = await buildProfissionalCboFields(payload.formation, payload.specialty)

  const { data, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .insert({
      cpf,
      nome: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      senha_hash: senhaHash,
      telefone: payload.phone?.trim() || null,
      formacao: cbo.formacao,
      especialidade_id: especialidadeId,
      especialidade: payload.specialty.trim(),
      conselho_sigla: FORMACAO_CONSELHO_SIGLA[payload.formation],
      conselho_numero: payload.councilNumber.replace(/\D/g, '') || payload.councilNumber.trim(),
      conselho_uf: payload.councilUf,
      cbo_codigo: cbo.cbo_codigo,
      cbo_descricao: cbo.cbo_descricao,
      endereco: {
        cep: payload.zipCode.replace(/\D/g, ''),
        logradouro: payload.street.trim(),
        numero: payload.number.trim(),
        complemento: payload.complement?.trim() || '',
        bairro: payload.neighborhood.trim(),
        cidade: payload.city.trim(),
        uf: payload.state,
      },
      status: 'ativo',
      plantao_rotulo: 'Aguardando escala',
      permissoes_paginas: DEFAULT_PERMISSOES_PAGINAS,
    })
    .select('id')
    .single()

  if (error) throw error
  return getProfissionalAtivoDetail(String(data.id))
}

export async function updateProfissionalAtivo(id: string, payload: UpdateAtivoBody) {
  await loadProfissionalAtivo(id)

  const updates: Record<string, unknown> = {}

  if (payload.phone !== undefined) updates.telefone = payload.phone.trim() || null
  if (payload.onCallLabel !== undefined) updates.plantao_rotulo = payload.onCallLabel.trim()
  if (payload.status !== undefined) updates.status = payload.status

  if (payload.specialty !== undefined) {
    const row = await loadProfissionalAtivo(id)
    const formacao = row.formacao ?? 'medicina'
    const especialidadeId = await resolveEspecialidadeId(formacao, payload.specialty)
    updates.especialidade = payload.specialty.trim()
    updates.especialidade_id = especialidadeId
  }

  if (Object.keys(updates).length === 0) {
    return getProfissionalAtivoDetail(id)
  }

  const { error } = await supabaseAdmin.from('usuarios_profissionais').update(updates).eq('id', id)

  if (error) throw error
  return getProfissionalAtivoDetail(id)
}

export async function inativarProfissionalAtivo(id: string) {
  return updateProfissionalAtivo(id, { status: 'inativo' })
}

export async function reativarProfissionalAtivo(id: string) {
  return updateProfissionalAtivo(id, { status: 'ativo' })
}
