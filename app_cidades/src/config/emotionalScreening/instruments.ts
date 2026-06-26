import type {
  EmotionalScreeningInstrument,
  EmotionalScreeningQuestion,
  EmotionalScreeningQuestionOption,
} from '../../types/emotionalScreening'

const LIKERT_4_FREQUENCY: EmotionalScreeningQuestionOption[] = [
  { value: 0, label: 'Nenhum dia' },
  { value: 1, label: 'Vários dias' },
  { value: 2, label: 'Mais da metade dos dias' },
  { value: 3, label: 'Quase todos os dias' },
]

const LIKERT_5_FREQUENCY: EmotionalScreeningQuestionOption[] = [
  { value: 0, label: 'Nunca' },
  { value: 1, label: 'Raramente' },
  { value: 2, label: 'Às vezes' },
  { value: 3, label: 'Frequentemente' },
  { value: 4, label: 'Muito frequentemente' },
]

const LIKERT_5_ISI: EmotionalScreeningQuestionOption[] = [
  { value: 0, label: 'Nenhuma' },
  { value: 1, label: 'Leve' },
  { value: 2, label: 'Moderada' },
  { value: 3, label: 'Grave' },
  { value: 4, label: 'Muito grave' },
]

const LIKERT_5_PCL: EmotionalScreeningQuestionOption[] = [
  { value: 0, label: 'Nada' },
  { value: 1, label: 'Um pouco' },
  { value: 2, label: 'Moderadamente' },
  { value: 3, label: 'Bastante' },
  { value: 4, label: 'Extremamente' },
]

const SNAP_4: EmotionalScreeningQuestionOption[] = [
  { value: 0, label: 'Nada' },
  { value: 1, label: 'Um pouco' },
  { value: 2, label: 'Bastante' },
  { value: 3, label: 'Muito' },
]

const YES_NO: EmotionalScreeningQuestionOption[] = [
  { value: 1, label: 'Sim' },
  { value: 0, label: 'Não' },
]

const PSC_OPTIONS: EmotionalScreeningQuestionOption[] = [
  { value: 0, label: 'Nunca' },
  { value: 1, label: 'Às vezes' },
  { value: 2, label: 'Frequentemente' },
]

function q(
  id: string,
  text: string,
  type: EmotionalScreeningQuestion['type'],
  options?: EmotionalScreeningQuestionOption[],
  safetyCritical?: boolean,
): EmotionalScreeningQuestion {
  return { id, text, type, options, safetyCritical }
}

function likert4(idPrefix: string, stems: string[], safetyLast = false): EmotionalScreeningQuestion[] {
  return stems.map((text, index) =>
    q(
      `${idPrefix}_q${index + 1}`,
      text,
      'single',
      LIKERT_4_FREQUENCY,
      safetyLast && index === stems.length - 1,
    ),
  )
}

function likert5(idPrefix: string, stems: string[], options = LIKERT_5_FREQUENCY): EmotionalScreeningQuestion[] {
  return stems.map((text, index) =>
    q(`${idPrefix}_q${index + 1}`, text, 'single', options),
  )
}

const GAD7_QUESTIONS = likert4('gad7', [
  'Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)',
  'Não conseguir parar ou controlar a preocupação',
  'Preocupar-se demais com diferentes coisas',
  'Ter dificuldade para relaxar',
  'Ficar tão inquieto(a) que é difícil ficar parado(a)',
  'Ficar facilmente irritado(a) ou aborrecido(a)',
  'Sentir medo como se algo terrível fosse acontecer',
])

const PHQ9_QUESTIONS = likert4(
  'phq9',
  [
    'Pouco interesse ou prazer em fazer as coisas',
    'Sentir-se para baixo, deprimido(a) ou sem esperança',
    'Dificuldade para pegar no sono, permanecer dormindo ou dormir demais',
    'Sentir-se cansado(a) ou com pouca energia',
    'Falta de apetite ou comer demais',
    'Sentir-se mal consigo mesmo(a) — ou achar que é um fracasso',
    'Dificuldade para se concentrar nas coisas',
    'Mover-se ou falar tão devagar que outras pessoas notaram — ou o oposto, ficar agitado(a)',
    'Pensar em se machucar ou que seria melhor estar morto(a)',
  ],
  true,
)

