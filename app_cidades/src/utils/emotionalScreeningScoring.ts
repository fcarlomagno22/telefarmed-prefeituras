import type {
  EmotionalScreeningAnswers,
  EmotionalScreeningComputedResult,
  EmotionalScreeningInstrumentId,
  EmotionalScreeningResultBand,
  EmotionalScreeningSeverityTone,
} from '../types/emotionalScreening'

function band(
  id: string,
  label: string,
  description: string,
  tone: EmotionalScreeningSeverityTone,
): EmotionalScreeningResultBand {
  return { id, label, description, tone }
}

function sumNumericAnswers(answers: EmotionalScreeningAnswers, questionIds: string[]): number {
  return questionIds.reduce((total, id) => {
    const value = answers[id]
    return total + (typeof value === 'number' ? value : 0)
  }, 0)
}

function countYes(answers: EmotionalScreeningAnswers, questionIds: string[]): number {
  return questionIds.reduce((total, id) => {
    const value = answers[id]
    if (value === 1 || value === 'yes' || value === true) return total + 1
    return total
  }, 0)
}

function gad7Band(score: number): EmotionalScreeningResultBand {
  if (score <= 4) {
    return band('minimal', 'Mínimo', 'Sinais mínimos de ansiedade no momento.', 'calm')
  }
  if (score <= 9) {
    return band('mild', 'Leve', 'Sinais leves de ansiedade compatíveis com triagem positiva leve.', 'attention')
  }
  if (score <= 14) {
    return band('moderate', 'Moderado', 'Sinais moderados de ansiedade. Avaliação profissional recomendada.', 'elevated')
  }
  return band('severe', 'Grave', 'Sinais graves de ansiedade. Busque avaliação profissional.', 'elevated')
}

function phq9Band(score: number, suicidalItem: number): EmotionalScreeningResultBand {
  if (suicidalItem >= 1) {
    return band(
      'risk',
      'Atenção imediata',
      'Há indicação de pensamentos de autolesão. Busque apoio profissional ou emergencial agora.',
      'urgent',
    )
  }
  if (score <= 4) return band('minimal', 'Mínimo', 'Sinais mínimos de depressão no momento.', 'calm')
  if (score <= 9) return band('mild', 'Leve', 'Sinais leves compatíveis com triagem positiva leve.', 'attention')
  if (score <= 14) {
    return band('moderate', 'Moderado', 'Sinais moderados. Avaliação profissional recomendada.', 'elevated')
  }
  if (score <= 19) {
    return band('mod_severe', 'Moderadamente grave', 'Sinais relevantes. Avaliação profissional recomendada.', 'elevated')
  }
  return band('severe', 'Grave', 'Sinais graves. Busque avaliação profissional.', 'elevated')
}

function cssrsBand(answers: EmotionalScreeningAnswers): EmotionalScreeningResultBand {
  const risk =
    countYes(answers, ['cssrs_q2', 'cssrs_q3', 'cssrs_q4', 'cssrs_q5', 'cssrs_q6']) > 0 ||
    (answers.cssrs_q1 === 1 && countYes(answers, ['cssrs_q2']) > 0)

  if (risk || countYes(answers, ['cssrs_q6']) > 0) {
    return band(
      'urgent',
      'Risco identificado',
      'Suas respostas indicam risco. Procure apoio imediato — CVV 188 ou emergência.',
      'urgent',
    )
  }
  if (answers.cssrs_q1 === 1) {
    return band(
      'attention',
      'Sinais de sofrimento',
      'Há sinais de sofrimento emocional. Conversar com um profissional é recomendado.',
      'attention',
    )
  }
  return band('low', 'Sem sinais atuais', 'Não foram identificados sinais de risco imediato nesta triagem.', 'calm')
}

function asrsBand(answers: EmotionalScreeningAnswers): EmotionalScreeningResultBand {
  const ids = ['asrs_q1', 'asrs_q2', 'asrs_q3', 'asrs_q4', 'asrs_q5', 'asrs_q6']
  const positive = ids.filter((id) => (answers[id] as number) >= 3).length
  if (positive >= 4) {
    return band(
      'compatible',
      'Sinais compatíveis',
      'Há sinais compatíveis com TDAH. Avaliação com profissional de saúde mental é recomendada.',
      'elevated',
    )
  }
  if (positive >= 2) {
    return band(
      'possible',
      'Sinais possíveis',
      'Alguns sinais merecem atenção. Considere conversar com um profissional.',
      'attention',
    )
  }
  return band('low', 'Poucos sinais', 'Poucos sinais de atenção/organização nesta triagem.', 'calm')
}

