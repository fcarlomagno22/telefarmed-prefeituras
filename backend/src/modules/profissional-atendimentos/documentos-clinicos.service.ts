import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '../../db/supabase.js'
import { logAtendimentoConsultaEventoSafe } from '../../lib/auditoria/atendimento-events.js'
import {
  buildDocumentoVerificacaoUrl,
  generateCodigoVerificacaoDocumento,
} from '../../lib/codigoVerificacaoDocumento.js'
import {
  hashDocumentBuffer,
  renderClinicalDocumentPdf,
} from '../../lib/documentos-clinicos/pdf-generator.js'
import type {
  AtestadoPdfData,
  ClinicalDocumentKind,
  ClinicalDocumentPayload,
  ExamePdfItem,
  PrescricaoPdfItem,
} from '../../lib/documentos-clinicos/types.js'
import { ANEXO_BUCKET, createAnexoSignedUrl } from './clinical-data.service.js'
import {
  buildClinicalDocumentContext,
  loadDocumentContextRow,
} from './documentos-context.service.js'
import { ProfissionalAtendimentosError } from './errors.js'
import { sanitizeFileName } from './formatters.js'
import {
  assertConsultaEmAndamento,
  assertConsultaOwnedByProfissional,
  assertConsultaReadableByProfissional,
  loadConsultaById,
} from './ownership.js'
import type { ProfissionalIssuedDocumentApi } from './schemas.js'

type EmitDocumentResult = {
  documento: ProfissionalIssuedDocumentApi
}