const CSSRS_QUESTIONS: EmotionalScreeningQuestion[] = [
  q('cssrs_q1', 'Você já desejou estar morto(a) ou poder dormir e não acordar?', 'yes_no', YES_NO, true),
  q('cssrs_q2', 'Você já pensou em se matar?', 'yes_no', YES_NO, true),
  q('cssrs_q3', 'Você já pensou em como poderia se matar?', 'yes_no', YES_NO, true),
  q('cssrs_q4', 'Você já teve intenção de se matar?', 'yes_no', YES_NO, true),
  q('cssrs_q5', 'Você já começou a planejar como se matar?', 'yes_no', YES_NO, true),
  q('cssrs_q6', 'Você já fez alguma coisa para se machucar ou tentar se matar?', 'yes_no', YES_NO, true),
]

const ASRS_QUESTIONS = likert5('asrs', [
  'Com que frequência você tem dificuldade para concluir tarefas finais quando o trabalho é desafiador?',
  'Com que frequência você tem dificuldade para organizar tarefas e atividades?',
  'Com que frequência você tem problemas para lembrar compromissos ou obrigações?',
  'Com que frequência você evita ou adia tarefas que exigem muito esforço mental?',
  'Com que frequência você se mexe ou se remexe quando precisa ficar sentado(a) por muito tempo?',
  'Com que frequência você se sente excessivamente ativo(a) ou precisa fazer várias coisas ao mesmo tempo?',
])

const SNAP_QUESTIONS = likert5(
  'snap',
  [
    'Não presta atenção a detalhes ou comete erros por descuido',
    'Tem dificuldade para manter a atenção em tarefas ou brincadeiras',
    'Parece não escutar quando falam diretamente com ele(a)',
    'Não segue instruções e não termina tarefas escolares ou domésticas',
    'Tem dificuldade para organizar tarefas e atividades',
    'Evita ou reluta em fazer tarefas que exigem esforço mental prolongado',
    'Perde coisas necessárias para tarefas ou atividades',
    'É facilmente distraído(a) por estímulos externos',
    'É esquecido(a) em atividades diárias',
    'Mexer mãos ou pés ou se remexer na cadeira',
    'Levantar da cadeira em situações em que se espera que fique sentado(a)',
    'Correr ou subir em lugares inapropriados',
    'Tem dificuldade para brincar ou se envolver em atividades de lazer calmamente',
    'Está sempre “a mil” ou age como se estivesse “ligado(a) no 220”',
    'Fala excessivamente',
    'Responde antes que a pergunta seja terminada',
    'Tem dificuldade para esperar a sua vez',
    'Interrompe ou se intromete nas conversas ou brincadeiras dos outros',
  ],
  SNAP_4,
)

const SCARED_QUESTIONS = likert5('scared', [
  'Quando me sinto assustado(a), tenho dificuldade para respirar',
  'Fico nervoso(a) com pessoas que não conheço bem',
  'Fico assustado(a) quando durmo fora de casa',
  'Preocupo-me com o que vai acontecer no futuro',
  'Fico nervoso(a) quando vou a festas ou encontros',
  'Preocupo-me com o que os outros pensam de mim',
  'Tenho medo de ficar sozinho(a) em casa',
  'Fico nervoso(a) quando vou à escola',
  'Preocupo-me com a minha família',
  'Tenho pesadelos sobre coisas ruins acontecendo',
])