function snapBand(answers: EmotionalScreeningAnswers): EmotionalScreeningComputedResult {
  const inattentionIds = Array.from({ length: 9 }, (_, i) => `snap_q${i + 1}`)
  const hyperactivityIds = Array.from({ length: 9 }, (_, i) => `snap_q${i + 10}`)
  const inattention = sumNumericAnswers(answers, inattentionIds) / 9
  const hyperactivity = sumNumericAnswers(answers, hyperactivityIds) / 9
  const total = inattention + hyperactivity

  const subscaleBand = (avg: number): EmotionalScreeningResultBand => {
    if (avg < 1.5) return band('low', 'Baixo', 'Poucos sinais nesta área.', 'calm')
    if (avg < 2) return band('mild', 'Leve', 'Sinais leves nesta área.', 'attention')
    return band('elevated', 'Elevado', 'Sinais relevantes nesta área.', 'elevated')
  }

  const overall =
    total >= 3.5
      ? band('compatible', 'Sinais compatíveis', 'Sinais compatíveis com TDAH/TOD. Avaliação profissional recomendada.', 'elevated')
      : total >= 2.5
        ? band('attention', 'Atenção', 'Alguns sinais comportamentais merecem avaliação.', 'attention')
        : band('low', 'Baixo', 'Poucos sinais nesta triagem.', 'calm')

  return {
    totalScore: Math.round(total * 10) / 10,
    band: overall,
    subscales: [
      { id: 'inattention', label: 'Atenção', score: Math.round(inattention * 10) / 10, band: subscaleBand(inattention) },
      {
        id: 'hyperactivity',
        label: 'Hiperatividade',
        score: Math.round(hyperactivity * 10) / 10,
        band: subscaleBand(hyperactivity),
      },
    ],
    safetyTriggered: false,
    recommendations: ['Converse com pediatra ou profissional de saúde mental sobre os resultados.'],
  }
}

function scaredBand(score: number): EmotionalScreeningResultBand {
  if (score >= 25) {
    return band('elevated', 'Elevado', 'Sinais relevantes de ansiedade. Avaliação profissional recomendada.', 'elevated')
  }
  if (score >= 15) {
    return band('moderate', 'Moderado', 'Sinais moderados de ansiedade. Considere buscar apoio.', 'attention')
  }
  return band('low', 'Baixo', 'Poucos sinais de ansiedade nesta triagem.', 'calm')
}

function psc17Band(score: number): EmotionalScreeningResultBand {
  if (score >= 28) {
    return band('positive', 'Triagem positiva', 'Sinais compatíveis com dificuldades emocionais/comportamentais.', 'elevated')
  }
  if (score >= 17) {
    return band('borderline', 'Atenção', 'Alguns sinais merecem acompanhamento profissional.', 'attention')
  }
  return band('low', 'Baixo', 'Poucos sinais nesta triagem geral.', 'calm')
}

function mchatBand(answers: EmotionalScreeningAnswers): EmotionalScreeningResultBand {
  const failItems = [
    'mchat_q2',
    'mchat_q5',
    'mchat_q12',
    'mchat_q13',
    'mchat_q15',
    'mchat_q19',
    'mchat_q20',
  ]
  const fails = failItems.filter((id) => answers[id] === 0).length
  const totalFails = Array.from({ length: 20 }, (_, i) => `mchat_q${i + 1}`).filter(
    (id) => answers[id] === 0,
  ).length

  if (fails >= 2 || totalFails >= 3) {
    return band('high', 'Risco elevado', 'Sinais compatíveis com risco para TEA. Avaliação especializada recomendada.', 'elevated')
  }
  if (totalFails >= 2) {
    return band('medium', 'Risco médio', 'Alguns sinais merecem avaliação do desenvolvimento.', 'attention')
  }
  return band('low', 'Risco baixo', 'Poucos sinais nesta triagem. Mantenha acompanhamento pediátrico de rotina.', 'calm')
}

function isiBand(score: number): EmotionalScreeningResultBand {
  if (score <= 7) return band('none', 'Sem insônia clínica', 'Sono dentro do esperado nesta triagem.', 'calm')
  if (score <= 14) return band('subthreshold', 'Subclínico', 'Alguns sintomas de insônia. Monitore e busque apoio se persistirem.', 'attention')
  if (score <= 21) return band('moderate', 'Moderado', 'Insônia moderada. Avaliação profissional pode ajudar.', 'elevated')
  return band('severe', 'Grave', 'Insônia grave. Busque avaliação profissional.', 'elevated')
}

function auditBand(score: number): EmotionalScreeningResultBand {
  if (score >= 4) {
    return band('risk', 'Uso de risco', 'Padrão de consumo indica risco. Avaliação profissional recomendada.', 'elevated')
  }
  if (score >= 3) {
    return band('attention', 'Atenção', 'Consumo merece atenção. Considere conversar com um profissional.', 'attention')
  }
  return band('low', 'Baixo risco', 'Consumo dentro de faixa de baixo risco nesta triagem.', 'calm')
}

function pcl5Band(score: number): EmotionalScreeningResultBand {
  if (score >= 31) {
    return band('compatible', 'Sinais compatíveis', 'Sintomas compatíveis com TEPT. Avaliação profissional recomendada.', 'elevated')
  }
  if (score >= 20) {
    return band('moderate', 'Moderado', 'Sintomas relevantes após trauma. Considere buscar apoio.', 'attention')
  }
  return band('low', 'Baixo', 'Poucos sintomas nesta triagem.', 'calm')
}

