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
import {
  buildPsychologistAtestadoDeclarationLines,
  buildPsychologistEncaminhamentoSections,
  buildPsychologistLaudoSections,
  buildPsychologistParecerSections,
  buildPsychologistRelatorioMultiprofissionalSections,
  buildPsychologistRelatorioSections,
} from '../../lib/documentos-clinicos/psicologo-lines.js'
import {
  buildNutritionistDeclaracaoComparecimentoLines,
  buildNutritionistLaudoSections,
  buildNutritionistParecerSections,
  buildNutritionistPlanoAlimentarSections,
  buildNutritionistPrescricaoDieteticaSections,
  buildNutritionistPrescricaoSuplementosSections,
  buildNutritionistRelatorioSections,
} from '../../lib/documentos-clinicos/nutricionista-lines.js'
import {
  buildFonoaudiologoAtestadoDeclarationLines,
  buildFonoaudiologoDeclaracaoComparecimentoLines,
  buildFonoaudiologoEncaminhamentoSections,
  buildFonoaudiologoLaudoSections,
  buildFonoaudiologoParecerSections,
  buildFonoaudiologoPlanoTerapeuticoSections,
  buildFonoaudiologoRelatorioSections,
  buildFonoaudiologoResultadoAvaliacaoSections,
} from '../../lib/documentos-clinicos/fonoaudiologo-lines.js'
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

  if (body.kind === 'atestado_psicologico') {
    const lines = buildPsychologistAtestadoDeclarationLines(
      body.context.patientName,
      body.atestadoPsicologico,
      formatBrazilianDateLabel,
      addDaysToIsoDate,
    )
    return {
      kind: 'atestado_psicologico',
      context: {} as ClinicalDocumentContext,
      sections: [{ title: 'Declaração', lines }],
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'relatorio_psicologico') {
    return {
      kind: 'relatorio_psicologico',
      context: {} as ClinicalDocumentContext,
      sections: buildPsychologistRelatorioSections(body.relatorioPsicologico),
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'relatorio_multiprofissional') {
    return {
      kind: 'relatorio_multiprofissional',
      context: {} as ClinicalDocumentContext,
      sections: buildPsychologistRelatorioMultiprofissionalSections(
        body.relatorioMultiprofissional,
      ),
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'laudo_psicologico') {
    return {
      kind: 'laudo_psicologico',
      context: {} as ClinicalDocumentContext,
      sections: buildPsychologistLaudoSections(body.laudoPsicologico),
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'parecer_psicologico') {
    return {
      kind: 'parecer_psicologico',
      context: {} as ClinicalDocumentContext,
      sections: buildPsychologistParecerSections(body.parecerPsicologico),
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'encaminhamento_psicologico') {
    return {
      kind: 'encaminhamento_psicologico',
      context: {} as ClinicalDocumentContext,
      sections: buildPsychologistEncaminhamentoSections(body.encaminhamentoPsicologico),
      urgent: body.encaminhamentoPsicologico.prioridade === 'urgente',
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'plano_alimentar') {
    return {
      kind: 'plano_alimentar',
      context: {} as ClinicalDocumentContext,
      sections: buildNutritionistPlanoAlimentarSections(body.planoAlimentar),
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'prescricao_dietetica') {
    return {
      kind: 'prescricao_dietetica',
      context: {} as ClinicalDocumentContext,
      sections: buildNutritionistPrescricaoDieteticaSections(body.prescricaoDietetica),
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'prescricao_suplementos') {
    return {
      kind: 'prescricao_suplementos',
      context: {} as ClinicalDocumentContext,
      sections: buildNutritionistPrescricaoSuplementosSections(body.prescricaoSuplementos),
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'pedido_exame_nutricional') {
    const indicacaoClinica = body.pedidoExameNutricional.indicacaoClinica?.trim() ?? ''
    const examLines = body.pedidoExameNutricional.exames.map((exam, index) => {
      const obs = exam.observacoes?.trim() ?? ''
      const suffix = obs && obs !== indicacaoClinica ? ` — ${obs}` : ''
      return `${index + 1}. ${exam.name}${suffix}`
    })

    return {
      kind: 'pedido_exame_nutricional',
      context: {} as ClinicalDocumentContext,
      sections: [
        ...(indicacaoClinica ? [{ title: 'Indicação clínica', lines: [indicacaoClinica] }] : []),
        { title: 'Exames solicitados', lines: examLines },
      ],
      urgent: body.pedidoExameNutricional.urgent === true,
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'relatorio_nutricional') {
    return {
      kind: 'relatorio_nutricional',
      context: {} as ClinicalDocumentContext,
      sections: buildNutritionistRelatorioSections(body.relatorioNutricional),
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'parecer_nutricional') {
    return {
      kind: 'parecer_nutricional',
      context: {} as ClinicalDocumentContext,
      sections: buildNutritionistParecerSections(body.parecerNutricional),
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'laudo_nutricional') {
    return {
      kind: 'laudo_nutricional',
      context: {} as ClinicalDocumentContext,
      sections: buildNutritionistLaudoSections(body.laudoNutricional),
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'declaracao_comparecimento_nutricional') {
    const lines = buildNutritionistDeclaracaoComparecimentoLines(
      body.context.patientName,
      body.declaracaoComparecimentoNutricional,
      formatBrazilianDateLabel,
    )
    return {
      kind: 'declaracao_comparecimento_nutricional',
      context: {} as ClinicalDocumentContext,
      sections: [{ title: 'Declaração', lines }],
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'atestado_fonoaudiologico') {
    const lines = buildFonoaudiologoAtestadoDeclarationLines(
      body.context.patientName,
      body.atestadoFonoaudiologico,
      formatBrazilianDateLabel,
      addDaysToIsoDate,
    )
    return {
      kind: 'atestado_fonoaudiologico',
      context: {} as ClinicalDocumentContext,
      sections: [{ title: 'Declaração', lines }],
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'declaracao_comparecimento_fonoaudiologico') {
    const lines = buildFonoaudiologoDeclaracaoComparecimentoLines(
      body.context.patientName,
      body.declaracaoComparecimentoFonoaudiologico,
      formatBrazilianDateLabel,
    )
    return {
      kind: 'declaracao_comparecimento_fonoaudiologico',
      context: {} as ClinicalDocumentContext,
      sections: [{ title: 'Declaração', lines }],
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'relatorio_fonoaudiologico') {
    return {
      kind: 'relatorio_fonoaudiologico',
      context: {} as ClinicalDocumentContext,
      sections: buildFonoaudiologoRelatorioSections(body.relatorioFonoaudiologico),
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'laudo_fonoaudiologico') {
    return {
      kind: 'laudo_fonoaudiologico',
      context: {} as ClinicalDocumentContext,
      sections: buildFonoaudiologoLaudoSections(body.laudoFonoaudiologico),
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'parecer_fonoaudiologico') {
    return {
      kind: 'parecer_fonoaudiologico',
      context: {} as ClinicalDocumentContext,
      sections: buildFonoaudiologoParecerSections(body.parecerFonoaudiologico),
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'plano_terapeutico_fonoaudiologico') {
    return {
      kind: 'plano_terapeutico_fonoaudiologico',
      context: {} as ClinicalDocumentContext,
      sections: buildFonoaudiologoPlanoTerapeuticoSections(body.planoTerapeuticoFonoaudiologico),
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'resultado_avaliacao_fonoaudiologico') {
    return {
      kind: 'resultado_avaliacao_fonoaudiologico',
      context: {} as ClinicalDocumentContext,
      sections: buildFonoaudiologoResultadoAvaliacaoSections(
        body.resultadoAvaliacaoFonoaudiologico,
      ),
      codigoVerificacao,
      verificationUrl,
    }
  }

  if (body.kind === 'encaminhamento_fonoaudiologico') {
    return {
      kind: 'encaminhamento_fonoaudiologico',
      context: {} as ClinicalDocumentContext,
      sections: buildFonoaudiologoEncaminhamentoSections(body.encaminhamentoFonoaudiologico),
      urgent: body.encaminhamentoFonoaudiologico.prioridade === 'urgente',
      codigoVerificacao,
      verificationUrl,
    }
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

  if (body.kind === 'atestado_psicologico') {
    return body.atestadoPsicologico.tipo === 'comparecimento'
      ? {
          titulo: 'Atestado psicológico de comparecimento',
          fileName: 'atestado-psicologico-comparecimento.pdf',
          metaLabel: `Comparecimento em ${formatBrazilianDateLabel(body.atestadoPsicologico.dataInicio)}`,
        }
      : {
          titulo: `Atestado psicológico (${body.atestadoPsicologico.diasAfastamento} dia(s))`,
          fileName: 'atestado-psicologico.pdf',
          metaLabel: `${body.atestadoPsicologico.diasAfastamento} dia(s) de afastamento`,
        }
  }

  if (body.kind === 'relatorio_psicologico') {
    return {
      titulo: 'Relatório psicológico',
      fileName: 'relatorio-psicologico.pdf',
      metaLabel: body.relatorioPsicologico.finalidade,
    }
  }

  if (body.kind === 'relatorio_multiprofissional') {
    return {
      titulo: 'Relatório multiprofissional',
      fileName: 'relatorio-multiprofissional.pdf',
      metaLabel: 'Equipe multiprofissional',
    }
  }

  if (body.kind === 'laudo_psicologico') {
    return {
      titulo: 'Laudo psicológico',
      fileName: 'laudo-psicologico.pdf',
      metaLabel: body.laudoPsicologico.objetoLaudo,
    }
  }

  if (body.kind === 'parecer_psicologico') {
    return {
      titulo: 'Parecer psicológico',
      fileName: 'parecer-psicologico.pdf',
      metaLabel: 'Parecer técnico',
    }
  }

  if (body.kind === 'encaminhamento_psicologico') {
    const urgent = body.encaminhamentoPsicologico.prioridade === 'urgente'
    return {
      titulo: urgent ? 'Encaminhamento psicológico (urgente)' : 'Encaminhamento psicológico',
      fileName: 'encaminhamento-psicologico.pdf',
      metaLabel: body.encaminhamentoPsicologico.destinoLabel,
    }
  }

  if (body.kind === 'plano_alimentar') {
    return {
      titulo: 'Plano alimentar',
      fileName: 'plano-alimentar.pdf',
      metaLabel: body.planoAlimentar.objetivo.slice(0, 80),
    }
  }

  if (body.kind === 'prescricao_dietetica') {
    return {
      titulo: 'Prescrição dietética',
      fileName: 'prescricao-dietetica.pdf',
      metaLabel: 'Dieta prescrita',
    }
  }

  if (body.kind === 'prescricao_suplementos') {
    return {
      titulo: 'Prescrição de suplementos',
      fileName: 'prescricao-suplementos.pdf',
      metaLabel:
        body.prescricaoSuplementos.suplementos.length === 1
          ? body.prescricaoSuplementos.suplementos[0].nome
          : `${body.prescricaoSuplementos.suplementos.length} suplementos`,
    }
  }

  if (body.kind === 'pedido_exame_nutricional') {
    return {
      titulo: body.pedidoExameNutricional.urgent
        ? 'Pedido de exames (urgente)'
        : 'Pedido de exames',
      fileName: 'pedido-exames.pdf',
      metaLabel:
        body.pedidoExameNutricional.exames.length === 1
          ? body.pedidoExameNutricional.exames[0].name
          : `${body.pedidoExameNutricional.exames.length} exames solicitados`,
    }
  }

  if (body.kind === 'relatorio_nutricional') {
    return {
      titulo: 'Relatório nutricional',
      fileName: 'relatorio-nutricional.pdf',
      metaLabel: body.relatorioNutricional.finalidade,
    }
  }

  if (body.kind === 'parecer_nutricional') {
    return {
      titulo: 'Parecer nutricional',
      fileName: 'parecer-nutricional.pdf',
      metaLabel: 'Parecer técnico',
    }
  }

  if (body.kind === 'laudo_nutricional') {
    return {
      titulo: 'Laudo / avaliação nutricional',
      fileName: 'laudo-nutricional.pdf',
      metaLabel: body.laudoNutricional.objetoLaudo,
    }
  }

  if (body.kind === 'declaracao_comparecimento_nutricional') {
    return {
      titulo: 'Declaração de comparecimento',
      fileName: 'declaracao-comparecimento-nutricional.pdf',
      metaLabel: `Comparecimento em ${formatBrazilianDateLabel(body.declaracaoComparecimentoNutricional.dataInicio)}`,
    }
  }

  if (body.kind === 'atestado_fonoaudiologico') {
    return body.atestadoFonoaudiologico.tipo === 'comparecimento'
      ? {
          titulo: 'Atestado fonoaudiológico de comparecimento',
          fileName: 'atestado-fonoaudiologico-comparecimento.pdf',
          metaLabel: `Comparecimento em ${formatBrazilianDateLabel(body.atestadoFonoaudiologico.dataInicio)}`,
        }
      : {
          titulo: `Atestado fonoaudiológico (${body.atestadoFonoaudiologico.diasAfastamento} dia(s))`,
          fileName: 'atestado-fonoaudiologico.pdf',
          metaLabel: `${body.atestadoFonoaudiologico.diasAfastamento} dia(s) de afastamento`,
        }
  }

  if (body.kind === 'declaracao_comparecimento_fonoaudiologico') {
    return {
      titulo: 'Declaração de comparecimento',
      fileName: 'declaracao-comparecimento-fonoaudiologico.pdf',
      metaLabel: `Comparecimento em ${formatBrazilianDateLabel(body.declaracaoComparecimentoFonoaudiologico.dataInicio)}`,
    }
  }

  if (body.kind === 'relatorio_fonoaudiologico') {
    return {
      titulo: 'Relatório fonoaudiológico',
      fileName: 'relatorio-fonoaudiologico.pdf',
      metaLabel: body.relatorioFonoaudiologico.finalidade,
    }
  }

  if (body.kind === 'laudo_fonoaudiologico') {
    return {
      titulo: 'Laudo fonoaudiológico',
      fileName: 'laudo-fonoaudiologico.pdf',
      metaLabel: body.laudoFonoaudiologico.objetoLaudo,
    }
  }

  if (body.kind === 'parecer_fonoaudiologico') {
    return {
      titulo: 'Parecer fonoaudiológico',
      fileName: 'parecer-fonoaudiologico.pdf',
      metaLabel: 'Parecer técnico',
    }
  }

  if (body.kind === 'plano_terapeutico_fonoaudiologico') {
    return {
      titulo: 'Plano terapêutico fonoaudiológico',
      fileName: 'plano-terapeutico-fonoaudiologico.pdf',
      metaLabel: body.planoTerapeuticoFonoaudiologico.objetivo.slice(0, 80),
    }
  }

  if (body.kind === 'resultado_avaliacao_fonoaudiologico') {
    return {
      titulo: 'Resultado de avaliação fonoaudiológica',
      fileName: 'resultado-avaliacao-fonoaudiologico.pdf',
      metaLabel: body.resultadoAvaliacaoFonoaudiologico.nomeExameAvaliacao,
    }
  }

  if (body.kind === 'encaminhamento_fonoaudiologico') {
    const urgent = body.encaminhamentoFonoaudiologico.prioridade === 'urgente'
    return {
      titulo: urgent ? 'Encaminhamento fonoaudiológico (urgente)' : 'Encaminhamento fonoaudiológico',
      fileName: 'encaminhamento-fonoaudiologico.pdf',
      metaLabel: body.encaminhamentoFonoaudiologico.destinoLabel,
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