const PSC17_QUESTIONS = likert5(
  'psc17',
  [
    'Parece triste ou infeliz',
    'Não se interessa pelas coisas',
    'É inquieto(a) e não consegue ficar parado(a)',
    'Parece cansado(a) ou sem energia',
    'Parece ter medo de tentar coisas novas',
    'Parece irritado(a) ou zangado(a)',
    'Tem dificuldade para prestar atenção',
    'Parece agir sem pensar',
    'Parece sentir-se inútil ou inferior',
    'Parece preocupado(a) com muitas coisas',
    'Parece ter dificuldade para fazer amigos',
    'Parece ter menos interesse pelas coisas que gostava',
    'Parece distraído(a) com facilidade',
    'Parece desobediente ou desafiador(a)',
    'Tem dores ou desconfortos sem causa médica clara',
    'Parece ter dificuldade para dormir',
    'Parece ter dificuldade para se concentrar na escola',
  ],
  PSC_OPTIONS,
)

const MCHAT_QUESTIONS: EmotionalScreeningQuestion[] = [
  'Gosta de brincar de “faz de conta” (ex.: fingir que dá comida a uma boneca)?',
  'Já usou o dedo indicador para apontar e pedir algo?',
  'Já usou o dedo indicador para mostrar algo interessante?',
  'Brinca adequadamente com brinquedos pequenos sem apenas colocá-los na boca ou girá-los?',
  'Já trouxe objetos para mostrar a alguém por interesse?',
  'Responde quando é chamado(a) pelo nome?',
  'Sorri em resposta ao seu sorriso?',
  'Fica incomodado(a) com ruídos do dia a dia (ex.: aspirador, música alta)?',
  'Caminha?',
  'Olha nos olhos quando você fala, brinca ou veste ele(a)?',
  'Tenta imitar o que você faz (ex.: bater palmas)?',
  'Olha quando você aponta algo do outro lado da sala?',
  'Gosta de ser balançado(a) no colo ou no balanço?',
  'Entende quando você pede para fazer algo simples?',
  'Quando algo acontece, olha para o seu rosto para ver sua reação?',
  'Gosta de atividades de movimento (ex.: ser balançado(a) ou pulado no colo)?',
  'Coloca a mão na sua mão quando você oferece algo sem pedir?',
  'Quando você não presta atenção, ele(a) tenta chamar sua atenção?',
  'Você já se perguntou se ele(a) é surdo(a)?',
  'Entende o que as pessoas dizem?',
].map((text, index) => q(`mchat_q${index + 1}`, text, 'yes_no', YES_NO))

const ISI_QUESTIONS = likert5('isi', [
  'Dificuldade para pegar no sono',
  'Dificuldade para manter o sono',
  'Problema de acordar muito cedo',
  'Quão satisfeito(a) você está com o seu padrão de sono atual?',
  'Em que medida o problema de sono interfere na sua vida diária?',
  'Quão perceptível para os outros é o seu problema de sono?',
  'Quão preocupado(a) você está com o seu problema de sono?',
], LIKERT_5_ISI)

const AUDIT_QUESTIONS = likert5('audit', [
  'Com que frequência você consome bebidas alcoólicas?',
  'Quantas doses você consome em um dia típico quando bebe?',
  'Com que frequência você consome seis ou mais doses em uma única ocasião?',
], [
  { value: 0, label: 'Nunca' },
  { value: 1, label: 'Mensalmente ou menos' },
  { value: 2, label: '2 a 4 vezes por mês' },
  { value: 3, label: '2 a 3 vezes por semana' },
  { value: 4, label: '4 ou mais vezes por semana' },
])

