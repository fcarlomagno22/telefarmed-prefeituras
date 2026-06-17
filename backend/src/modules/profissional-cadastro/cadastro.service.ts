import { normalizeCpf } from '../../lib/cpf.js'
import {
  FORMACAO_CONSELHO_SIGLA,
  resolveEspecialidadeIdByName,
  resolveFormacaoEspecialidadeId,
} from '../../lib/config-clinico/formacao-especialidade.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { ProfissionalCadastroError } from './errors.js'
import { logProfissionalCadastro } from './debug-log.js'
import {
  buildDocumentUpload,
  buildDocumentUploadFromPending,
  createPendingCandidaturaDocumentUploadUrls,
  deleteCandidaturaCascade,
  getRequiredDocumentFieldIds,
  registerCandidaturaDocumentoFromPending,
  uploadCandidaturaDocumento,
  type PendingDocumentReference,
  type PendingDocumentUploadRequest,
} from './documentos.service.js'
import type {
  CandidaturaDocumentoUpload,
  CandidaturaEspecialidadeMedicaInput,
  SubmitCandidaturaInput,
  SubmitCandidaturaResult,
} from './types.js'

export type { PendingDocumentUploadRequest }
export { createPendingCandidaturaDocumentUploadUrls }

type IncomingDocument = {
  fieldId: string
  buffer: Buffer
  mimeType: string
  fileName: string
}

type ResolvedEspecialidadeMedica = {
  especialidadeId: string
  rqe: string
}

async function resolveEspecialidadesMedicas(
  items: CandidaturaEspecialidadeMedicaInput[],
): Promise<ResolvedEspecialidadeMedica[]> {
  const resolved: ResolvedEspecialidadeMedica[] = []

  for (const item of items) {
    const especialidadeId = await resolveEspecialidadeIdByName(item.especialidadeNome)
    resolved.push({
      especialidadeId,
      rqe: item.rqe,
    })
  }

  return resolved
}

async function resolvePrimaryEspecialidadeId(input: SubmitCandidaturaInput): Promise<{
  especialidadeId: string
  rqe: string | null
  especialidadesMedicas: ResolvedEspecialidadeMedica[]
}> {
  if (input.formacao === 'medicina') {
    const items = input.especialidadesMedicas ?? []
    if (items.length === 0) {
      throw new ProfissionalCadastroError(
        'Informe ao menos uma especialidade com RQE.',
        'INVALID_DATA',
        400,
      )
    }

    const especialidadesMedicas = await resolveEspecialidadesMedicas(items)
    const principal = especialidadesMedicas[0]!

    return {
      especialidadeId: principal.especialidadeId,
      rqe: principal.rqe,
      especialidadesMedicas,
    }
  }

  return {
    especialidadeId: await resolveFormacaoEspecialidadeId(input.formacao),
    rqe: null,
    especialidadesMedicas: [],
  }
}

async function assertCpfDisponivel(cpf: string): Promise<void> {
  const { data: candidaturaAtiva, error: candidaturaError } = await supabaseAdmin
    .from('candidaturas_profissionais')
    .select('id')
    .eq('cpf', cpf)
    .in('status', ['pendente', 'em_analise', 'correcao_solicitada'])
    .maybeSingle()

  if (candidaturaError) throw candidaturaError
  if (candidaturaAtiva) {
    throw new ProfissionalCadastroError(
      'Já existe uma candidatura em análise para este CPF. Aguarde o retorno da nossa equipe.',
      'DUPLICATE_CPF',
      409,
    )
  }

  const { data: profissionalExistente, error: profissionalError } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id')
    .eq('cpf', cpf)
    .maybeSingle()

  if (profissionalError) throw profissionalError
  if (profissionalExistente) {
    throw new ProfissionalCadastroError(
      'Este CPF já possui cadastro profissional ativo. Acesse o portal com suas credenciais.',
      'DUPLICATE_CPF',
      409,
    )
  }
}

function collectDocumentUploads(documents: IncomingDocument[]): CandidaturaDocumentoUpload[] {
  const required = getRequiredDocumentFieldIds()
  const byField = new Map(documents.map((item) => [item.fieldId, item]))

  for (const fieldId of required) {
    if (!byField.has(fieldId)) {
      throw new ProfissionalCadastroError(
        'Envie todos os documentos obrigatórios.',
        'DOCUMENT_REQUIRED',
        400,
      )
    }
  }

  return required.map((fieldId) => {
    const item = byField.get(fieldId)!
    return buildDocumentUpload(fieldId, item.buffer, item.mimeType, item.fileName)
  })
}

function collectPendingDocumentUploads(
  submissionId: string,
  documents: PendingDocumentReference[],
): Promise<Array<{ documento: CandidaturaDocumentoUpload; pendingStoragePath: string }>> {
  const required = getRequiredDocumentFieldIds()
  const byField = new Map(documents.map((item) => [item.fieldId, item]))

  for (const fieldId of required) {
    if (!byField.has(fieldId)) {
      throw new ProfissionalCadastroError(
        'Envie todos os documentos obrigatórios.',
        'DOCUMENT_REQUIRED',
        400,
      )
    }
  }

  return Promise.all(
    required.map(async (fieldId) =>
      buildDocumentUploadFromPending(submissionId, byField.get(fieldId)!),
    ),
  )
}

