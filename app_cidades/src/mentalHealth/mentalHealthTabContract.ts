import type { MentalHealthTab } from '../types/mentalHealth'

/**
 * Contrato de telas — Saúde Mental (Etapa 0)
 *
 * Fonte única de verdade para o que cada aba faz e o que NÃO deve fazer.
 * Qualquer feature nova deve encaixar aqui antes de ir para Hoje / Cuidar / Histórico.
 */

export type MentalHealthTabSection = {
  id: string
  title: string
  summary: string
}

export type MentalHealthTabContract = {
  id: MentalHealthTab
  label: string
  role: string
  /** Uma linha para subtítulo ou placeholder */
  tagline: string
  sections: MentalHealthTabSection[]
  inScope: string[]
  outOfScope: string[]
}

export const MENTAL_HEALTH_TAB_CONTRACTS: Record<MentalHealthTab, MentalHealthTabContract> = {
  today: {
    id: 'today',
    label: 'Hoje',
    role: 'Ritual do dia: check-in → plano → progresso',
    tagline: 'O que fazer agora, neste dia',
    sections: [
      {
        id: 'journey',
        title: 'Momento do dia',
        summary:
          'Hero conforme fase: anamnese inicial pendente, check-in, reflexão pós-registro ou plano em andamento.',
      },
      {
        id: 'check-in',
        title: 'Check-in emocional',
        summary: 'Humor visual + emoções, influência do dia e reação. Um registro por dia (pode refazer).',
      },
      {
        id: 'today-plan',
        title: 'Plano de hoje',
        summary:
          'Atividades sugeridas pelo motor para o dia atual: progresso, atalho para abrir/concluir, sem catálogo completo.',
      },
      {
        id: 'extended-anamnesis-nudge',
        title: 'Conte-nos mais',
        summary: 'CTA opcional para anamnese ampliada — não bloqueia o ritual diário.',
      },
      {
        id: 'crisis-entry',
        title: 'Preciso de apoio',
        summary: 'Link discreto para fluxo de crise (CVV etc.). Prioridade se houver red flag ativa.',
      },
    ],
    inScope: [
      'Check-in diário (drawer)',
      'Resumo do registro de hoje e mudança relevante',
      'Geração/visualização do plano do dia (drawer ou card)',
      'Progresso das atividades de hoje (X de Y)',
      'CTA para completar 11 perguntas iniciais se incompletas',
      'Nudge para anamnese ampliada',
      'Entrada para fluxo de crise',
    ],
    outOfScope: [
      'Catálogo completo de atividades (→ Cuidar)',
      'Histórico longo de check-ins (→ Histórico)',
      'Editar preferências / consentimentos (→ Histórico)',
      'Gráficos de evolução semanal (→ Histórico)',
      'Player passo a passo da atividade (→ Cuidar; na Hoje só atalho)',
      'Onboarding (tela/modal separado no primeiro acesso)',
    ],
  },
  care: {
    id: 'care',
    label: 'Cuidar',
    role: 'Biblioteca + fazer atividades (guiadas)',
    tagline: 'Explorar e praticar cuidados no seu ritmo',
    sections: [
      {
        id: 'plan-now',
        title: 'Para agora',
        summary: 'Atividades pendentes do plano de hoje — mesmo player, foco em execução.',
      },
      {
        id: 'library',
        title: 'Biblioteca',
        summary:
          'Catálogo por modalidade (respiração, grounding, journaling, etc.) a partir do activity_catalog.',
      },
      {
        id: 'activity-detail',
        title: 'Detalhe da atividade',
        summary: 'Título, objetivo, duração e linguagem acolhedora — sem nomes de transtorno.',
      },
      {
        id: 'activity-session',
        title: 'Sessão guiada',
        summary: 'Passos, timers, pausar/sair, reflexão opcional, depois feedback (útil / parcial / não / piorou).',
      },
      {
        id: 'recent',
        title: 'Feitas recentemente',
        summary: 'Opcional v2: reabrir atividades já feitas a partir do activity_history.',
      },
    ],
    inScope: [
      'Listar atividades habilitadas do catálogo clínico',
      'Filtrar por modalidade / momento do dia',
      'Iniciar MentalHealthActivitySession (player)',
      'Feedback pós-atividade e recálculo do motor',
      'Respeitar red flags e avoid_when_red_flags',
      'Retomar pendentes do plano de hoje',
    ],
    outOfScope: [
      'Check-in diário (→ Hoje)',
      'Histórico de humor e check-ins (→ Histórico)',
      'Preferências e consentimentos (→ Histórico)',
      'Anamnese (drawer global; link pode vir daqui, formulário não mora aqui)',
      'Eixos clínicos na UI',
    ],
  },
  'my-care': {
    id: 'my-care',
    label: 'Histórico',
    role: 'Histórico, preferências, evolução, perfil',
    tagline: 'Registros e evolução',
    sections: [
      {
        id: 'preferences',
        title: 'Seu perfil de cuidado',
        summary: 'Focos, frequência, espiritualidade e consentimentos — editáveis após onboarding.',
      },
      {
        id: 'anamnesis-progress',
        title: 'Conhecer você',
        summary: 'Progresso das 11 iniciais e da anamnese ampliada; continuar no ritmo.',
      },
      {
        id: 'check-in-history',
        title: 'Registros',
        summary: 'Lista e detalhe dos check-ins passados.',
      },
      {
        id: 'mood-trends',
        title: 'Como você tem estado',
        summary: 'Visão semanal simples de humor e emoções — linguagem acolhedora.',
      },
      {
        id: 'plan-adherence',
        title: 'Seus cuidados',
        summary: 'Aderência ao plano, atividades concluídas e feedbacks recentes.',
      },
      {
        id: 'privacy',
        title: 'Privacidade e ajuda',
        summary: 'Política, como funciona, crise — atalhos de confiança.',
      },
    ],
    inScope: [
      'Editar MentalHealthOnboardingPreferences e consentimentos',
      'Histórico completo de check-ins',
      'Gráfico/resumo 7 dias a partir de dados reais',
      'Progresso anamnese inicial + ampliada',
      'Aderência e histórico de activity_history',
      'Links: como funciona, política, apoio (crise)',
      'Journal / registro breve (se mantido no produto)',
    ],
    outOfScope: [
      'Ritual “o que fazer agora” (→ Hoje)',
      'Executar sessão guiada de atividade (→ Cuidar; só histórico aqui)',
      'Gerar plano do dia (→ Hoje, motor no backend do fluxo)',
      'Onboarding first-run (modal separado)',
    ],
  },
}

