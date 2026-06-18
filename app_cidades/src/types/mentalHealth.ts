export type MentalHealthCareFocusId =
  | 'anxiety'
  | 'sadness'
  | 'stress'
  | 'sleep'
  | 'relationships'
  | 'work'
  | 'loneliness'
  | 'self-esteem'
  | 'routine'
  | 'undecided'

export type MentalHealthTrackingFrequencyId =
  | 'daily'
  | 'few-times-week'
  | 'weekly'
  | 'decide-later'

export type MentalHealthSpiritualityPreferenceId = 'christian' | 'none' | 'decide-later'

export type MentalHealthConsentAcceptances = {
  dataUsage: boolean
  personalization: boolean
  professionalAccess: boolean
}

export type MentalHealthOnboardingPreferences = {
  careFocus: MentalHealthCareFocusId[]
  trackingFrequency: MentalHealthTrackingFrequencyId | null
  spiritualityPreference: MentalHealthSpiritualityPreferenceId | null
}

export type MentalHealthOnboardingRecord = {
  completed: boolean
  consents: MentalHealthConsentAcceptances
  preferences: MentalHealthOnboardingPreferences
  completedAt: string | null
}

export const MENTAL_HEALTH_CARE_FOCUS_OPTIONS: {
  id: MentalHealthCareFocusId
  label: string
}[] = [
  { id: 'anxiety', label: 'Ansiedade e preocupação' },
  { id: 'sadness', label: 'Tristeza e desânimo' },
  { id: 'stress', label: 'Estresse' },
  { id: 'sleep', label: 'Sono' },
  { id: 'relationships', label: 'Relacionamentos' },
  { id: 'work', label: 'Trabalho ou estudos' },
  { id: 'loneliness', label: 'Solidão' },
  { id: 'self-esteem', label: 'Autoestima' },
  { id: 'routine', label: 'Organização da rotina' },
  { id: 'undecided', label: 'Ainda não sei' },
]

export const MENTAL_HEALTH_TRACKING_FREQUENCY_OPTIONS: {
  id: MentalHealthTrackingFrequencyId
  label: string
}[] = [
  { id: 'daily', label: 'Todos os dias' },
  { id: 'few-times-week', label: 'Algumas vezes por semana' },
  { id: 'weekly', label: 'Uma vez por semana' },
  { id: 'decide-later', label: 'Quero decidir depois' },
]

export const MENTAL_HEALTH_SPIRITUALITY_OPTIONS: {
  id: MentalHealthSpiritualityPreferenceId
  label: string
}[] = [
  { id: 'christian', label: 'Conteúdo cristão' },
  { id: 'none', label: 'Não desejo' },
  { id: 'decide-later', label: 'Decidirei depois' },
]

export type MentalHealthHowItWorksStep = {
  id: number
  icon:
    | 'person-outline'
    | 'sunny-outline'
    | 'pulse-outline'
    | 'leaf-outline'
    | 'shield-checkmark-outline'
  title: string
  summary: string
  detail: string
}

export const MENTAL_HEALTH_HOW_IT_WORKS_INTRO =
  'Do primeiro contato até os cuidados do dia — tudo no seu ritmo, com linguagem simples e sem diagnósticos na tela.'

export const MENTAL_HEALTH_HOW_IT_WORKS_STEPS: MentalHealthHowItWorksStep[] = [
  {
    id: 1,
    icon: 'person-outline',
    title: 'Conhecer você',
    summary: '11 perguntas rápidas antes do dia a dia.',
    detail:
      'Perguntamos como você tem se sentido, dormido e lidado com a rotina — cerca de 3 minutos. Pode pausar e continuar depois; cada resposta fica salva no seu aparelho. Depois, se quiser, há perguntas extras opcionais para refinar seu perfil.',
  },
  {
    id: 2,
    icon: 'sunny-outline',
    title: 'Momento de hoje',
    summary: 'Um check-in leve, quando fizer sentido.',
    detail:
      'Você escolhe o humor que mais combina com agora e responde algumas perguntas sobre emoções e o que influenciou seu dia. Não precisa ser longo — o objetivo é registrar o instante e acompanhar mudanças ao longo do tempo.',
  },
  {
    id: 3,
    icon: 'pulse-outline',
    title: 'Entender seu momento',
    summary: 'Seus registros são cruzados com regras clínicas.',
    detail:
      'Suas respostas alimentam um motor de cuidado determinístico: regras pré-definidas por especialistas, não um chat que inventa textos. Organizamos prioridades e sinais de atenção em linguagem simples — sem nomes de doenças ou diagnósticos aparecendo para você.',
  },
  {
    id: 4,
    icon: 'leaf-outline',
    title: 'Cuidados do dia',
    summary: 'Micro-atividades sugeridas para hoje.',
    detail:
      'Com base no seu perfil e no check-in, sugerimos exercícios breves, pausas guiadas e reflexões. Ao concluir cada uma, você diz se ajudou — e o plano vai se ajustando. Um passo de cada vez, no seu tempo.',
  },
  {
    id: 5,
    icon: 'shield-checkmark-outline',
    title: 'Segurança em primeiro lugar',
    summary: 'Quando precisar, orientamos a buscar apoio humano.',
    detail:
      'Se alguma resposta indicar risco imediato, interrompemos sugestões automáticas e mostramos orientações de acolhimento (CVV 188). Este recurso complementa — não substitui — avaliação ou tratamento profissional. Profissionais autorizados podem revisar seus dados quando você consentir.',
  },
]