export async function submitCandidaturaProfissionalFromStorage(
  input: SubmitCandidaturaInput,
  submissionId: string,
  documents: PendingDocumentReference[],
): Promise<SubmitCandidaturaResult> {
  logProfissionalCadastro('info', 'submitCandidaturaFromStorage iniciado', {
    submissionId,
    formacao: input.formacao,
    cpf: input.cpf,
    documentoCount: documents.length,
    fieldIds: documents.map((documento) => documento.fieldId),
  })

  const cpf = normalizeCpf(input.cpf)
  await assertCpfDisponivel(cpf)

  const { especialidadeId, rqe, especialidadesMedicas } =
    await resolvePrimaryEspecialidadeId(input)
  logProfissionalCadastro('info', 'submitCandidaturaFromStorage especialidade resolvida', {
    submissionId,
    formacao: input.formacao,
    especialidadeId,
  })
  const documentos = await collectPendingDocumentUploads(submissionId, documents)
  logProfissionalCadastro('info', 'submitCandidaturaFromStorage documentos validados', {
    submissionId,
    documentoCount: documentos.length,
  })

  const { data: candidatura, error: insertError } = await supabaseAdmin
    .from('candidaturas_profissionais')
    .insert({
      cpf,
      nome_completo: input.nomeCompleto,
      email: input.email,
      telefone: input.telefone,
      data_nascimento: input.dataNascimento,
      formacao: input.formacao,
      especialidade_id: especialidadeId,
      conselho_sigla: FORMACAO_CONSELHO_SIGLA[input.formacao],
      conselho_numero: input.conselhoNumero,
      conselho_uf: input.conselhoUf,
      rqe,
      descricao_profissional: input.descricaoProfissional ?? '',
      endereco: input.endereco,
      status: 'pendente',
      enviada_em: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (insertError) throw insertError

  const candidaturaId = String(candidatura.id)

  try {
    if (especialidadesMedicas.length > 0) {
      const { error: especialidadesError } = await supabaseAdmin
        .from('candidatura_especialidades')
        .insert(
          especialidadesMedicas.map((item, index) => ({
            candidatura_id: candidaturaId,
            especialidade_id: item.especialidadeId,
            rqe: item.rqe,
            ordem: index + 1,
          })),
        )

      if (especialidadesError) throw especialidadesError
    }

    for (const { documento, pendingStoragePath } of documentos) {
      await registerCandidaturaDocumentoFromPending(
        candidaturaId,
        documento,
        pendingStoragePath,
      )
    }

    const { error: empresaError } = await supabaseAdmin.from('candidatura_empresa_pj').insert({
      candidatura_id: candidaturaId,
      status: 'nao_informado',
    })

    if (empresaError) throw empresaError

    const { error: timelineError } = await supabaseAdmin.from('candidatura_timeline').insert({
      candidatura_id: candidaturaId,
      titulo: 'Candidatura enviada',
      detalhe: 'Formulário e documentos recebidos pelo portal.',
      autor_nome: 'Sistema',
    })

    if (timelineError) throw timelineError
  } catch (error) {
    await deleteCandidaturaCascade(candidaturaId)
    throw error
  }

  return { candidaturaId }
}

export async function submitCandidaturaProfissional(
  input: SubmitCandidaturaInput,
  documents: IncomingDocument[],
): Promise<SubmitCandidaturaResult> {
  const cpf = normalizeCpf(input.cpf)
  await assertCpfDisponivel(cpf)

  const { especialidadeId, rqe, especialidadesMedicas } =
    await resolvePrimaryEspecialidadeId(input)
  const documentos = collectDocumentUploads(documents)

  const { data: candidatura, error: insertError } = await supabaseAdmin
    .from('candidaturas_profissionais')
    .insert({
      cpf,
      nome_completo: input.nomeCompleto,
      email: input.email,
      telefone: input.telefone,
      data_nascimento: input.dataNascimento,
      formacao: input.formacao,
      especialidade_id: especialidadeId,
      conselho_sigla: FORMACAO_CONSELHO_SIGLA[input.formacao],
      conselho_numero: input.conselhoNumero,
      conselho_uf: input.conselhoUf,
      rqe,
      descricao_profissional: input.descricaoProfissional ?? '',
      endereco: input.endereco,
      status: 'pendente',
      enviada_em: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (insertError) throw insertError

  const candidaturaId = String(candidatura.id)

  try {
    if (especialidadesMedicas.length > 0) {
      const { error: especialidadesError } = await supabaseAdmin
        .from('candidatura_especialidades')
        .insert(
          especialidadesMedicas.map((item, index) => ({
            candidatura_id: candidaturaId,
            especialidade_id: item.especialidadeId,
            rqe: item.rqe,
            ordem: index + 1,
          })),
        )

      if (especialidadesError) throw especialidadesError
    }

    for (const documento of documentos) {
      await uploadCandidaturaDocumento(candidaturaId, documento)
    }

    const { error: empresaError } = await supabaseAdmin.from('candidatura_empresa_pj').insert({
      candidatura_id: candidaturaId,
      status: 'nao_informado',
    })

    if (empresaError) throw empresaError

    const { error: timelineError } = await supabaseAdmin.from('candidatura_timeline').insert({
      candidatura_id: candidaturaId,
      titulo: 'Candidatura enviada',
      detalhe: 'Formulário e documentos recebidos pelo portal.',
      autor_nome: 'Sistema',
    })

    if (timelineError) throw timelineError
  } catch (error) {
    await deleteCandidaturaCascade(candidaturaId)
    throw error
  }

  return { candidaturaId }
}
