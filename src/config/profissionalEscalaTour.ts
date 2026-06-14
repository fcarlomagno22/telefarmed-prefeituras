export const PROFISSIONAL_ESCALA_TOUR_STORAGE_KEY = 'telefarmed:profissional-escala-tour-v1'
export const PROFISSIONAL_ESCALA_TOUR_INVITE_STORAGE_KEY =
  'telefarmed:profissional-escala-tour-invite-v1'

/** Plantão aberto usado nos passos de pegar plantão e modal. */
export const PROFISSIONAL_ESCALA_TOUR_DEMO_SHIFT_ID = 'prof-esc-open-1'

export type ProfissionalEscalaTourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center'

export type ProfissionalEscalaTourAdvanceOn = 'next' | 'target-click' | 'next-or-target-click'

export type ProfissionalEscalaTourStep = {
  id: string
  title: string
  body: string
  hint?: string
  nextLabel?: string
  target?: string
  placement?: ProfissionalEscalaTourPlacement
  advanceOn?: ProfissionalEscalaTourAdvanceOn
  skipIfMissing?: boolean
}


export const profissionalEscalaTourSteps: ProfissionalEscalaTourStep[] = [
  {
    id: 'welcome',
    title: 'Plantões disponíveis',
    body: 'Aqui você encontra turnos abertos na rede, filtra por data e valor, reserva plantões e acompanha seus números do mês.',
    placement: 'center',
  },
  {
    id: 'filters',
    target: 'escala-filters',
    title: 'Filtros de busca',
    body: 'Escolha especialidade, período, turno, modalidade e faixa de valor. Depois clique em Buscar plantões para atualizar a lista.',
    placement: 'bottom',
  },
  {
    id: 'shifts-list',
    target: 'escala-shifts-list',
    title: 'Plantões encontrados',
    body: 'Cada linha mostra data, horário, especialidade, modalidade, cidade, valor e vagas. Telemedicina aparece com ícone de vídeo; presencial mostra a cidade.',
    placement: 'top',
  },
  {
    id: 'city-tooltip',
    target: 'escala-city-tooltip',
    title: 'Endereço presencial',
    body: 'Em plantões presenciais, passe o mouse ou toque na cidade sublinhada para ver o local e o endereço completo da unidade.',
    placement: 'left',
    skipIfMissing: true,
  },
  {
    id: 'claim-btn',
    target: 'escala-claim-btn',
    title: 'Reservar plantão',
    body: 'Quando houver vagas, use Pegar plantão para iniciar a reserva. Você confirma horário e valor antes de concluir.',
    hint: 'Toque no botão laranja ou clique em Ver confirmação',
    nextLabel: 'Ver confirmação',
    placement: 'left',
    advanceOn: 'next-or-target-click',
    skipIfMissing: true,
  },
  {
    id: 'claim-modal',
    target: 'escala-claim-modal',
    title: 'Confirmar reserva',
    body: 'Revise especialidade, data, horário, unidade e valor. Ao confirmar, o plantão vai para sua Agenda e entra no Financeiro do mês.',
    placement: 'right',
    skipIfMissing: true,
  },
  {
    id: 'kpis',
    target: 'escala-kpis',
    title: 'Indicadores rápidos',
    body: 'Disponíveis hoje, nesta semana, valor médio dos plantões abertos e quantos você já captou no mês.',
    placement: 'left',
  },
  {
    id: 'sidebar',
    target: 'escala-sidebar',
    title: 'Seu painel',
    body: 'Sua especialidade verificada, produção do mês, taxa de aceitação e atalhos para Agenda, Financeiro e Suporte.',
    placement: 'left',
  },
  {
    id: 'how-it-works',
    target: 'escala-how-it-works',
    title: 'Como funciona',
    body: 'Passo a passo resumido: escolher plantão, conferir local (se presencial), reservar e acompanhar na Agenda e no Financeiro.',
    placement: 'left',
  },
  {
    id: 'reservations',
    target: 'escala-reservations',
    title: 'Reservas nesta sessão',
    body: 'Plantões que você reservou agora aparecem aqui até recarregar a página — útil para conferir o que acabou de pegar.',
    placement: 'left',
    skipIfMissing: true,
  },
  {
    id: 'status-bar',
    target: 'operator-footer',
    title: 'Sessão ativa',
    body: 'Confirma que você está logado com o perfil correto antes de reservar plantões.',
    placement: 'top',
  },
  {
    id: 'done',
    title: 'Pronto!',
    body: 'Filtre, compare valores e reserve com calma. Depois de pegar um plantão, confira-o na Agenda. Bom plantão!',
    placement: 'center',
  },
]

export const profissionalEscalaClaimTourStepIds = new Set(['claim-modal'])