export const MENTAL_HEALTH_PRIVACY_INFO_CARDS = [
  'Seus dados de saúde são protegidos.',
  'Apenas profissionais autorizados acessam informações individuais.',
  'Informações para gestores são apresentadas de forma agrupada e anônima.',
  'Você controla quais registros pessoais deseja compartilhar.',
] as const

export const MENTAL_HEALTH_CONSENT_ITEMS: {
  id: keyof MentalHealthConsentAcceptances
  label: string
}[] = [
  {
    id: 'dataUsage',
    label: 'Li e compreendi como meus dados serão utilizados.',
  },
  {
    id: 'personalization',
    label: 'Autorizo o uso das respostas para personalizar meu acompanhamento.',
  },
  {
    id: 'professionalAccess',
    label: 'Autorizo profissionais responsáveis a acessarem meus dados de cuidado.',
  },
]

export const MAX_MENTAL_HEALTH_CARE_FOCUS = 3

export type MentalHealthTab = 'today' | 'care' | 'my-care'

export type MentalHealthWelcomeState = 'no-history' | 'has-history' | 'checkin-done'

export type MentalHealthMoodLevelId =
  | 'very-good'
  | 'good'
  | 'neutral'
  | 'bad'
  | 'very-bad'

export type MentalHealthCheckInCardState = 'pending' | 'completed' | 'relevant-change'

export type MentalHealthInfluenceValence = 'positive' | 'negative' | 'mixed'

export type MentalHealthCheckInEntry = {
  id: string
  recordedAt: string
  mood: MentalHealthMoodLevelId
  moodReason?: string | null
  emotions: string[]
  emotionIntensity?: number | null
  mainInfluence: string | null
  influenceValence?: MentalHealthInfluenceValence | null
  influenceDetail?: string | null
  reactions?: string[]
  reactionHelp?: string | null
  isQuickEntry: boolean
}

export type MentalHealthCheckInSaveInput = {
  mood: MentalHealthMoodLevelId
  moodReason?: string | null
  emotions: string[]
  emotionIntensity?: number | null
  mainInfluence: string | null
  influenceValence?: MentalHealthInfluenceValence | null
  influenceDetail?: string | null
  reactions?: string[]
  reactionHelp?: string | null
  isQuickEntry: boolean
}

export type MentalHealthCheckInCardData = {
  state: MentalHealthCheckInCardState
  latestEntry: MentalHealthCheckInEntry | null
  relevantChangeMessage: string | null
}

export const MENTAL_HEALTH_MOOD_OPTIONS: {
  id: MentalHealthMoodLevelId
  label: string
  emoji?: string
  tint: string
}[] = [
  { id: 'very-good', label: 'Ótimo', tint: 'rgba(103, 232, 249, 0.2)' },
  { id: 'good', label: 'Bem', tint: 'rgba(134, 239, 172, 0.18)' },
  { id: 'neutral', label: 'Neutro', tint: 'rgba(250, 204, 21, 0.16)' },
  { id: 'bad', label: 'Mal', tint: 'rgba(251, 191, 36, 0.16)' },
  { id: 'very-bad', label: 'Muito mal', tint: 'rgba(251, 146, 60, 0.16)' },
]

export const MENTAL_HEALTH_CHECKIN_MOOD_LABELS: Record<MentalHealthMoodLevelId, string> = {
  'very-good': 'Muito bem',
  good: 'Bem',
  neutral: 'Neutro',
  bad: 'Mal',
  'very-bad': 'Muito mal',
}

export const MENTAL_HEALTH_CHECKIN_EMOTIONS = [
  'Tranquilo',
  'Animado',
  'Grato',
  'Esperançoso',
  'Preocupado',
  'Irritado',
  'Triste',
  'Cansado',
  'Sobrecarregado',
  'Sozinho',
  'Confuso',
  'Frustrado',
] as const