async function persistClinicalPdfDocument(input: {
  consultaId: string
  tipo: ClinicalDocumentKind
  titulo: string
  fileName: string
  pdfBuffer: Buffer
  metadata: Record<string, unknown>
  codigoVerificacao: string
}): Promise<{
  anexoId: string
  codigoVerificacao: string
  signedUrl: string
}> {
  const codigoVerificacao = input.codigoVerificacao
  const safeName = sanitizeFileName(input.fileName)
  const storagePath = `${input.consultaId}/documentos/${randomUUID()}-${safeName}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from(ANEXO_BUCKET)
    .upload(storagePath, input.pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) throw uploadError

  const signedUrl = await createAnexoSignedUrl(storagePath)
  const hash = hashDocumentBuffer(input.pdfBuffer)

  const { data, error } = await supabaseAdmin
    .from('consulta_anexos')
    .insert({
      consulta_id: input.consultaId,
      tipo: input.tipo,
      titulo: input.titulo,
      arquivo_nome: safeName,
      arquivo_url: signedUrl,
      storage_path: storagePath,
      origem: 'profissional',
      codigo_verificacao: codigoVerificacao,
      metadata: {
        ...input.metadata,
        hashSha256: hash,
      },
    })
    .select('id, tipo, titulo, arquivo_nome, criado_em, codigo_verificacao')
    .single()

  if (error) throw error

  return {
    anexoId: String(data.id),
    codigoVerificacao,
    signedUrl,
  }
}

function mapAnexoRowToIssuedDocument(
  row: {
    id: string
    tipo: string
    titulo: string
    arquivo_nome: string
    criado_em: string
    codigo_verificacao?: string | null
  },
  downloadUrl: string,
  meta: string,
): ProfissionalIssuedDocumentApi {
  const signedAt = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(row.criado_em))

  return {
    id: `anexo-${row.id}`,
    kind: row.tipo as ProfissionalIssuedDocumentApi['kind'],
    title: row.titulo,
    meta,
    fileName: row.arquivo_nome,
    signedAtLabel: signedAt,
    downloadUrl,
    codigoVerificacao: row.codigo_verificacao?.trim() || undefined,
  }
}

async function emitPdfDocument(
  profissionalId: string,
  consultaId: string,
  payload: ClinicalDocumentPayload,
  input: {
    titulo: string
    fileName: string
    metadata: Record<string, unknown>
    metaLabel: string
  },
): Promise<EmitDocumentResult> {
  const consulta = await loadConsultaById(consultaId)
  await assertConsultaOwnedByProfissional(profissionalId, consulta)
  await assertConsultaEmAndamento(consulta)

  const pdfBuffer = await renderClinicalDocumentPdf(payload)
  const saved = await persistClinicalPdfDocument({
    consultaId,
    tipo: payload.kind,
    titulo: input.titulo,
    fileName: input.fileName,
    pdfBuffer,
    metadata: input.metadata,
    codigoVerificacao: payload.codigoVerificacao,
  })

  const result: EmitDocumentResult = {
    documento: mapAnexoRowToIssuedDocument(
      {
        id: saved.anexoId,
        tipo: payload.kind,
        titulo: input.titulo,
        arquivo_nome: input.fileName,
        criado_em: payload.context.emitidoEmIso,
        codigo_verificacao: saved.codigoVerificacao,
      },
      saved.signedUrl,
      input.metaLabel,
    ),
  }

  logAtendimentoConsultaEventoSafe({
    acao: 'acao_sensivel',
    descricao: `Documento clínico emitido (${payload.kind})`,
    consultaId,
    profissionalId,
    codigoAtendimento: consulta.codigoAtendimento,
    payload: {
      documentoId: result.documento.id,
      kind: payload.kind,
      codigoVerificacao: saved.codigoVerificacao,
    },
  })

  return result
}

export async function emitirProfissionalReceitaPdf(
  profissionalId: string,
  consultaId: string,
  input: {
    medicamentos: PrescricaoPdfItem[]
    observacoesGerais?: string
  },
): Promise<EmitDocumentResult> {
  if (input.medicamentos.length === 0) {
    throw new ProfissionalAtendimentosError('Informe ao menos um medicamento.', 'INVALID_DATA', 400)
  }

  const contextRow = await loadDocumentContextRow(consultaId)
  if (!contextRow) {
    throw new ProfissionalAtendimentosError('Consulta não encontrada.', 'NOT_FOUND', 404)
  }

  const emitidoEm = new Date()
  const context = await buildClinicalDocumentContext(contextRow, emitidoEm)
  const codigoVerificacao = generateCodigoVerificacaoDocumento()
  const verificationUrl = buildDocumentoVerificacaoUrl(codigoVerificacao)

  const prescricaoIds: string[] = []

  for (const med of input.medicamentos) {
    const { data, error } = await supabaseAdmin
      .from('consulta_prescricoes')
      .insert({
        consulta_id: consultaId,
        medicamento_nome: med.medicamentoNome.trim(),
        dosagem: med.dosagem?.trim() ?? '',
        via: med.via?.trim() ?? '',
        frequencia: med.frequencia?.trim() ?? '',
        duracao: med.duracao?.trim() ?? '',
        observacoes: med.observacoes?.trim() ?? '',
      })
      .select('id')
      .single()

    if (error) throw error
    prescricaoIds.push(String(data.id))
  }

  const medicationLines = input.medicamentos.flatMap((med, index) => {
    const lines = [`${index + 1}. ${med.medicamentoNome}`]
    if (med.dosagem) lines.push(`   Dosagem: ${med.dosagem}`)
    if (med.via) lines.push(`   Via: ${med.via}`)
    if (med.frequencia) lines.push(`   Posologia: ${med.frequencia}`)
    if (med.duracao) lines.push(`   Duração: ${med.duracao}`)
    if (med.observacoes) lines.push(`   Obs.: ${med.observacoes}`)
    return lines
  })

  const payload: ClinicalDocumentPayload = {
    kind: 'receita',
    context,
    sections: [
      {
        title: 'Prescrição',
        lines: medicationLines,
      },
    ],
    footerNote: input.observacoesGerais?.trim(),
    codigoVerificacao,
    verificationUrl,
  }

  return emitPdfDocument(profissionalId, consultaId, payload, {
    titulo: 'Receita médica',
    fileName: 'receita-medica.pdf',
    metadata: { prescricaoIds, observacoesGerais: input.observacoesGerais ?? '' },
    metaLabel:
      input.medicamentos.length === 1
        ? input.medicamentos[0].medicamentoNome
        : `${input.medicamentos.length} medicamentos`,
  })
}

export async function emitirProfissionalPedidoExamePdf(
  profissionalId: string,
  consultaId: string,
  input: {
    exames: ExamePdfItem[]
    indicacaoClinica?: string
  },
): Promise<EmitDocumentResult> {
  if (input.exames.length === 0) {
    throw new ProfissionalAtendimentosError('Selecione ao menos um exame.', 'INVALID_DATA', 400)
  }

  const contextRow = await loadDocumentContextRow(consultaId)
  if (!contextRow) {
    throw new ProfissionalAtendimentosError('Consulta não encontrada.', 'NOT_FOUND', 404)
  }

  const emitidoEm = new Date()
  const context = await buildClinicalDocumentContext(contextRow, emitidoEm)
  const codigoVerificacao = generateCodigoVerificacaoDocumento()
  const verificationUrl = buildDocumentoVerificacaoUrl(codigoVerificacao)

  const solicitacaoIds: string[] = []
  const customExams: string[] = []

  const indicacaoClinica = input.indicacaoClinica?.trim() ?? ''

  for (const exam of input.exames) {
    if (exam.exameId?.trim()) {
      const { data, error } = await supabaseAdmin
        .from('consulta_solicitacoes_exame')
        .insert({
          consulta_id: consultaId,
          exame_id: exam.exameId.trim(),
          observacoes: exam.observacoes?.trim() ?? '',
        })
        .select('id')
        .single()

      if (error) throw error
      solicitacaoIds.push(String(data.id))
    } else {
      customExams.push(exam.name)
    }
  }

  const examLines = input.exames.map((exam, index) => {
    const obs = exam.observacoes?.trim() ?? ''
    const suffix = obs && obs !== indicacaoClinica ? ` — ${obs}` : ''
    return `${index + 1}. ${exam.name}${suffix}`
  })

  const sections = [
    ...(indicacaoClinica
      ? [{ title: 'Indicação clínica', lines: [indicacaoClinica] }]
      : []),
    { title: 'Exames solicitados', lines: examLines },
  ]

  const payload: ClinicalDocumentPayload = {
    kind: 'pedido_exame',
    context,
    sections,
    codigoVerificacao,
    verificationUrl,
  }

  return emitPdfDocument(profissionalId, consultaId, payload, {
    titulo: 'Pedido de exames',
    fileName: 'pedido-exames.pdf',
    metadata: { solicitacaoIds, customExams, indicacaoClinica: input.indicacaoClinica ?? '' },
    metaLabel:
      input.exames.length === 1 ? input.exames[0].name : `${input.exames.length} exames solicitados`,
  })
}

export async function emitirProfissionalAtestadoPdf(
  profissionalId: string,
  consultaId: string,
  input: AtestadoPdfData,
): Promise<EmitDocumentResult> {
  const contextRow = await loadDocumentContextRow(consultaId)
  if (!contextRow) {
    throw new ProfissionalAtendimentosError('Consulta não encontrada.', 'NOT_FOUND', 404)
  }

  const emitidoEm = new Date()
  const context = await buildClinicalDocumentContext(contextRow, emitidoEm)
  const codigoVerificacao = generateCodigoVerificacaoDocumento()
  const verificationUrl = buildDocumentoVerificacaoUrl(codigoVerificacao)

  const dataFim = addDaysToIsoDate(input.dataInicio, input.diasAfastamento)

  const { data: atestado, error: atestadoError } = await supabaseAdmin
    .from('consulta_atestados')
    .insert({
      consulta_id: consultaId,
      dias_afastamento: input.diasAfastamento,
      data_inicio: input.dataInicio,
      cid: input.cid?.trim() ?? '',
      motivo: input.motivo.trim(),
      observacoes: input.observacoes?.trim() ?? '',
    })
    .select('id')
    .single()

  if (atestadoError) throw atestadoError

  const lines = [
    `Atesto, para os devidos fins, que o(a) paciente ${context.patientName} necessita de afastamento de suas atividades por ${input.diasAfastamento} dia(s).`,
    `Período: ${formatBrazilianDateLabel(input.dataInicio)} a ${formatBrazilianDateLabel(dataFim)}.`,
    `Motivo: ${input.motivo.trim()}`,
  ]

  if (input.cid?.trim()) {
    lines.push(`CID: ${input.cid.trim()}`)
  }
  if (input.observacoes?.trim()) {
    lines.push(`Observações: ${input.observacoes.trim()}`)
  }

  const payload: ClinicalDocumentPayload = {
    kind: 'atestado',
    context,
    sections: [{ title: 'Declaração', lines }],
    codigoVerificacao,
    verificationUrl,
  }

  return emitPdfDocument(profissionalId, consultaId, payload, {
    titulo: `Atestado médico (${input.diasAfastamento} dia(s))`,
    fileName: 'atestado-medico.pdf',
    metadata: { atestadoId: String(atestado.id) },
    metaLabel: `${input.diasAfastamento} dia(s) de afastamento`,
  })
}

function formatBrazilianDateLabel(isoDate: string): string {
  const parts = isoDate.split('-')
  if (parts.length !== 3) return isoDate
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function addDaysToIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`)
  date.setDate(date.getDate() + Math.max(0, days - 1))
  return date.toISOString().slice(0, 10)
}

