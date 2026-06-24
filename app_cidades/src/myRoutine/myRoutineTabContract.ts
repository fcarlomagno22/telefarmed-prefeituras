import type { MyRoutineTab } from '../types/myRoutine'

/**
 * Contrato de telas — Minha Rotina (Etapa 0)
 *
 * Fonte única de verdade para o que cada aba faz e o que NÃO deve fazer.
 * Qualquer feature nova deve encaixar aqui antes de ir para Hoje / Semana / Perfil.
 */

export type MyRoutineTabSection = {
  id: string
  title: string
  summary: string
}

export type MyRoutineTabContract = {
  id: MyRoutineTab
  label: string
  role: string
  tagline: string
  sections: MyRoutineTabSection[]
  inScope: string[]
  outOfScope: string[]
}

export const MY_ROUTINE_TAB_CONTRACTS: Record<MyRoutineTab, MyRoutineTabContract> = {
  today: {
    id: 'today',
    label: 'Hoje',
    role: 'Ritual do dia: próxima tarefa → timeline → rotina mínima',
    tagline: 'O que fazer agora, neste dia',
    sections: [
      {
        id: 'hero',
        title: 'Seu dia em uma frase',
        summary: 'Hero com próxima tarefa, janela de horário e progresso da rotina mínima.',
      },
      {
        id: 'consistency',
        title: 'Rotina mínima',
        summary: 'Barra de consistência dos essenciais do dia — foco em aderência leve, não perfeição.',
      },
      {
        id: 'next-task',
        title: 'Próxima tarefa',
        summary: 'Card destaque com Feito, Adiar e Pular sem culpa.',
      },
      {
        id: 'timeline',
        title: 'Timeline do dia',
        summary: 'Lista por manhã, tarde, noite e a qualquer momento.',
      },
      {
        id: 'telefarmed-shortcuts',
        title: 'Atalhos Telefarmed',
        summary: 'Deep links para saúde mental, comer bem, corrida, consultas e sono.',
      },
      {
        id: 'day-closure',
        title: 'Como foi seu dia?',
        summary: 'Encerramento opcional de 30 segundos para ajuste do dia seguinte.',
      },
    ],
    inScope: [
      'Próxima tarefa e timeline do dia',
      'Rotina mínima (essenciais)',
      'Feito / adiar / pular tarefa (drawers)',
      'Modo dia leve por imprevisto',
      'FAB: tarefa avulsa, lembrete, imprevisto',
      'Encerramento do dia (drawer)',
      'Atalhos para módulos existentes do app',
    ],
    outOfScope: [
      'Editar plano semanal completo (→ Semana)',
      'Revisão semanal guiada (→ Semana)',
      'Histórico de 4 semanas (→ Perfil)',
      'Onboarding first-run (drawer global)',
      'Preferências e notificações (→ Perfil / settings)',
    ],
  },
  week: {
    id: 'week',
    label: 'Semana',
    role: 'Plano semanal, revisão e hábitos recorrentes',
    tagline: 'Visão e ajustes da semana',
    sections: [
      {
        id: 'week-selector',
        title: 'Seletor de semana',
        summary: 'Navegação entre semanas com picker mensal.',
      },
      {
        id: 'week-summary',
        title: 'Resumo da semana',
        summary: 'Dias com rotina mínima ok, tarefas feitas e dias leves.',
      },
      {
        id: 'weekly-review',
        title: 'Revisão de 5 min',
        summary: 'O que funcionou, o que travou e ajuste automático do plano.',
      },
      {
        id: 'day-cards',
        title: 'Visão por dia',
        summary: 'Sete cards com preview e editor do plano diário.',
      },
      {
        id: 'recurring',
        title: 'Hábitos recorrentes',
        summary: 'Blocos que se repetem na semana com horário ou janela.',
      },
      {
        id: 'weekend-mode',
        title: 'Modo fim de semana',
        summary: 'Descanso, equilíbrio ou manter ritmo da semana.',
      },
    ],
    inScope: [
      'Plano da semana (leitura e edição por dia)',
      'Revisão semanal guiada (drawer)',
      'Hábitos recorrentes (drawer)',
      'Modo fim de semana (drawer)',
      'Trocar template base (drawer)',
      'Banner de revisão aos domingos',
    ],
    outOfScope: [
      'Execução tarefa a tarefa do dia (→ Hoje)',
      'Mapa atual vs ideal completo (→ Perfil)',
      'Recomeçar do zero (→ Perfil)',
      'Onboarding (drawer global)',
    ],
  },
  profile: {
    id: 'profile',
    label: 'Perfil',
    role: 'Rotina, preferências, evolução e perfil',
    tagline: 'Registros e evolução',
    sections: [
      {
        id: 'current-vs-ideal',
        title: 'Atual vs ideal',
        summary: 'Mapa da rotina de hoje e da rotina desejada (semana e fim de semana).',
      },
      {
        id: 'essentials',
        title: 'Rotina mínima',
        summary: 'Lista editável dos essenciais (máx. 5).',
      },
      {
        id: 'preferences',
        title: 'Preferências',
        summary: 'Notificações, estilo de horário e intensidade do plano.',
      },
      {
        id: 'history',
        title: 'Histórico',
        summary: 'Gráfico simples de 4 semanas e revisões passadas.',
      },
      {
        id: 'help',
        title: 'Ajuda',
        summary: 'Como funciona, privacidade e recomeçar.',
      },
    ],
    inScope: [
      'Mapa rotina atual vs ideal',
      'Editar essenciais (drawer)',
      'Preferências e notificações (drawer)',
      'Histórico e detalhe de semana/dia (drawer)',
      'Atualizar diagnóstico parcial (drawer)',
      'Como funciona e privacidade',
      'Recomeçar do zero (modal confirmação)',
    ],
    outOfScope: [
      'Timeline e próxima tarefa (→ Hoje)',
      'Editor completo da semana corrente (→ Semana)',
      'FAB e imprevisto do dia (→ Hoje)',
    ],
  },
}