export const MAX_MENTAL_HEALTH_CHECKIN_EMOTIONS = 3

export const MENTAL_HEALTH_EMOTION_INTENSITY_OPTIONS = [
  { value: 1, label: 'Muito leve' },
  { value: 2, label: 'Leve' },
  { value: 3, label: 'Moderada' },
  { value: 4, label: 'Forte' },
  { value: 5, label: 'Muito forte' },
] as const

export const MENTAL_HEALTH_CHECKIN_INFLUENCES = [
  'Trabalho',
  'Estudos',
  'Família',
  'Relacionamento',
  'Dinheiro',
  'Saúde',
  'Sono',
  'Alimentação',
  'Conflito',
  'Solidão',
  'Conquista',
  'Atividade física',
  'Espiritualidade',
  'Outro acontecimento',
] as const

export const MENTAL_HEALTH_INFLUENCE_VALENCE_OPTIONS: {
  id: MentalHealthInfluenceValence
  label: string
}[] = [
  { id: 'positive', label: 'Positivo' },
  { id: 'negative', label: 'Negativo' },
  { id: 'mixed', label: 'Misturado' },
]

export const MENTAL_HEALTH_CHECKIN_REACTIONS = [
  'Conversei com alguém',
  'Tentei resolver',
  'Evitei a situação',
  'Descansei',
  'Fiz atividade física',
  'Fiquei isolado',
  'Descontei na alimentação',
  'Fiz uma prática espiritual',
  'Ainda não sei como lidar',
  'Outra reação',
] as const

/** @deprecated Use MENTAL_HEALTH_CHECKIN_EMOTIONS labels */
export const MENTAL_HEALTH_CHECKIN_EMOTIONS_LEGACY: {
  label: string
  emoji: string
}[] = [
  { label: 'Cansado', emoji: '😴' },
  { label: 'Preocupado', emoji: '😟' },
  { label: 'Ansioso', emoji: '😰' },
  { label: 'Calmo', emoji: '😌' },
  { label: 'Motivado', emoji: '✨' },
  { label: 'Triste', emoji: '😢' },
  { label: 'Irritado', emoji: '😤' },
]

export type MentalHealthWeekDayLevel = 'good' | 'moderate' | 'low' | 'empty'

export type MentalHealthTodayCareItem = {
  id: string
  label: string
  completed: boolean
}

export type MentalHealthWeekDay = {
  label: string
  level: MentalHealthWeekDayLevel
}

export type MentalHealthTodayState = {
  welcomeState: MentalHealthWelcomeState
  checkInCard: MentalHealthCheckInCardData
  momentActivity: {
    title: string
    subtitle: string
    durationMinutes: number
    typeLabel: string
  } | null
  todayCare: {
    items: MentalHealthTodayCareItem[]
  }
  weekOverview: {
    summary: string
    days: MentalHealthWeekDay[]
  }
  journal: {
    hasEntryToday: boolean
    prompt: string
  }
}

export const MENTAL_HEALTH_SEGMENT_TABS: { id: MentalHealthTab; label: string; available: boolean }[] = [
  { id: 'today', label: 'Hoje', available: true },
  { id: 'care', label: 'Cuidar', available: true },
  { id: 'my-care', label: 'Meu cuidado', available: true },
]

export const MENTAL_HEALTH_WELCOME_MESSAGES: Record<MentalHealthWelcomeState, string> = {
  'no-history':
    'Vamos reservar alguns minutos para cuidar de como você está?',
  'has-history':
    'Nos últimos dias, você relatou mais cansaço e preocupação. Hoje, temos uma atividade curta para ajudar a organizar seus pensamentos.',
  'checkin-done':
    'Seu registro de hoje foi concluído. Você ainda possui uma atividade rápida no seu plano.',
}

export const MENTAL_HEALTH_MESSAGE_EXPLAIN_INTRO =
  'Esta mensagem considera seus registros recentes, as atividades do seu plano e as preferências informadas por você.'

export const MENTAL_HEALTH_MESSAGE_CONSIDERED_FACTORS = [
  'Últimos check-ins.',
  'Emoções mais frequentes.',
  'Atividades realizadas.',
  'Plano de cuidado atual.',
] as const

export const MENTAL_HEALTH_MESSAGE_CLINICAL_NOTICE =
  'Esta mensagem não representa uma avaliação ou conclusão clínica.'

export function emptyMentalHealthOnboardingRecord(): MentalHealthOnboardingRecord {
  return {
    completed: false,
    consents: {
      dataUsage: false,
      personalization: false,
      professionalAccess: false,
    },
    preferences: {
      careFocus: [],
      trackingFrequency: null,
      spiritualityPreference: null,
    },
    completedAt: null,
  }
}