export async function resolveDocumentoDownloadUrl(anexoId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('consulta_anexos')
    .select('storage_path')
    .eq('id', anexoId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ProfissionalAtendimentosError('Documento não encontrado.', 'NOT_FOUND', 404)
  }

  const storagePath = data.storage_path?.trim()
  if (!storagePath) {
    throw new ProfissionalAtendimentosError('Arquivo indisponível.', 'SERVICE_UNAVAILABLE', 410)
  }

  const signed = await createAnexoSignedUrl(storagePath)
  if (!signed) {
    throw new ProfissionalAtendimentosError('Arquivo indisponível.', 'SERVICE_UNAVAILABLE', 410)
  }

  return signed
}

export async function resolveDocumentoDownloadUrlForConsulta(
  profissionalId: string,
  consultaId: string,
  anexoId: string,
): Promise<string> {
  const consulta = await loadConsultaById(consultaId)
  await assertConsultaReadableByProfissional(profissionalId, consulta)

  const { data, error } = await supabaseAdmin
    .from('consulta_anexos')
    .select('id, storage_path, origem')
    .eq('id', anexoId)
    .eq('consulta_id', consultaId)
    .maybeSingle()

  if (error) throw error
  if (!data || data.origem !== 'profissional') {
    throw new ProfissionalAtendimentosError('Documento não encontrado.', 'NOT_FOUND', 404)
  }

  const storagePath = data.storage_path?.trim()
  if (!storagePath) {
    throw new ProfissionalAtendimentosError('Arquivo indisponível.', 'SERVICE_UNAVAILABLE', 410)
  }

  const signed = await createAnexoSignedUrl(storagePath)
  if (!signed) {
    throw new ProfissionalAtendimentosError('Arquivo indisponível.', 'SERVICE_UNAVAILABLE', 410)
  }

  logAtendimentoConsultaEventoSafe({
    acao: 'acao_sensivel',
    descricao: 'Download de documento clínico (profissional)',
    consultaId,
    profissionalId,
    codigoAtendimento: consulta.codigoAtendimento,
    payload: { anexoId, documentoId: `anexo-${anexoId}` },
  })

  return signed
}