export const MY_ROUTINE_SEGMENT_TABS_FROM_CONTRACT = (
  Object.values(MY_ROUTINE_TAB_CONTRACTS) as MyRoutineTabContract[]
).map((tab) => ({
  id: tab.id,
  label: tab.label,
  available: true as const,
}))

export const MY_ROUTINE_SHARED_SURFACES = [
  'MyRoutineOnboardingDrawer',
  'MyRoutineHowItWorksDrawer',
  'MyRoutineSettingsDrawer',
  'MyRoutineTaskDetailDrawer',
  'MyRoutineEditTaskDrawer',
  'MyRoutineSnoozeDrawer',
  'MyRoutineSkipDrawer',
  'MyRoutineQuickTaskDrawer',
  'MyRoutineReminderDrawer',
  'MyRoutineDayDisruptionDrawer',
  'MyRoutineDayClosureDrawer',
  'MyRoutineDayMapDrawer',
  'MyRoutineMinimalRoutineExplainDrawer',
  'MyRoutineWeekPickerDrawer',
  'MyRoutineDayPlanDrawer',
  'MyRoutineRecurringHabitDrawer',
  'MyRoutineWeeklyReviewDrawer',
  'MyRoutineWeekendModeDrawer',
  'MyRoutineTemplatePickerDrawer',
  'MyRoutineProfileRefreshDrawer',
  'MyRoutineEssentialsEditorDrawer',
  'MyRoutinePreferencesDrawer',
  'MyRoutineHistoryDetailDrawer',
  'MyRoutinePrivacyDrawer',
  'MyRoutineNotificationPermissionModal',
] as const

export function getMyRoutineTabContract(tab: MyRoutineTab): MyRoutineTabContract {
  return MY_ROUTINE_TAB_CONTRACTS[tab]
}
