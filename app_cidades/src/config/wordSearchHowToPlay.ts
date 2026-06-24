export type WordSearchHowToSection = {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export const WORD_SEARCH_INTRO = {
  title: 'O que é Caça-palavras?',
  summary:
    'Encontre palavras escondidas na grade 9×9. Toque letra por letra ou arraste em linha reta — horizontal, vertical ou diagonal.',
  rulesBrief:
    'Toque a primeira letra e depois as seguintes, ou arraste até o fim da palavra. Acertos ficam verdes; erros piscam em vermelho.',
}

export const WORD_SEARCH_HOW_TO_PLAY_SECTIONS: WordSearchHowToSection[] = [
  {
    id: 'objective',
    title: 'Objetivo do jogo',
    paragraphs: [
      'Encontre todas as palavras listadas nas dicas dentro da grade.',
      'Cada palavra pode estar na horizontal, vertical ou diagonal, em qualquer direção.',
    ],
  },
  {
    id: 'rules',
    title: 'Regras principais',
    paragraphs: ['Durante a partida, lembre destes pontos:'],
    bullets: [
      'Toque a primeira letra e depois as demais em linha reta, ou arraste do início ao fim.',
      'Enquanto seleciona, as letras ficam destacadas em rosa.',
      'Se acertar, as letras ficam verdes permanentemente.',
      'Se errar, a seleção fica vermelha e some após um instante.',
    ],
  },
  {
    id: 'how-to-play',
    title: 'Como jogar aqui no app',
    paragraphs: ['Siga estes passos durante a partida:'],
    bullets: [
      'Leia as dicas na lista abaixo da grade.',
      'Toque letra por letra ou arraste para formar a palavra.',
      'Palavras encontradas são riscadas na lista de dicas.',
      'Complete todas as palavras para vencer a partida.',
    ],
  },
  {
    id: 'tips',
    title: 'Dicas para começar',
    paragraphs: [
      'Procure letras raras ou combinações que aparecem nas dicas.',
      'No nível Fácil há menos palavras; no Difícil a grade fica mais cheia.',
    ],
  },
]
