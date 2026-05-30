import type { ProfissionalAgendaTab } from '../hooks/useProfissionalAgendaState'

export const PROFISSIONAL_AGENDA_TOUR_STORAGE_KEY = 'telefarmed:profissional-agenda-tour-v1'

/** z-index acima de drawers (9998), lock de consulta e demais overlays. */
export const PROFISSIONAL_TOUR_Z_INDEX = 99999

export type ProfissionalAgendaTourPlacement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'center'

export type ProfissionalAgendaTourAdvanceOn = 'next' | 'target-click' | 'next-or-target-click'

export type ProfissionalAgendaTourStep = {
  id: string
  title: string
  body: string
  hint?: string
  /** Texto do botão principal quando diferente de "Continuar". */
  nextLabel?: string
  target?: string
  placement?: ProfissionalAgendaTourPlacement
  tab?: ProfissionalAgendaTab
  advanceOn?: ProfissionalAgendaTourAdvanceOn
  skipIfMissing?: boolean
}

export const profissionalAgendaTourFirstVisitBody =
  'Na sua primeira visita, pedimos que conclua este tour — são poucos minutos e ajudam você a começar com mais segurança. Depois, você pode rever quando quiser pelo botão "Ver tour guiado" no topo da página.'

export const profissionalAgendaTourSteps: ProfissionalAgendaTourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo à sua Agenda',
    body: 'Daqui você vê plantões, entra no turno e atende pacientes. Vamos fazer um tour rápido juntos — calendário e fila, passo a passo.',
    placement: 'center',
  },
  {
    id: 'tabs',
    target: 'agenda-tabs',
    title: 'Duas abas principais',
    body: 'Calendário = seus dias de plantão. Fila de atendimento = pacientes esperando você.',
    placement: 'bottom',
    tab: 'dia',
  },
  {
    id: 'calendar',
    target: 'agenda-calendar',
    title: 'Calendário do mês',
    body: 'Bolinha laranja = dia com plantão. Toque no dia para ver horários e detalhes embaixo.',
    placement: 'top',
    tab: 'dia',
  },
  {
    id: 'sidebar',
    target: 'agenda-sidebar',
    title: 'Resumo do mês',
    body: 'Quantos plantões você tem, avisos importantes e os próximos turnos. Toque em um item para ir ao dia.',
    placement: 'left',
    tab: 'dia',
  },
  {
    id: 'day-shifts',
    target: 'agenda-day-shifts',
    title: 'Plantões do dia',
    body: 'Cada card mostra especialidade, horário e quantos pacientes estão na fila daquele turno.',
    placement: 'top',
    tab: 'dia',
    skipIfMissing: true,
  },
  {
    id: 'enter-shift',
    target: 'enter-shift-btn',
    title: 'Entrar no plantão',
    body: 'No horário do turno, entre no plantão para liberar a fila. Depois vamos abrir a aba Fila de atendimento.',
    hint: 'Toque no botão laranja ou clique em Ir para a fila',
    nextLabel: 'Ir para a fila',
    placement: 'top',
    tab: 'dia',
    advanceOn: 'next-or-target-click',
    skipIfMissing: true,
  },
  {
    id: 'tab-fila',
    target: 'tab-fila',
    title: 'Fila de atendimento',
    body: 'Esta aba concentra os pacientes do plantão. Você pode voltar aqui a qualquer momento durante o turno.',
    placement: 'bottom',
    tab: 'fila',
    skipIfMissing: true,
  },
  {
    id: 'queue-panel',
    target: 'queue-panel',
    title: 'Painel da fila',
    body: 'Aqui você vê o plantão ativo, quantos pacientes esperam e o relógio do turno.',
    placement: 'right',
    tab: 'fila',
    skipIfMissing: true,
  },
  {
    id: 'queue-search',
    target: 'queue-search',
    title: 'Buscar paciente',
    body: 'Digite o nome para achar alguém na fila com mais rapidez.',
    placement: 'bottom',
    tab: 'fila',
    skipIfMissing: true,
  },
  {
    id: 'queue-list-tabs',
    target: 'queue-list-tabs',
    title: 'Fila e atendidos',
    body: 'Fila de atendimento = quem ainda espera. Atendidos = quem você já consultou neste plantão.',
    placement: 'bottom',
    tab: 'fila',
    skipIfMissing: true,
  },
  {
    id: 'queue-consult-btn',
    target: 'queue-consult-btn',
    title: 'Chamar paciente',
    body: 'Quando o paciente estiver na sala de espera, toque no ícone de consulta para iniciar a teleconsulta.',
    hint: 'Botão azul com estetoscópio na linha do paciente',
    placement: 'top',
    tab: 'fila',
    skipIfMissing: true,
  },
  {
    id: 'done',
    title: 'Pronto!',
    body: 'Para pegar plantões novos, vá em Plantões no menu. Dúvidas? Use Suporte. Bom plantão!',
    placement: 'center',
  },
]
