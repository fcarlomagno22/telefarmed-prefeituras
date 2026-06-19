import type {
  PsychologistAtestadoPdfData,
  PsychologistEncaminhamentoPdfData,
  PsychologistLaudoPdfData,
  PsychologistParecerPdfData,
  PsychologistRelatorioMultiprofissionalPdfData,
  PsychologistRelatorioPdfData,
} from '../../types/clinicalDocument'

function splitParagraph(text: string): string[] {
  return text
    .trim()
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

const RELATORIO_FINALIDADE_LABELS: Record<PsychologistRelatorioPdfData['finalidade'], string> = {
  acompanhamento: 'Acompanhamento psicológico',
  encaminhamento: 'Encaminhamento',
  escolar: 'Escolar / institucional',
  trabalhista: 'Trabalhista / ocupacional',
  judicial: 'Judicial / pericial',
  outro: 'Outra finalidade',
}

const LAUDO_TIPO_LABELS: Record<PsychologistLaudoPdfData['tipoLaudo'], string> = {
  avaliacao_psicologica: 'Avaliação psicológica',
  pericia: 'Perícia / avaliação pericial',
  aptidao: 'Aptidão / inaptidão',
  acompanhamento: 'Acompanhamento terapêutico',
  outro: 'Outro',
}

const ENCAMINHAMENTO_DESTINO_LABELS: Record<
  PsychologistEncaminhamentoPdfData['profissionalDestino'],
  string
> = {
  medico: 'Médico(a)',
  psiquiatra: 'Psiquiatra',
  outro_profissional: 'Outro profissional de saúde',
}

const PRIORIDADE_LABELS = {
  eletivo: 'Eletivo',
  prioritario: 'Prioritário',
  urgente: 'Urgente',
} as const

export function buildPsychologistAtestadoDeclarationLines(
  patientName: string,
  atestado: PsychologistAtestadoPdfData,
  formatDate: (isoDate: string) => string,
  addDays: (isoDate: string, days: number) => string,
): string[] {
  const dataLabel = formatDate(atestado.dataInicio)

  if (atestado.tipo === 'comparecimento') {
    const lines = [
      `Atesto, para os devidos fins, que o(a) paciente ${patientName} compareceu à sessão de atendimento psicológico nesta unidade em ${dataLabel}.`,
    ]
    if (atestado.observacoes?.trim()) {
      lines.push(`Observações: ${atestado.observacoes.trim()}`)
    }
    return lines
  }

  const dias = atestado.diasAfastamento ?? 1
  const dataFim = addDays(atestado.dataInicio, dias)
  const lines = [
    `Atesto, para os devidos fins, que o(a) paciente ${patientName} necessita de afastamento de suas atividades por ${dias} dia(s), por motivos psicológicos.`,
    `Período: ${dataLabel} a ${formatDate(dataFim)}.`,
    `Motivo: ${atestado.motivo?.trim() ?? ''}`,
  ]
  if (atestado.observacoes?.trim()) {
    lines.push(`Observações: ${atestado.observacoes.trim()}`)
  }
  return lines
}

export function buildPsychologistRelatorioSections(relatorio: PsychologistRelatorioPdfData) {
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
      title: 'Demanda e história psicológica',
      lines: [
        `Demanda psicológica: ${relatorio.demandaPsicologica.trim()}`,
        '',
        'História psicológica:',
        ...splitParagraph(relatorio.historiaPsicologica),
      ],
    },
    {
      title: 'Avaliação psicológica',
      lines: [
        ...(relatorio.instrumentosAplicados?.trim()
          ? ['Instrumentos aplicados:', ...splitParagraph(relatorio.instrumentosAplicados)]
          : []),
        '',
        'Avaliação psicológica:',
        ...splitParagraph(relatorio.avaliacaoPsicologica),
        '',
        `Hipótese psicológica: ${relatorio.hipotesePsicologica.trim()}`,
      ].filter(Boolean),
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

export function buildPsychologistRelatorioMultiprofissionalSections(
  relatorio: PsychologistRelatorioMultiprofissionalPdfData,
) {
  return [
    {
      title: 'Identificação',
      lines: [
        ...(relatorio.destinatario?.trim()
          ? [`Destinatário: ${relatorio.destinatario.trim()}`]
          : []),
        `Motivo do relatório: ${relatorio.motivoRelatorio.trim()}`,
      ],
    },
    {
      title: 'Equipe e demanda',
      lines: [
        'Equipe envolvida:',
        ...splitParagraph(relatorio.equipeEnvolvida),
        '',
        'Demanda compartilhada:',
        ...splitParagraph(relatorio.demandaCompartilhada),
      ],
    },
    {
      title: 'Contribuições profissionais',
      lines: splitParagraph(relatorio.contribuicoesProfissionais),
    },
    {
      title: 'Síntese e conduta integrada',
      lines: [
        'Síntese clínica:',
        ...splitParagraph(relatorio.sinteseClinica),
        '',
        'Conduta integrada:',
        ...splitParagraph(relatorio.condutaIntegrada),
      ],
    },
    {
      title: 'Conclusão multiprofissional',
      lines: [
        ...splitParagraph(relatorio.conclusaoMultiprofissional),
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

export function buildPsychologistLaudoSections(laudo: PsychologistLaudoPdfData) {
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
      title: 'Metodologia',
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

export function buildPsychologistParecerSections(parecer: PsychologistParecerPdfData) {
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

export function buildPsychologistEncaminhamentoSections(
  encaminhamento: PsychologistEncaminhamentoPdfData,
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
      title: 'Resumo do atendimento psicológico',
      lines: splitParagraph(encaminhamento.resumoAtendimento),
    },
    {
      title: 'Hipótese psicológica',
      lines: [encaminhamento.hipotesePsicologica.trim()],
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