const PCL5_QUESTIONS = likert5('pcl5', [
  'Memórias repetidas, perturbadoras e indesejadas do evento estressante',
  'Sonhos repetidos e perturbadores sobre o evento',
  'De repente sentir ou agir como se o evento estivesse acontecendo de novo',
  'Sentir-se muito perturbado(a) quando algo lembra do evento',
  'Reações físicas fortes quando algo lembra do evento',
  'Evitar memórias, pensamentos ou sentimentos relacionados ao evento',
  'Evitar lembranças externas (lugares, pessoas, conversas)',
  'Dificuldade para lembrar partes importantes do evento',
  'Crenças ou expectativas negativas persistentes sobre si, os outros ou o mundo',
  'Culpar a si mesmo(a) ou a outras pessoas pelo evento ou suas consequências',
  'Sentimentos negativos persistentes (medo, horror, raiva, culpa ou vergonha)',
  'Perda de interesse em atividades que antes eram importantes',
  'Sentir-se distante ou isolado(a) das outras pessoas',
  'Dificuldade para sentir emoções positivas (felicidade, afeto)',
  'Comportamento irritável, explosões de raiva ou agir agressivamente',
  'Tomar riscos desnecessários ou fazer coisas que podem causar danos',
  'Estar muito alerta, vigilante ou “no pino”',
  'Ficar facilmente assustado(a) ou sobressaltado(a)',
  'Dificuldade para concentrar-se',
  'Problemas para dormir (dificuldade para adormecer ou permanecer dormindo)',
], LIKERT_5_PCL)

