import {
  buildDocumentoVerificacaoUrl,
  generateCodigoVerificacaoDocumento,
  resolvePublicAppUrl,
} from '../../lib/codigoVerificacaoDocumento.js'
import { buildAtestadoDeclarationLines } from '../../lib/documentos-clinicos/atestado-lines.js'
import { buildAvaliacaoPresencialSections } from '../../lib/documentos-clinicos/avaliacao-presencial-lines.js'
import { buildEncaminhamentoSections } from '../../lib/documentos-clinicos/encaminhamento-lines.js'
import { buildInternacaoSections } from '../../lib/documentos-clinicos/internacao-lines.js'
import { buildLaudoSections } from '../../lib/documentos-clinicos/laudo-lines.js'
import { buildRelatorioSections } from '../../lib/documentos-clinicos/relatorio-lines.js'
import { renderClinicalDocumentPdf } from '../../lib/documentos-clinicos/pdf-generator.js'
import type {
  ClinicalDocumentContext,
  ClinicalDocumentPayload,
} from '../../lib/documentos-clinicos/types.js'
import type { EmitDemoClinicalDocumentBody } from './schemas.js'

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

async function loadEntidadeLogoBuffer(url?: string): Promise<Buffer | null> {
  const resolved = resolveLogoFetchUrl(url)
  if (!resolved) return null

  try {
    const response = await fetch(resolved)
    if (!response.ok) return null
    const buffer = Buffer.from(await response.arrayBuffer())
    return buffer.length > 0 ? buffer : null
  } catch {
    return null
  }
}

function resolveLogoFetchUrl(url?: string): string | null {
  const trimmed = url?.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  const base = resolvePublicAppUrl().replace(/\/$/, '')
  return `${base}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`
}

async function buildDemoClinicalDocumentContext(
  input: EmitDemoClinicalDocumentBody['context'],
): Promise<ClinicalDocumentContext> {
  const emitidoEm = new Date()
  const entidadeLogoBuffer = await loadEntidadeLogoBuffer(input.entidadeLogoUrl)

  return {
    entidadeNome: input.entidadeNome,
    unitName: input.unitName,
    specialty: input.specialty,
    patientName: input.patientName,
    patientCpfMasked: input.patientCpfMasked,
    patientBirthDateLabel: input.patientBirthDateLabel?.trim() || input.patientAgeLabel?.trim() || '—',
    patientAddress: input.patientAddress?.trim() || input.patientCity?.trim() || '—',
    patientAgeLabel: input.patientAgeLabel ?? '',
    patientCity: input.patientCity ?? '',
    doctorName: input.doctorName,
    doctorSpecialty: input.doctorSpecialty,
    doctorCrm: input.doctorCrm,
    doctorRqe: input.doctorRqe?.trim() ?? '',
    emitidoEmIso: emitidoEm.toISOString(),
    emitidoEmLabel: new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(emitidoEm),
    entidadeLogoBuffer,
    entidadeSlug: input.entidadeSlug?.trim() || undefined,
  }
}

