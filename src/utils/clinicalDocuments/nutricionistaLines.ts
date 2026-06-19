import type {
  NutritionistDeclaracaoComparecimentoPdfData,
  NutritionistLaudoPdfData,
  NutritionistParecerPdfData,
  NutritionistPlanoAlimentarPdfData,
  NutritionistPrescricaoDieteticaPdfData,
  NutritionistPrescricaoSuplementosPdfData,
  NutritionistRelatorioPdfData,
} from '../../types/clinicalDocument'
import { buildPlanoAlimentarMealLines } from './planoAlimentarRefeicoes'

function splitParagraph(text: string): string[] {
  return text
    .trim()
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

const RELATORIO_FINALIDADE_LABELS: Record<NutritionistRelatorioPdfData['finalidade'], string> = {
  acompanhamento: 'Acompanhamento nutricional',
  encaminhamento: 'Encaminhamento',
  escolar: 'Escolar / institucional',
  trabalhista: 'Trabalhista / ocupacional',
  judicial: 'Judicial / pericial',
  outro: 'Outra finalidade',
}

const LAUDO_TIPO_LABELS: Record<NutritionistLaudoPdfData['tipoLaudo'], string> = {
  avaliacao_nutricional: 'Avaliação nutricional',
  antropometrica: 'Avaliação antropométrica',
  dietoterapia: 'Dietoterapia / plano alimentar',
  pericia: 'Perícia / avaliação pericial',
  outro: 'Outro',
}

export function buildNutritionistPlanoAlimentarSections(data: NutritionistPlanoAlimentarPdfData) {
  const mealLines = data.refeicoes?.length
    ? buildPlanoAlimentarMealLines(data.refeicoes)
    : splitParagraph(data.planoRefeicoes ?? '')

  return [
    {
      title: 'Objetivo do plano',
      lines: [data.objetivo.trim()],
    },
    {
      title: 'Plano alimentar',
      lines: [
        ...(data.restricoesAlimentares?.trim()
          ? ['Restrições e cuidados alimentares:', ...splitParagraph(data.restricoesAlimentares)]
          : []),
        '',
        'Distribuição das refeições:',
        ...mealLines,
      ].filter(Boolean),
    },
    {
      title: 'Orientações',
      lines: [
        ...(data.orientacoesGerais?.trim()
          ? splitParagraph(data.orientacoesGerais)
          : ['Seguir o plano alimentar conforme orientado neste documento.']),
        ...(data.duracaoPlano?.trim() ? [`Duração prevista: ${data.duracaoPlano.trim()}`] : []),
        ...(data.observacoes?.trim() ? ['', 'Observações:', ...splitParagraph(data.observacoes)] : []),
      ],
    },
  ]
}

export function buildNutritionistPrescricaoDieteticaSections(
  data: NutritionistPrescricaoDieteticaPdfData,
) {
  return [
    {
      title: 'Indicação clínica',
      lines: [data.indicacaoClinica.trim()],
    },
    {
      title: 'Prescrição dietética',
      lines: splitParagraph(data.prescricao),
    },
    {
      title: 'Observações',
      lines: [
        ...(data.restricoes?.trim()
          ? ['Restrições alimentares:', ...splitParagraph(data.restricoes)]
          : []),
        ...(data.observacoes?.trim() ? ['', ...splitParagraph(data.observacoes)] : []),
      ].filter(Boolean),
    },
  ]
}

export function buildNutritionistPrescricaoSuplementosSections(
  data: NutritionistPrescricaoSuplementosPdfData,
) {
  const supplementLines = data.suplementos.flatMap((item, index) => {
    const lines = [`${index + 1}. ${item.nome.trim()}`]
    if (item.dosagem?.trim()) lines.push(`   Dosagem: ${item.dosagem.trim()}`)
    if (item.frequencia?.trim()) lines.push(`   Posologia: ${item.frequencia.trim()}`)
    if (item.duracao?.trim()) lines.push(`   Duração: ${item.duracao.trim()}`)
    if (item.observacoes?.trim()) lines.push(`   Obs.: ${item.observacoes.trim()}`)
    return lines
  })

  return [
    {
      title: 'Indicação clínica',
      lines: [data.indicacaoClinica.trim()],
    },
    {
      title: 'Suplementos prescritos',
      lines: supplementLines,
    },
    ...(data.observacoesGerais?.trim()
      ? [{ title: 'Observações gerais', lines: splitParagraph(data.observacoesGerais) }]
      : []),
  ]
}

export function buildNutritionistRelatorioSections(relatorio: NutritionistRelatorioPdfData) {
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
      title: 'Anamnese nutricional',
      lines: splitParagraph(relatorio.anamneseNutricional),
    },
    {
      title: 'Avaliação',
      lines: [
        'Avaliação antropométrica:',
        ...splitParagraph(relatorio.avaliacaoAntropometrica),
        '',
        'Avaliação dietética:',
        ...splitParagraph(relatorio.avaliacaoDietetica),
        '',
        `Diagnóstico nutricional: ${relatorio.diagnosticoNutricional.trim()}`,
      ],
    },
    {
      title: 'Intervenção e conclusão',
      lines: [
        'Intervenção proposta:',
        ...splitParagraph(relatorio.intervencaoProposta),
        '',
        'Conclusão:',
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

export function buildNutritionistParecerSections(parecer: NutritionistParecerPdfData) {
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

export function buildNutritionistLaudoSections(laudo: NutritionistLaudoPdfData) {
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
      title: 'Metodologia de avaliação',
      lines: splitParagraph(laudo.metodologiaAvaliacao),
    },
    {
      title: 'Achados',
      lines: splitParagraph(laudo.achados),
    },
    {
      title: 'Interpretação',
      lines: splitParagraph(laudo.interpretacao),
    },
    {
      title: 'Conclusão',
      lines: [
        ...splitParagraph(laudo.conclusao),
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

export function buildNutritionistDeclaracaoComparecimentoLines(
  patientName: string,
  data: NutritionistDeclaracaoComparecimentoPdfData,
  formatDate: (isoDate: string) => string,
): string[] {
  const lines = [
    `Declaro, para os devidos fins, que o(a) paciente ${patientName} compareceu à consulta nutricional nesta unidade em ${formatDate(data.dataInicio)}.`,
  ]
  if (data.observacoes?.trim()) {
    lines.push(`Observações: ${data.observacoes.trim()}`)
  }
  return lines
}