export const EMOTIONAL_SCREENING_INSTRUMENTS: EmotionalScreeningInstrument[] = [
  {
    id: 'gad-7',
    title: 'Ansiedade',
    subtitle: 'Nervosismo, preocupação e tensão',
    audience: 'adult_adolescent',
    audienceLabel: 'Adultos e adolescentes',
    instrumentCode: 'GAD-7',
    estimatedMinutes: 3,
    icon: 'head-lightbulb-outline',
    accent: ['#67e8f9', '#0891b2'],
    intro:
      'Triagem de ansiedade com base em sintomas recentes. O resultado indica intensidade dos sinais, não um diagnóstico.',
    questionPreamble: 'Nas últimas 2 semanas, com que frequência você foi incomodado(a) por:',
    questions: GAD7_QUESTIONS,
    available: false,
  },
  {
    id: 'phq-9',
    title: 'Depressão',
    subtitle: 'Humor baixo, cansaço e perda de interesse',
    audience: 'adult_adolescent',
    audienceLabel: 'Adultos e adolescentes',
    instrumentCode: 'PHQ-9',
    estimatedMinutes: 4,
    icon: 'weather-cloudy',
    accent: ['#93c5fd', '#2563eb'],
    intro:
      'Triagem de sintomas depressivos. Se houver pensamentos de autolesão, o app orientará busca de apoio imediato.',
    questionPreamble: 'Nas últimas 2 semanas, com que frequência você foi incomodado(a) por:',
    questions: PHQ9_QUESTIONS,
    available: false,
  },
  {
    id: 'cssrs',
    title: 'Risco suicida',
    subtitle: 'Pensamentos de morte ou autolesão',
    audience: 'adult_adolescent',
    audienceLabel: 'Adultos e adolescentes',
    instrumentCode: 'C-SSRS Screener',
    estimatedMinutes: 2,
    icon: 'lifebuoy',
    accent: ['#fca5a5', '#dc2626'],
    intro:
      'Perguntas diretas sobre segurança. Respostas que indicam risco acionam protocolo de apoio urgente.',
    questions: CSSRS_QUESTIONS,
    available: false,
  },
  {
    id: 'asrs',
    title: 'TDAH adulto',
    subtitle: 'Desatenção, desorganização e inquietude',
    audience: 'adult_adolescent',
    audienceLabel: 'Adultos',
    instrumentCode: 'ASRS v1.1',
    estimatedMinutes: 3,
    icon: 'lightning-bolt-outline',
    accent: ['#fdba74', '#ea580c'],
    intro:
      'Triagem de sinais compatíveis com TDAH em adultos. Indica se vale a pena buscar avaliação especializada.',
    questions: ASRS_QUESTIONS,
    available: false,
  },
  {
    id: 'isi',
    title: 'Sono',
    subtitle: 'Dificuldade para dormir ou manter o sono',
    audience: 'adult_adolescent',
    audienceLabel: 'Adultos e adolescentes',
    instrumentCode: 'ISI',
    estimatedMinutes: 3,
    icon: 'moon-waning-crescent',
    accent: ['#a5b4fc', '#6366f1'],
    intro: 'Avalia como o sono tem afetado você nas últimas 2 semanas.',
    questions: ISI_QUESTIONS,
    available: false,
  },
  {
    id: 'audit-c',
    title: 'Álcool',
    subtitle: 'Frequência e quantidade de bebida',
    audience: 'adult_adolescent',
    audienceLabel: 'Adultos',
    instrumentCode: 'AUDIT-C',
    estimatedMinutes: 2,
    icon: 'glass-wine',
    accent: ['#fde68a', '#d97706'],
    intro: 'Triagem breve de consumo de álcool. Não substitui avaliação clínica completa.',
    questions: AUDIT_QUESTIONS,
    available: false,
  },
  {
    id: 'pcl-5',
    title: 'Trauma e estresse',
    subtitle: 'Sintomas após evento muito difícil',
    audience: 'adult_adolescent',
    audienceLabel: 'Adultos',
    instrumentCode: 'PCL-5',
    estimatedMinutes: 6,
    icon: 'shield-alert-outline',
    accent: ['#d8b4fe', '#9333ea'],
    intro:
      'Triagem de sintomas compatíveis com estresse pós-traumático. Considere um evento que tenha sido muito difícil para você.',
    questions: PCL5_QUESTIONS,
    available: false,
  },
  {
    id: 'snap-iv',
    title: 'Atenção e comportamento',
    subtitle: 'Desatenção, hiperatividade e oposição',
    audience: 'child_adolescent',
    audienceLabel: 'Crianças e adolescentes',
    instrumentCode: 'SNAP-IV 26',
    estimatedMinutes: 12,
    icon: 'star-shooting-outline',
    accent: ['#f9a8d4', '#db2777'],
    intro:
      'Rastreio completo com SNAP-IV 26, prejuízo funcional, alertas de segurança e fatores associados. O resultado não fecha diagnóstico.',
    questions: SNAP_QUESTIONS,
    available: true,
  },
  {
    id: 'scared',
    title: 'Ansiedade infantil',
    subtitle: 'Medos, preocupações e ansiedade social',
    audience: 'child_adolescent',
    audienceLabel: 'Crianças e adolescentes',
    instrumentCode: 'SCARED',
    estimatedMinutes: 4,
    icon: 'emoticon-sad-outline',
    accent: ['#86efac', '#16a34a'],
    intro: 'Triagem de ansiedade em crianças e adolescentes. Pode ser respondida com apoio de um adulto.',
    questions: SCARED_QUESTIONS,
    available: false,
  },
  {
    id: 'psc-17',
    title: 'Saúde mental infantil',
    subtitle: 'Humor, comportamento e atenção',
    audience: 'child_adolescent',
    audienceLabel: 'Crianças e adolescentes',
    instrumentCode: 'PSC-17',
    estimatedMinutes: 4,
    icon: 'human-child',
    accent: ['#7dd3fc', '#0284c7'],
    intro:
      'Triagem geral de bem-estar emocional e comportamental. Preenchimento por responsável recomendado.',
    questions: PSC17_QUESTIONS,
    available: false,
  },
  {
    id: 'mchat-r',
    title: 'Autismo (16–30 meses)',
    subtitle: 'Comunicação e interação social',
    audience: 'early_childhood',
    audienceLabel: '16 a 30 meses',
    instrumentCode: 'M-CHAT-R/F',
    estimatedMinutes: 5,
    icon: 'baby-face-outline',
    accent: ['#fcd34d', '#ca8a04'],
    intro:
      'Triagem para sinais compatíveis com TEA em crianças pequenas. Responda com base no comportamento habitual da criança.',
    questions: MCHAT_QUESTIONS,
    available: false,
  },
]

export function getEmotionalScreeningInstrument(
  id: EmotionalScreeningInstrument['id'],
): EmotionalScreeningInstrument | undefined {
  return EMOTIONAL_SCREENING_INSTRUMENTS.find((instrument) => instrument.id === id)
}