function buildPayload(body: EmitDemoClinicalDocumentBody): ClinicalDocumentPayload {
  const codigoVerificacao = generateCodigoVerificacaoDocumento()
  const verificationUrl = buildDocumentoVerificacaoUrl(codigoVerificacao, body.context.entidadeSlug)

  if (body.kind === 'receita') {
    const medicationLines = body.medicamentos.flatMap((med, index) => {
      const lines = [`${index + 1}. ${med.medicamentoNome}`]
      if (med.dosagem) lines.push(`   Dosagem: ${med.dosagem}`)
      if (med.via) lines.push(`   Via: ${med.via}`)
      if (med.frequencia) lines.push(`   Posologia: ${med.frequencia}`)
      if (med.duracao) lines.push(`   Duração: ${med.duracao}`)
      if (med.observacoes) lines.push(`   Obs.: ${med.observacoes}`)
      return lines
    })

    return {
      kind: 'receita',
      context: {} as ClinicalDocumentContext,
      sections: [{ title: 'Prescrição', lines: medicationLines }],
      footerNote: body.observacoesGerais?.trim(),
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'pedido_exame') {
    const indicacaoClinica = body.indicacaoClinica?.trim() ?? ''
    const examLines = body.exames.map((exam, index) => {
      const obs = exam.observacoes?.trim() ?? ''
      const suffix = obs && obs !== indicacaoClinica ? ` — ${obs}` : ''
      return `${index + 1}. ${exam.name}${suffix}`
    })

    return {
      kind: 'pedido_exame',
      context: {} as ClinicalDocumentContext,
      sections: [
        ...(indicacaoClinica ? [{ title: 'Indicação clínica', lines: [indicacaoClinica] }] : []),
        { title: 'Exames solicitados', lines: examLines },
      ],
      urgent: body.urgent === true,
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'encaminhamento') {
    return buildEncaminhamentoPayload(body.encaminhamento, codigoVerificacao, verificationUrl)
  }

  if (body.kind === 'relatorio') {
    return buildRelatorioPayload(body.relatorio, codigoVerificacao, verificationUrl)
  }

  if (body.kind === 'laudo') {
    return buildLaudoPayload(body.laudo, codigoVerificacao, verificationUrl)
  }

  if (body.kind === 'avaliacao_presencial') {
    return buildAvaliacaoPresencialPayload(
      body.avaliacaoPresencial,
      codigoVerificacao,
      verificationUrl,
    )
  }

  if (body.kind === 'internacao') {
    return buildInternacaoPayload(body.internacao, codigoVerificacao, verificationUrl)
  }

  const lines = buildAtestadoDeclarationLines(
    body.context.patientName,
    body.atestado,
    formatBrazilianDateLabel,
    addDaysToIsoDate,
  )

  return {
    kind: 'atestado',
    context: {} as ClinicalDocumentContext,
    sections: [{ title: 'Declaração', lines }],
    codigoVerificacao,
    verificationUrl,
  }
}

function buildEncaminhamentoPayload(
  encaminhamento: Extract<EmitDemoClinicalDocumentBody, { kind: 'encaminhamento' }>['encaminhamento'],
  codigoVerificacao: string,
  verificationUrl: string,
): ClinicalDocumentPayload {
  return {
    kind: 'encaminhamento',
    context: {} as ClinicalDocumentContext,
    sections: buildEncaminhamentoSections(encaminhamento),
    urgent: encaminhamento.prioridade === 'urgente',
    codigoVerificacao,
    verificationUrl,
  }
}

function buildRelatorioPayload(
  relatorio: Extract<EmitDemoClinicalDocumentBody, { kind: 'relatorio' }>['relatorio'],
  codigoVerificacao: string,
  verificationUrl: string,
): ClinicalDocumentPayload {
  return {
    kind: 'relatorio',
    context: {} as ClinicalDocumentContext,
    sections: buildRelatorioSections(relatorio),
    codigoVerificacao,
    verificationUrl,
  }
}

function buildLaudoPayload(
  laudo: Extract<EmitDemoClinicalDocumentBody, { kind: 'laudo' }>['laudo'],
  codigoVerificacao: string,
  verificationUrl: string,
): ClinicalDocumentPayload {
  return {
    kind: 'laudo',
    context: {} as ClinicalDocumentContext,
    sections: buildLaudoSections(laudo),
    codigoVerificacao,
    verificationUrl,
  }
}

function buildAvaliacaoPresencialPayload(
  avaliacaoPresencial: Extract<
    EmitDemoClinicalDocumentBody,
    { kind: 'avaliacao_presencial' }
  >['avaliacaoPresencial'],
  codigoVerificacao: string,
  verificationUrl: string,
): ClinicalDocumentPayload {
  return {
    kind: 'avaliacao_presencial',
    context: {} as ClinicalDocumentContext,
    sections: buildAvaliacaoPresencialSections(avaliacaoPresencial),
    urgent: avaliacaoPresencial.prioridade === 'urgente',
    codigoVerificacao,
    verificationUrl,
  }
}

function buildInternacaoPayload(
  internacao: Extract<EmitDemoClinicalDocumentBody, { kind: 'internacao' }>['internacao'],
  codigoVerificacao: string,
  verificationUrl: string,
): ClinicalDocumentPayload {
  return {
    kind: 'internacao',
    context: {} as ClinicalDocumentContext,
    sections: buildInternacaoSections(internacao),
    urgent:
      internacao.caraterInternacao === 'urgencia' ||
      internacao.caraterInternacao === 'emergencia',
    codigoVerificacao,
    verificationUrl,
  }
}

function resolveDemoDocumentMeta(body: EmitDemoClinicalDocumentBody) {
  if (body.kind === 'receita') {
    return {
      titulo: 'Receita médica',
      fileName: 'receita-medica.pdf',
      metaLabel:
        body.medicamentos.length === 1
          ? body.medicamentos[0].medicamentoNome
          : `${body.medicamentos.length} medicamentos`,
    }
  }

  if (body.kind === 'pedido_exame') {
    return {
      titulo: 'Pedido de exames',
      fileName: 'pedido-exames.pdf',
      metaLabel:
        body.exames.length === 1 ? body.exames[0].name : `${body.exames.length} exames solicitados`,
    }
  }

  if (body.kind === 'encaminhamento') {
    const urgent = body.encaminhamento.prioridade === 'urgente'
    return {
      titulo: urgent ? 'Encaminhamento médico (urgente)' : 'Encaminhamento médico',
      fileName: 'encaminhamento-medico.pdf',
      metaLabel: body.encaminhamento.specialtyLabel,
    }
  }

  if (body.kind === 'relatorio') {
    return {
      titulo: 'Relatório médico',
      fileName: 'relatorio-medico.pdf',
      metaLabel:
        body.relatorio.finalidade === 'contrarreferencia'
          ? 'Contrarreferência'
          : body.relatorio.finalidade === 'referencia'
            ? 'Referência'
            : 'Resumo clínico',
    }
  }

  if (body.kind === 'laudo') {
    return {
      titulo: 'Laudo médico',
      fileName: 'laudo-medico.pdf',
      metaLabel: body.laudo.objetoLaudo,
    }
  }

  if (body.kind === 'avaliacao_presencial') {
    const urgent = body.avaliacaoPresencial.prioridade === 'urgente'
    return {
      titulo: urgent ? 'Avaliação presencial (urgente)' : 'Avaliação presencial',
      fileName: 'avaliacao-presencial.pdf',
      metaLabel: body.avaliacaoPresencial.servicoDestino,
    }
  }

  if (body.kind === 'internacao') {
    const urgent =
      body.internacao.caraterInternacao === 'urgencia' ||
      body.internacao.caraterInternacao === 'emergencia'
    const caraterLabel =
      body.internacao.caraterInternacao === 'emergencia'
        ? 'emergência'
        : body.internacao.caraterInternacao === 'urgencia'
          ? 'urgência'
          : ''
    return {
      titulo: urgent ? `Internação (${caraterLabel})` : 'Internação',
      fileName: 'solicitacao-internacao.pdf',
      metaLabel: body.internacao.unidadeDestino,
    }
  }

  return body.atestado.tipo === 'comparecimento'
    ? {
        titulo: 'Atestado de comparecimento',
        fileName: 'atestado-comparecimento.pdf',
        metaLabel: `Comparecimento em ${formatBrazilianDateLabel(body.atestado.dataInicio)}`,
      }
    : {
        titulo: `Atestado médico (${body.atestado.diasAfastamento} dia(s))`,
        fileName: 'atestado-medico.pdf',
        metaLabel: `${body.atestado.diasAfastamento} dia(s) de afastamento`,
      }
}

export async function emitDemoClinicalDocument(body: EmitDemoClinicalDocumentBody) {
  const context = await buildDemoClinicalDocumentContext(body.context)
  const payload = buildPayload(body)
  payload.context = context

  const pdfBuffer = await renderClinicalDocumentPdf(payload)
  const meta = resolveDemoDocumentMeta(body)
  const signedAtLabel = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(context.emitidoEmIso))

  return {
    pdfBase64: pdfBuffer.toString('base64'),
    codigoVerificacao: payload.codigoVerificacao,
    verificationUrl: payload.verificationUrl,
    titulo: meta.titulo,
    fileName: meta.fileName,
    metaLabel: meta.metaLabel,
    signedAtLabel,
    kind: body.kind,
  }
}