/** Rótulos das abas segmentadas — derivados do contrato */
export const MENTAL_HEALTH_SEGMENT_TABS_FROM_CONTRACT = (
  Object.values(MENTAL_HEALTH_TAB_CONTRACTS) as MentalHealthTabContract[]
).map((tab) => ({
  id: tab.id,
  label: tab.label,
  available: true as const,
}))

/**
 * Componentes compartilhados (podem ser abertos de qualquer aba, mas com dono claro):
 * - Check-in drawer → dono Hoje; Histórico só abre para "novo registro" se produto permitir
 * - Anamnese drawer → dono onboarding + Histórico (continuar ampliada)
 * - Crise drawer → global quando red flag
 * - Activity session → dono Cuidar; Hoje só navega para lá
 * - Micro plan drawer → legado; tende a virar card na Hoje + execução em Cuidar
 */
export const MENTAL_HEALTH_SHARED_SURFACES = [
  'MentalHealthCheckInDrawer',
  'MentalHealthAnamnesisDrawer',
  'MentalHealthCrisisDrawer',
  'MentalHealthActivitySession', // Etapa 2
  'MentalHealthMicroPlanDrawer', // transição — preferir Cuidar + card na Hoje
] as const

export function getMentalHealthTabContract(tab: MentalHealthTab): MentalHealthTabContract {
  return MENTAL_HEALTH_TAB_CONTRACTS[tab]
}
