import { randomUUID } from 'node:crypto'
import { isValidCnpj, normalizeCnpj } from '../../lib/cnpj.js'
import { hashPassword } from '../../lib/password.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { loadCandidaturaByAccessCode, normalizeAccessCode } from './access-code.js'
import { ProfissionalCadastroError } from './errors.js'
import { validatePixKey } from './pix.validation.js'
import type { FormacaoCandidatura } from './types.js'

const FOTOS_BUCKET = 'profissionais-fotos'

const FORMACAO_LABEL: Record<FormacaoCandidatura, string> = {
  medicina: 'Medicina',
  psicologia: 'Psicologia',
  nutricao: 'Nutrição',
  fonoaudiologia: 'Fonoaudiologia',
}

const FORMACAO_PROFESSION: Record<FormacaoCandidatura, string> = {
  medicina: 'Médicos',
  psicologia: 'Psicólogos',
  nutricao: 'Nutricionistas',
  fonoaudiologia: 'Fonoaudiólogos',
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

const DATA_URL_REGEX = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i
const SELFIE_MIME_REGEX = /^image\/(?:png|jpeg|webp)$/i
const SELFIE_MAX_BYTES = 5 * 1024 * 1024

type ParsedSelfie = { buffer: Buffer; mime: string; extension: string }

function extensionForSelfieMime(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}

function parseSelfieBuffer(buffer: Buffer, mimeType: string): ParsedSelfie {
  const mime = mimeType.toLowerCase().split(';')[0]?.trim() ?? ''

  if (!SELFIE_MIME_REGEX.test(mime)) {
    throw new ProfissionalCadastroError('Formato de foto inválido.', 'INVALID_DATA', 400)
  }

  if (buffer.length === 0) {
    throw new ProfissionalCadastroError('Arquivo de foto vazio.', 'INVALID_DATA', 400)
  }

  if (buffer.length > SELFIE_MAX_BYTES) {
    throw new ProfissionalCadastroError('Foto excede o limite de 5 MB.', 'INVALID_DATA', 400)
  }

  return { buffer, mime, extension: extensionForSelfieMime(mime) }
}

function parseSelfieDataUrl(dataUrl: string): ParsedSelfie {
  const match = DATA_URL_REGEX.exec(dataUrl.trim())
  if (!match) {
    throw new ProfissionalCadastroError('Formato de foto inválido.', 'INVALID_DATA', 400)
  }

  return parseSelfieBuffer(Buffer.from(match[2], 'base64'), match[1])
}

function normalizeRazaoSocial(value: string): string {
  return value.trim().toUpperCase()
}

export async function validateProfissionalAccessCode(accessCode: string) {
  const code = normalizeAccessCode(accessCode)
  const candidatura = await loadCandidaturaByAccessCode(code)

  return {
    fullName: candidatura.nome_completo,
    cpf: candidatura.cpf,
    formationLabel: FORMACAO_LABEL[candidatura.formacao],
    specialty: candidatura.especialidade_nome ?? '',
    professionLabel: FORMACAO_PROFESSION[candidatura.formacao],
  }
}

export type FinalizarCadastroValuesInput = {
  accessCode: string
  cnpj: string
  empresaConfirmed: boolean
  pixKeyType: 'cnpj' | 'email' | 'telefone' | 'aleatoria'
  pixKey: string
  contractOpened?: boolean
  contractScrolledToEnd?: boolean
  contractAccepted: boolean
  password: string
  confirmPassword: string
}

export type FinalizarCadastroInput = FinalizarCadastroValuesInput & {
  selfiePhotoDataUrl: string
}

export type FinalizarCadastroEmpresaInput = {
  cnpj?: string
  razaoSocial: string
  nomeFantasia?: string
  situacaoCadastral?: string
  municipio: string
  uf: string
}

async function assertProfissionalDisponivel(cpf: string, email: string): Promise<void> {
  const { data: profissionalExistente, error: profissionalError } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id')
    .eq('cpf', cpf)
    .maybeSingle()

  if (profissionalError) throw profissionalError
  if (profissionalExistente) {
    throw new ProfissionalCadastroError(
      'Este CPF já possui cadastro profissional ativo.',
      'DUPLICATE_CPF',
      409,
    )
  }

  const { data: emailExistente, error: emailError } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (emailError) throw emailError
  if (emailExistente) {
    throw new ProfissionalCadastroError(
      'Este e-mail já está vinculado a outro profissional.',
      'CONFLICT',
      409,
    )
  }
}

export async function finalizeProfissionalCadastro(
  values: FinalizarCadastroValuesInput,
  empresa: FinalizarCadastroEmpresaInput,
  selfieInput: { buffer: Buffer; mimeType: string } | { selfiePhotoDataUrl: string },
): Promise<{ profissionalId: string }> {
  const code = normalizeAccessCode(values.accessCode)
  if (code.length !== 6) {
    throw new ProfissionalCadastroError(
      'Código de acesso inválido ou expirado.',
      'INVALID_DATA',
      404,
    )
  }

  if (!values.empresaConfirmed) {
    throw new ProfissionalCadastroError('Confirme os dados da empresa.', 'INVALID_DATA', 400)
  }

  if (!values.contractAccepted) {
    throw new ProfissionalCadastroError('Aceite do contrato é obrigatório.', 'INVALID_DATA', 400)
  }

  if (!values.contractOpened) {
    throw new ProfissionalCadastroError('Abra e leia o contrato antes de aceitar.', 'INVALID_DATA', 400)
  }

  if (!values.contractScrolledToEnd) {
    throw new ProfissionalCadastroError(
      'Role o contrato até o final antes de aceitar.',
      'INVALID_DATA',
      400,
    )
  }

  if (values.password.length < 8) {
    throw new ProfissionalCadastroError('A senha deve ter pelo menos 8 caracteres.', 'INVALID_DATA', 400)
  }

  if (values.password !== values.confirmPassword) {
    throw new ProfissionalCadastroError('As senhas não coincidem.', 'INVALID_DATA', 400)
  }

  const candidatura = await loadCandidaturaByAccessCode(code)
  const cnpj = normalizeCnpj(values.cnpj)

  if (!isValidCnpj(cnpj)) {
    throw new ProfissionalCadastroError('CNPJ inválido.', 'INVALID_DATA', 400)
  }

  if (empresa.cnpj && empresa.cnpj !== cnpj) {
    throw new ProfissionalCadastroError(
      'Os dados da empresa não correspondem ao CNPJ informado.',
      'INVALID_DATA',
      400,
    )
  }

  const pixChave = validatePixKey(values.pixKeyType, values.pixKey)
  await assertProfissionalDisponivel(candidatura.cpf, candidatura.email)

  const senhaHash = await hashPassword(values.password)
  const selfie =
    'buffer' in selfieInput
      ? parseSelfieBuffer(selfieInput.buffer, selfieInput.mimeType)
      : parseSelfieDataUrl(selfieInput.selfiePhotoDataUrl)
  const profissionalId = randomUUID()
  const fotoStoragePath = `${profissionalId}/selfie.${selfie.extension}`
  const now = new Date().toISOString()

  const dadosBancarios = {
    pixTipo: values.pixKeyType,
    pixChave,
  }

  const dadosPj = {
    cnpj,
    razaoSocial: empresa.razaoSocial,
    nomeFantasia: empresa.nomeFantasia ?? '',
    situacaoCadastral: empresa.situacaoCadastral ?? '',
    municipio: empresa.municipio,
    uf: empresa.uf,
    pixTipo: values.pixKeyType,
    pixChave,
  }

  const assinatura = {
    modo: 'aceite_contrato_onboarding',
    status: 'aceito',
    updatedAt: now,
    contractOpened: Boolean(values.contractOpened),
    contractScrolledToEnd: Boolean(values.contractScrolledToEnd),
    contractAccepted: true,
  }

  const { error: uploadError } = await supabaseAdmin.storage
    .from(FOTOS_BUCKET)
    .upload(fotoStoragePath, selfie.buffer, {
      contentType: selfie.mime,
      upsert: false,
    })

  if (uploadError) throw uploadError

  try {
    const { error: insertError } = await supabaseAdmin.from('usuarios_profissionais').insert({
      id: profissionalId,
      cpf: candidatura.cpf,
      nome: candidatura.nome_completo,
      email: candidatura.email,
      senha_hash: senhaHash,
      telefone: candidatura.telefone,
      data_nascimento: candidatura.data_nascimento,
      formacao: candidatura.formacao,
      especialidade_id: candidatura.especialidade_id,
      especialidade: candidatura.especialidade_nome ?? '',
      conselho_sigla: candidatura.conselho_sigla,
      conselho_numero: candidatura.conselho_numero,
      conselho_uf: candidatura.conselho_uf,
      rqe: candidatura.rqe,
      bio: candidatura.descricao_profissional,
      endereco: candidatura.endereco,
      dados_pj: dadosPj,
      assinatura,
      foto_storage_path: fotoStoragePath,
      status: 'ativo',
      plantao_rotulo: 'Aguardando escala',
      permissoes_paginas: DEFAULT_PERMISSOES_PAGINAS,
    })

    if (insertError) throw insertError

    const { error: pagamentoError } = await supabaseAdmin.from('profissional_dados_pagamento').insert({
      profissional_id: profissionalId,
      pix_tipo: values.pixKeyType,
      pix_chave: pixChave,
      titular: normalizeRazaoSocial(empresa.razaoSocial),
    })

    if (pagamentoError) throw pagamentoError

    const { error: candidaturaError } = await supabaseAdmin
      .from('candidaturas_profissionais')
      .update({
        profissional_id: profissionalId,
        finalizada_em: now,
        codigo_acesso: null,
        codigo_acesso_hash: null,
        codigo_acesso_expira_em: null,
        codigo_acesso_enviado_em: null,
      })
      .eq('id', candidatura.id)

    if (candidaturaError) throw candidaturaError

    const { error: empresaError } = await supabaseAdmin
      .from('candidatura_empresa_pj')
      .update({
        status: 'vinculada',
        cnpj,
        razao_social: empresa.razaoSocial,
        municipio: empresa.municipio,
        uf: empresa.uf,
        dados_bancarios: dadosBancarios,
      })
      .eq('candidatura_id', candidatura.id)

    if (empresaError) throw empresaError

    const { error: timelineError } = await supabaseAdmin.from('candidatura_timeline').insert({
      candidatura_id: candidatura.id,
      titulo: 'Cadastro finalizado',
      detalhe: 'Profissional concluiu o onboarding e acessou o portal.',
      autor_nome: candidatura.nome_completo,
    })

    if (timelineError) throw timelineError
  } catch (error) {
    await supabaseAdmin.from('profissional_dados_pagamento').delete().eq('profissional_id', profissionalId)
    await supabaseAdmin.from('usuarios_profissionais').delete().eq('id', profissionalId)
    await supabaseAdmin.storage.from(FOTOS_BUCKET).remove([fotoStoragePath])
    throw error
  }

  return { profissionalId }
}
