export const PROFISSIONAL_FINANCEIRO_TOUR_STORAGE_KEY = 'telefarmed:profissional-financeiro-tour-v1'

/** Competência aberta usada nos passos de fechamento (wizard completo). */
export const PROFISSIONAL_FINANCEIRO_TOUR_DEMO_COMPETENCE_KEY = '2026-05'

export type ProfissionalFinanceiroTourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center'

export type ProfissionalFinanceiroTourAdvanceOn = 'next' | 'target-click' | 'next-or-target-click'

export type ProfissionalFinanceiroTourStep = {
  id: string
  title: string
  body: string
  hint?: string
  nextLabel?: string
  target?: string
  placement?: ProfissionalFinanceiroTourPlacement
  advanceOn?: ProfissionalFinanceiroTourAdvanceOn
  skipIfMissing?: boolean
}

export const profissionalFinanceiroTourFirstVisitBody =
  'Na sua primeira visita, pedimos que conclua este tour — são poucos minutos e ajudam você a acompanhar recebimentos e fechar a competência com segurança. Depois, você pode rever quando quiser pelo botão "Ver tour guiado" no topo da página.'

export const profissionalFinanceiroTourSteps: ProfissionalFinanceiroTourStep[] = [
  {
    id: 'welcome',
    title: 'Financeiro',
    body: 'Aqui você acompanha plantões por competência, valores previstos, histórico de fechamentos e envia nota fiscal para repasse via PIX.',
    placement: 'center',
  },
  {
    id: 'month-nav',
    target: 'financeiro-month-nav',
    title: 'Navegação por mês',
    body: 'Use as setas para alternar entre competências. Cada mês mostra plantões realizados, previstos e o status do fechamento.',
    placement: 'bottom',
  },
  {
    id: 'hero',
    target: 'financeiro-hero',
    title: 'Resumo da competência',
    body: 'Previsão com base nos plantões já realizados, potencial se todos ocorrerem, e contagem de realizados e previstos.',
    placement: 'bottom',
  },
  {
    id: 'shifts-panel',
    target: 'financeiro-shifts-panel',
    title: 'Plantões da competência',
    body: 'Lista detalhada de cada plantão: data, turno, ID da escala, valor e status de faturamento.',
    placement: 'top',
  },
  {
    id: 'closure-btn',
    target: 'financeiro-closure-btn',
    title: 'Fazer fechamento',
    body: 'Sempre a partir do primeiro dia de cada mês, você poderá fazer o fechamento dos seus plantões para solicitar o pagamento.',
    hint: 'Toque no botão laranja ou clique em Ver fechamento',
    nextLabel: 'Ver fechamento',
    placement: 'left',
    advanceOn: 'next-or-target-click',
    skipIfMissing: true,
  },
  {
    id: 'closure-step-1',
    target: 'financeiro-closure-conferencia',
    title: 'Etapa 1 — Conferência',
    body: 'Revise a empresa prestadora, valores realizados e plantões. Marque a confirmação antes de avançar para a nota fiscal.',
    placement: 'left',
    skipIfMissing: true,
  },
  {
    id: 'closure-step-2',
    target: 'financeiro-closure-invoice',
    title: 'Etapa 2 — Nota fiscal',
    body: 'Anexe a NF de prestação de serviços em PDF ou XML. Arraste o arquivo ou clique para selecionar.',
    placement: 'left',
    skipIfMissing: true,
  },
  {
    id: 'closure-step-3',
    target: 'financeiro-closure-pix',
    title: 'Etapa 3 — PIX e envio',
    body: 'Confirme a chave PIX da mesma empresa do cadastro. Ao enviar, o fechamento entra em análise para repasse.',
    placement: 'left',
    skipIfMissing: true,
  },
  {
    id: 'forecast',
    target: 'financeiro-forecast',
    title: 'Previsão por mês',
    body: 'Gráfico comparando valores realizados e previstos em cada competência do período disponível.',
    placement: 'left',
  },
  {
    id: 'history',
    target: 'financeiro-history',
    title: 'Histórico de competências',
    body: 'Lista rápida de meses anteriores com status do fechamento, plantões realizados e total. Clique para alternar a competência.',
    placement: 'left',
  },
  {
    id: 'done',
    title: 'Pronto!',
    body: 'Acompanhe seus plantões mês a mês e feche a competência assim que concluir os atendimentos. Bom trabalho!',
    placement: 'center',
  },
]

export const profissionalFinanceiroClosureTourStepIds = new Set([
  'closure-step-1',
  'closure-step-2',
  'closure-step-3',
])

export const PROFISSIONAL_FINANCEIRO_TOUR_DEMO_INVOICE_FILE = 'NF-demo-tour.pdf'
