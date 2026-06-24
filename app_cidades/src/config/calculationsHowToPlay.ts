export type CalculationsHowToSection = {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export const CALCULATIONS_INTRO = {
  title: 'O que é Cálculos?',
  summary:
    'Resolva operações matemáticas o mais rápido possível. Digite o resultado e avance para a próxima conta.',
  rulesBrief:
    'Use o teclado numérico para montar a resposta. Ao completar os dígitos, o jogo confere automaticamente.',
}

export const CALCULATIONS_HOW_TO_PLAY_SECTIONS: CalculationsHowToSection[] = [
  {
    id: 'objective',
    title: 'Objetivo do jogo',
    paragraphs: [
      'Leia a operação exibida na tela, calcule mentalmente e informe o resultado correto.',
      'Cada acerto leva você automaticamente para a próxima conta.',
    ],
  },
  {
    id: 'rules',
    title: 'Regras principais',
    paragraphs: ['Durante a partida, lembre destes pontos:'],
    bullets: [
      'Toque nos números para montar sua resposta.',
      'Use Apagar para remover o último dígito digitado.',
      'Quando todos os dígitos estiverem preenchidos, o jogo confere automaticamente.',
      'Se errar, a resposta é limpa e você pode tentar novamente.',
    ],
  },
  {
    id: 'how-to-play',
    title: 'Como jogar aqui no app',
    paragraphs: ['Siga estes passos durante a partida:'],
    bullets: [
      'Observe a operação no centro da tela.',
      'Digite o resultado com o teclado numérico.',
      'Ao completar a resposta, a conferência acontece sozinha.',
      'Continue resolvendo até decidir encerrar a sessão.',
    ],
  },
  {
    id: 'tips',
    title: 'Dicas para começar',
    paragraphs: [
      'Comece no nível Fácil para aquecer o raciocínio e avance conforme se sentir confortável.',
      'Em contas mais longas, resolva por partes antes de digitar o resultado final.',
    ],
  },
]
