export const PROFISSIONAL_AVALIACAO_TOUR_STORAGE_KEY = 'telefarmed:profissional-avaliacao-tour-v1'
export const PROFISSIONAL_AVALIACAO_TOUR_INVITE_STORAGE_KEY =
  'telefarmed:profissional-avaliacao-tour-invite-v1'

/** Avaliação positiva usada no passo de card de comentário. */
export const PROFISSIONAL_AVALIACAO_TOUR_DEMO_REVIEW_ID = 'pr-1'

/** Avaliação crítica usada no passo da aba Críticas. */
export const PROFISSIONAL_AVALIACAO_TOUR_DEMO_CRITICAL_REVIEW_ID = 'pr-3'

export type ProfissionalAvaliacaoTourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center'

export type ProfissionalAvaliacaoTourAdvanceOn = 'next' | 'target-click' | 'next-or-target-click'

export type ProfissionalAvaliacaoTourStep = {
  id: string
  title: string
  body: string
  hint?: string
  nextLabel?: string
  target?: string
  placement?: ProfissionalAvaliacaoTourPlacement
  advanceOn?: ProfissionalAvaliacaoTourAdvanceOn
  skipIfMissing?: boolean
}


export const profissionalAvaliacaoTourSteps: ProfissionalAvaliacaoTourStep[] = [
  {
    id: 'welcome',
    title: 'Avaliação',
    body: 'Aqui você vê notas e comentários dos pacientes sobre seus atendimentos, filtra críticas e acompanha gráficos do período.',
    placement: 'center',
  },
  {
    id: 'hero',
    target: 'avaliacao-hero',
    title: 'Sua pontuação',
    body: 'Média geral, total de avaliações, contagem de 5★, 4★ e críticas (menos de 4 estrelas) no período.',
    placement: 'bottom',
  },
  {
    id: 'tabs',
    target: 'avaliacao-tabs',
    title: 'Filtrar comentários',
    body: 'Alterne entre Todos os comentários e Críticas para focar em avaliações que pedem atenção.',
    placement: 'bottom',
  },
  {
    id: 'search',
    target: 'avaliacao-search',
    title: 'Busca',
    body: 'Encontre comentários pelo nome do paciente ou trecho do texto.',
    placement: 'bottom',
  },
  {
    id: 'reviews-list',
    target: 'avaliacao-reviews-list',
    title: 'Lista de comentários',
    body: 'Cada card traz foto, nota, data e o comentário do paciente sobre o atendimento.',
    placement: 'top',
  },
  {
    id: 'review-card',
    target: 'avaliacao-review-card',
    title: 'Detalhe do comentário',
    body: 'Veja a nota em estrelas, a data da avaliação e o texto completo do feedback.',
    placement: 'top',
    skipIfMissing: true,
  },
  {
    id: 'tab-criticos',
    target: 'avaliacao-tab-criticos',
    title: 'Aba Críticas',
    body: 'Toque aqui para listar apenas avaliações abaixo de 4 estrelas — útil para acompanhar pontos de melhoria.',
    hint: 'Toque na aba Críticas ou clique em Ver críticas',
    nextLabel: 'Ver críticas',
    placement: 'bottom',
    advanceOn: 'next-or-target-click',
  },
  {
    id: 'critical-review',
    target: 'avaliacao-critical-review-card',
    title: 'Avaliação crítica',
    body: 'Comentários críticos aparecem com destaque vermelho e badge de alerta para facilitar a identificação.',
    placement: 'top',
    skipIfMissing: true,
  },
  {
    id: 'charts-sidebar',
    target: 'avaliacao-charts-sidebar',
    title: 'Painel de métricas',
    body: 'Gráficos e indicadores reagem aos filtros da lista — quanto mais amplo o filtro, mais dados você vê aqui.',
    placement: 'left',
  },
  {
    id: 'star-breakdown',
    target: 'avaliacao-star-breakdown',
    title: 'Distribuição por estrelas',
    body: 'Barras com a quantidade de avaliações em cada nota. Passe o mouse para ver detalhes.',
    placement: 'left',
  },
  {
    id: 'sentiment-donut',
    target: 'avaliacao-sentiment-donut',
    title: 'Positivas vs críticas',
    body: 'Proporção entre avaliações positivas (4–5★) e críticas (menos de 4★) no conjunto filtrado.',
    placement: 'left',
  },
  {
    id: 'weekly-volume',
    target: 'avaliacao-weekly-volume',
    title: 'Volume semanal',
    body: 'Evolução da quantidade de avaliações nas últimas semanas.',
    placement: 'left',
    skipIfMissing: true,
  },
  {
    id: 'done',
    title: 'Pronto!',
    body: 'Acompanhe seus feedbacks com regularidade e use as críticas como oportunidade de evolução. Bom trabalho!',
    placement: 'center',
  },
]
