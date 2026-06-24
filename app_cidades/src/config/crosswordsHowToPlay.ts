export type CrosswordsHowToSection = {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export const CROSSWORDS_INTRO = {
  title: 'O que são Palavras cruzadas?',
  summary:
    'Leia as dicas, toque na grade e preencha as palavras que se cruzam. Cada letra correta aproxima você da solução completa.',
  rulesBrief:
    'Palavras horizontais e verticais compartilham letras nos cruzamentos. Use as dicas numeradas para descobrir cada resposta.',
}

export const CROSSWORDS_HOW_TO_PLAY_SECTIONS: CrosswordsHowToSection[] = [
  {
    id: 'objective',
    title: 'Objetivo do jogo',
    paragraphs: [
      'Complete todas as palavras da cruzadinha usando as dicas exibidas na lista.',
      'Cada palavra correta é confirmada automaticamente e fica travada na grade.',
    ],
  },
  {
    id: 'rules',
    title: 'Regras principais',
    paragraphs: ['Durante a partida, lembre destes pontos:'],
    bullets: [
      'Toque em uma célula para selecionar a palavra ativa.',
      'Use o teclado para inserir letras e o botão Apagar para corrigir.',
      'Toque no número da palavra na grade para ver a dica.',
      'Use Revelar para mostrar a letra selecionada.',
    ],
  },
  {
    id: 'how-to-play',
    title: 'Como jogar aqui no app',
    paragraphs: ['Siga estes passos durante a partida:'],
    bullets: [
      'Leia a dica da palavra ativa acima do teclado.',
      'Preencha as letras na grade na horizontal ou vertical.',
      'Quando uma palavra estiver completa e correta, ela é confirmada.',
      'Se errar, apenas as letras incorretas da palavra são limpas. Letras corretas nos cruzamentos permanecem.',
    ],
  },
  {
    id: 'tips',
    title: 'Dicas para começar',
    paragraphs: [
      'Comece pelas palavras com mais letras já preenchidas nos cruzamentos.',
      'No nível Fácil, as palavras são menores e a grade é mais compacta.',
    ],
  },
]
