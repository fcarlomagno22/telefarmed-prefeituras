import type {
  FonoaudiologoAtestadoPdfData,
  FonoaudiologoDeclaracaoComparecimentoPdfData,
  FonoaudiologoEncaminhamentoPdfData,
  FonoaudiologoLaudoPdfData,
  FonoaudiologoParecerPdfData,
  FonoaudiologoPlanoTerapeuticoPdfData,
  FonoaudiologoRelatorioPdfData,
  FonoaudiologoResultadoAvaliacaoPdfData,
} from './types.js'

function splitParagraph(text: string): string[] {
  return text
    .trim()
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

const RELATORIO_FINALIDADE_LABELS: Record<FonoaudiologoRelatorioPdfData['finalidade'], string> = {
  acompanhamento: 'Acompanhamento fonoaudiológico',
  encaminhamento: 'Encaminhamento',
  escolar: 'Escolar / institucional',
  trabalhista: 'Trabalhista / ocupacional',
  judicial: 'Judicial / pericial',
  outro: 'Outra finalidade',
}

const LAUDO_TIPO_LABELS: Record<FonoaudiologoLaudoPdfData['tipoLaudo'], string> = {
  avaliacao_fonoaudiologica: 'Avaliação fonoaudiológica',
  linguagem: 'Linguagem',
  audicao: 'Audição',
  voz: 'Voz',
  degluticao: 'Deglutição',
  motricidade_orofacial: 'Motricidade orofacial',
  pericia: 'Perícia / avaliação pericial',
  outro: 'Outro',
}

const RESULTADO_AVALIACAO_TIPO_LABELS: Record<
  FonoaudiologoResultadoAvaliacaoPdfData['tipoAvaliacao'],
  string
> = {
  audiologica: 'Audiológica',
  linguagem: 'Linguagem',
  voz: 'Voz',
  degluticao: 'Deglutição',
  motricidade_orofacial: 'Motricidade orofacial',
  outro: 'Outro',
}

const ENCAMINHAMENTO_DESTINO_LABELS: Record<
  FonoaudiologoEncaminhamentoPdfData['profissionalDestino'],
  string
> = {
  medico: 'Médico(a)',
  otorrinolaringologista: 'Otorrinolaringologista',
  neurologista: 'Neurologista',
  outro_profissional: 'Outro profissional de saúde',
}

const PRIORIDADE_LABELS = {
  eletivo: 'Eletivo',
  prioritario: 'Prioritário',
  urgente: 'Urgente',
} as const

export function buildFonoaudiologoAtestadoDeclarationLines(
  patientName: string,
  atestado: FonoaudiologoAtestadoPdfData,
  formatDate: (isoDate: string) => string,
  addDays: (isoDate: string, days: number) => string,
): string[] {
  const dataLabel = formatDate(atestado.dataInicio)

  if (atestado.tipo === 'comparecimento') {
    const lines = [
      `Atesto, para os devidos fins, que o(a) paciente ${patientName} compareceu à sessão de atendimento fonoaudiológico nesta unidade em ${dataLabel}.`,
    ]
    if (atestado.observacoes?.trim()) {
      lines.push(`Observações: ${atestado.observacoes.trim()}`)
    }
    return lines
  }

  const dias = atestado.diasAfastamento ?? 1
  const dataFim = addDays(atestado.dataInicio, dias)
  const lines = [
    `Atesto, para os devidos fins, que o(a) paciente ${patientName} necessita de afastamento de suas atividades por ${dias} dia(s), por motivos fonoaudiológicos.`,
    `Período: ${dataLabel} a ${formatDate(dataFim)}.`,
    `Motivo: ${atestado.motivo?.trim() ?? ''}`,
  ]
  if (atestado.observacoes?.trim()) {
    lines.push(`Observações: ${atestado.observacoes.trim()}`)
  }
  return lines
}

export function buildFonoaudiologoDeclaracaoComparecimentoLines(
  patientName: string,
  data: FonoaudiologoDeclaracaoComparecimentoPdfData,
  formatDate: (isoDate: string) => string,
): string[] {
  const lines = [
    `Declaro, para os devidos fins, que o(a) paciente ${patientName} compareceu à consulta fonoaudiológica nesta unidade em ${formatDate(data.dataInicio)}.`,
  ]
  if (data.observacoes?.trim()) {
    lines.push(`Observações: ${data.observacoes.trim()}`)
  }
  return lines
}

export function buildFonoaudiologoRelatorioSections(relatorio: FonoaudiologoRelatorioPdfData) {
  return [
    {
      title: 'Identificação',
      lines: [
        `Finalidade: ${RELATORIO_FINALIDADE_LABELS[relatorio.finalidade]}`,
        ...(relatorio.destinatario?.trim()
          ? [`Destinatário: ${relatorio.destinatario.trim()}`]
          : []),
        `Motivo do relatório: ${relatorio.motivoRelatorio.trim()}`,
      ],
    },
    {
      title: 'Demanda e história fonoaudiológica',
      lines: [
        `Demanda fonoaudiológica: ${relatorio.demandaFonoaudiologica.trim()}`,
        '',
        'História fonoaudiológica:',
        ...splitParagraph(relatorio.historiaFonoaudiologica),
      ],
    },
    {
      title: 'Avaliação fonoaudiológica',
      lines: [
        'Avaliação fonoaudiológica:',
        ...splitParagraph(relatorio.avaliacaoFonoaudiologica),
        '',
        `Hipótese fonoaudiológica: ${relatorio.hipoteseFonoaudiologica.trim()}`,
      ],
    },
    {
      title: 'Intervenções e evolução',
      lines: [
        'Intervenções realizadas:',
        ...splitParagraph(relatorio.intervencoesRealizadas),
        ...(relatorio.evolucao?.trim()
          ? ['', 'Evolução:', ...splitParagraph(relatorio.evolucao)]
          : []),
      ],
    },
    {
      title: 'Conclusão',
      lines: [
        ...splitParagraph(relatorio.conclusao),
        ...(relatorio.recomendacoes?.trim()
          ? ['', 'Recomendações:', ...splitParagraph(relatorio.recomendacoes)]
          : []),
        ...(relatorio.observacoes?.trim()
          ? ['', 'Observações:', ...splitParagraph(relatorio.observacoes)]
          : []),
      ],
    },
  ]
}

export function buildFonoaudiologoLaudoSections(laudo: FonoaudiologoLaudoPdfData) {
  return [
    {
      title: 'Identificação do laudo',
      lines: [
        `Tipo: ${LAUDO_TIPO_LABELS[laudo.tipoLaudo]}`,
        ...(laudo.destinatario?.trim() ? [`Destinatário: ${laudo.destinatario.trim()}`] : []),
        `Objeto: ${laudo.objetoLaudo.trim()}`,
      ],
    },
    {
      title: 'Metodologia e instrumentos',
      lines: splitParagraph(laudo.metodologiaInstrumentos),
    },
    {
      title: 'Achados',
      lines: splitParagraph(laudo.descricaoAchados),
    },
    {
      title: 'Análise e interpretação',
      lines: splitParagraph(laudo.analiseInterpretacao),
    },
    {
      title: 'Conclusão',
      lines: [
        ...splitParagraph(laudo.conclusaoLaudo),
        ...(laudo.recomendacoes?.trim()
          ? ['', 'Recomendações:', ...splitParagraph(laudo.recomendacoes)]
          : []),
        ...(laudo.observacoes?.trim()
          ? ['', 'Observações:', ...splitParagraph(laudo.observacoes)]
          : []),
      ],
    },
  ]
}

export function buildFonoaudiologoParecerSections(parecer: FonoaudiologoParecerPdfData) {
  return [
    {
      title: 'Identificação',
      lines: [
        ...(parecer.destinatario?.trim() ? [`Destinatário: ${parecer.destinatario.trim()}`] : []),
        'Questão apresentada:',
        ...splitParagraph(parecer.questaoApresentada),
      ],
    },
    {
      title: 'Contexto da avaliação',
      lines: splitParagraph(parecer.contextoAvaliacao),
    },
    {
      title: 'Análise técnica',
      lines: splitParagraph(parecer.analiseTecnica),
    },
    {
      title: 'Parecer conclusivo',
      lines: [
        ...splitParagraph(parecer.parecerConclusivo),
        ...(parecer.recomendacoes?.trim()
          ? ['', 'Recomendações:', ...splitParagraph(parecer.recomendacoes)]
          : []),
        ...(parecer.observacoes?.trim()
          ? ['', 'Observações:', ...splitParagraph(parecer.observacoes)]
          : []),
      ],
    },
  ]
}

export function buildFonoaudiologoPlanoTerapeuticoSections(
  plano: FonoaudiologoPlanoTerapeuticoPdfData,
) {
  return [
    {
      title: 'Objetivo terapêutico',
      lines: [plano.objetivo.trim()],
    },
    {
      title: 'Diagnóstico e metas',
      lines: [
        `Diagnóstico fonoaudiológico: ${plano.diagnosticoFonoaudiologico.trim()}`,
        '',
        'Metas terapêuticas:',
        ...splitParagraph(plano.metasTerapeuticas),
      ],
    },
    {
      title: 'Procedimentos e orientações',
      lines: [
        ...splitParagraph(plano.procedimentosOrientacoes),
        ...(plano.frequenciaDuracao?.trim()
          ? ['', `Frequência e duração: ${plano.frequenciaDuracao.trim()}`]
          : []),
        ...(plano.orientacoesGerais?.trim()
          ? ['', 'Orientações gerais:', ...splitParagraph(plano.orientacoesGerais)]
          : []),
        ...(plano.observacoes?.trim()
          ? ['', 'Observações:', ...splitParagraph(plano.observacoes)]
          : []),
      ],
    },
  ]
}

export function buildFonoaudiologoResultadoAvaliacaoSections(
  resultado: FonoaudiologoResultadoAvaliacaoPdfData,
) {
  return [
    {
      title: 'Identificação da avaliação',
      lines: [
        `Tipo de avaliação: ${RESULTADO_AVALIACAO_TIPO_LABELS[resultado.tipoAvaliacao]}`,
        `Exame / avaliação: ${resultado.nomeExameAvaliacao.trim()}`,
      ],
    },
    {
      title: 'Metodologia',
      lines: splitParagraph(resultado.metodologia),
    },
    {
      title: 'Resultados',
      lines: splitParagraph(resultado.resultados),
    },
    {
      title: 'Interpretação e conclusão',
      lines: [
        'Interpretação:',
        ...splitParagraph(resultado.interpretacao),
        '',
        'Conclusão:',
        ...splitParagraph(resultado.conclusao),
        ...(resultado.observacoes?.trim()
          ? ['', 'Observações:', ...splitParagraph(resultado.observacoes)]
          : []),
      ],
    },
  ]
}

export function buildFonoaudiologoEncaminhamentoSections(
  encaminhamento: FonoaudiologoEncaminhamentoPdfData,
) {
  return [
    {
      title: 'Destino do encaminhamento',
      lines: [
        `Profissional de destino: ${ENCAMINHAMENTO_DESTINO_LABELS[encaminhamento.profissionalDestino]}`,
        `Serviço / especialidade: ${encaminhamento.destinoLabel.trim()}`,
        `Prioridade: ${PRIORIDADE_LABELS[encaminhamento.prioridade]}`,
      ],
    },
    {
      title: 'Motivo',
      lines: splitParagraph(encaminhamento.motivoEncaminhamento),
    },
    {
      title: 'Resumo do atendimento fonoaudiológico',
      lines: splitParagraph(encaminhamento.resumoAtendimento),
    },
    {
      title: 'Hipótese fonoaudiológica',
      lines: [encaminhamento.hipoteseFonoaudiologica.trim()],
    },
    {
      title: 'Conduta realizada',
      lines: splitParagraph(encaminhamento.condutaRealizada),
    },
    {
      title: 'Expectativa do encaminhamento',
      lines: [
        ...splitParagraph(encaminhamento.expectativaEncaminhamento),
        ...(encaminhamento.observacoes?.trim()
          ? ['', 'Observações:', ...splitParagraph(encaminhamento.observacoes)]
          : []),
      ],
    },
  ]
}