function withRecommendations(
  result: EmotionalScreeningComputedResult,
  extra: string[] = [],
): EmotionalScreeningComputedResult {
  const base = result.safetyTriggered
    ? [
        'Procure apoio imediato: CVV 188 (24h) ou serviço de emergência.',
        'Converse com um profissional de saúde mental o quanto antes.',
      ]
    : ['Este resultado indica sinais compatíveis e recomenda uma avaliação profissional.']
  return {
    ...result,
    recommendations: [...base, ...extra],
  }
}

export function computeEmotionalScreeningResult(
  instrumentId: EmotionalScreeningInstrumentId,
  answers: EmotionalScreeningAnswers,
): EmotionalScreeningComputedResult {
  switch (instrumentId) {
    case 'gad-7': {
      const ids = Array.from({ length: 7 }, (_, i) => `gad7_q${i + 1}`)
      const score = sumNumericAnswers(answers, ids)
      return withRecommendations({
        totalScore: score,
        band: gad7Band(score),
        safetyTriggered: false,
        recommendations: [],
      })
    }
    case 'phq-9': {
      const ids = Array.from({ length: 9 }, (_, i) => `phq9_q${i + 1}`)
      const score = sumNumericAnswers(answers, ids)
      const suicidalItem = (answers.phq9_q9 as number) ?? 0
      const resultBand = phq9Band(score, suicidalItem)
      return withRecommendations({
        totalScore: score,
        band: resultBand,
        safetyTriggered: suicidalItem >= 1 || resultBand.tone === 'urgent',
        safetyMessage:
          suicidalItem >= 1
            ? 'Você indicou pensamentos de autolesão. Busque apoio profissional ou emergencial agora.'
            : undefined,
        recommendations: [],
      })
    }
    case 'cssrs': {
      const bandResult = cssrsBand(answers)
      return withRecommendations({
        totalScore: null,
        band: bandResult,
        safetyTriggered: bandResult.tone === 'urgent',
        safetyMessage:
          bandResult.tone === 'urgent'
            ? 'Suas respostas indicam risco. Procure apoio imediato.'
            : undefined,
        recommendations: [],
      })
    }
    case 'asrs': {
      const ids = Array.from({ length: 6 }, (_, i) => `asrs_q${i + 1}`)
      const score = sumNumericAnswers(answers, ids)
      return withRecommendations({
        totalScore: score,
        band: asrsBand(answers),
        safetyTriggered: false,
        recommendations: [],
      })
    }
    case 'snap-iv':
      return withRecommendations(snapBand(answers))
    case 'scared': {
      const ids = Array.from({ length: 10 }, (_, i) => `scared_q${i + 1}`)
      const score = sumNumericAnswers(answers, ids)
      return withRecommendations({
        totalScore: score,
        band: scaredBand(score),
        safetyTriggered: false,
        recommendations: [],
      })
    }
    case 'psc-17': {
      const ids = Array.from({ length: 17 }, (_, i) => `psc17_q${i + 1}`)
      const score = sumNumericAnswers(answers, ids)
      return withRecommendations({
        totalScore: score,
        band: psc17Band(score),
        safetyTriggered: false,
        recommendations: [],
      })
    }
    case 'mchat-r': {
      const fails = Array.from({ length: 20 }, (_, i) => `mchat_q${i + 1}`).filter(
        (id) => answers[id] === 0,
      ).length
      const bandResult = mchatBand(answers)
      return withRecommendations({
        totalScore: fails,
        band: bandResult,
        safetyTriggered: false,
        recommendations: ['Agende avaliação do desenvolvimento com pediatra ou neuropediatra.'],
      })
    }
    case 'isi': {
      const ids = Array.from({ length: 7 }, (_, i) => `isi_q${i + 1}`)
      const score = sumNumericAnswers(answers, ids)
      return withRecommendations({
        totalScore: score,
        band: isiBand(score),
        safetyTriggered: false,
        recommendations: [],
      })
    }
    case 'audit-c': {
      const ids = ['audit_q1', 'audit_q2', 'audit_q3']
      const score = sumNumericAnswers(answers, ids)
      return withRecommendations({
        totalScore: score,
        band: auditBand(score),
        safetyTriggered: false,
        recommendations: [],
      })
    }
    case 'pcl-5': {
      const ids = Array.from({ length: 20 }, (_, i) => `pcl5_q${i + 1}`)
      const score = sumNumericAnswers(answers, ids)
      return withRecommendations({
        totalScore: score,
        band: pcl5Band(score),
        safetyTriggered: false,
        recommendations: [],
      })
    }
    default:
      return withRecommendations({
        totalScore: null,
        band: band('unknown', 'Resultado', 'Triagem concluída.', 'calm'),
        safetyTriggered: false,
        recommendations: [],
      })
  }
}

export function getSeverityColor(tone: EmotionalScreeningSeverityTone): string {
  switch (tone) {
    case 'urgent':
      return '#f87171'
    case 'elevated':
      return '#fb923c'
    case 'attention':
      return '#fbbf24'
    default:
      return '#86efac'
  }
}
