export type SudokuHowToSection = {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export const SUDOKU_INTRO = {
  title: 'O que é o Sudoku?',
  summary:
    'Sudoku é um quebra-cabeça de lógica com uma grade 9×9. O objetivo é preencher todas as células usando os números de 1 a 9.',
  rulesBrief:
    'Cada número deve aparecer apenas uma vez em cada linha, coluna e bloco 3×3, sem repetir.',
}

export const SUDOKU_HOW_TO_PLAY_SECTIONS: SudokuHowToSection[] = [
  {
    id: 'objective',
    title: 'Objetivo do jogo',
    paragraphs: [
      'Complete toda a grade com números de 1 a 9. Alguns números já vêm preenchidos e não podem ser alterados.',
      'Use raciocínio lógico para descobrir os que faltam — não é necessário fazer contas.',
    ],
  },
  {
    id: 'rules',
    title: 'Regras principais',
    paragraphs: ['Um Sudoku válido segue três regras simples:'],
    bullets: [
      'Cada linha horizontal deve conter os números de 1 a 9, sem repetir.',
      'Cada coluna vertical deve conter os números de 1 a 9, sem repetir.',
      'Cada bloco 3×3 deve conter os números de 1 a 9, sem repetir.',
    ],
  },
  {
    id: 'how-to-play',
    title: 'Como jogar aqui no app',
    paragraphs: ['Siga estes passos durante a partida:'],
    bullets: [
      'Toque em uma célula vazia para selecioná-la.',
      'Escolha um número de 1 a 9 no teclado abaixo da grade.',
      'Use Apagar para remover um número que você digitou.',
      'Use Revelar se quiser ver o número correto da célula selecionada.',
      'Números em conflito ficam destacados em vermelho.',
    ],
  },
  {
    id: 'tips',
    title: 'Dicas para começar',
    paragraphs: [
      'Procure linhas, colunas ou blocos com muitos números já preenchidos — eles costumam ser mais fáceis de completar.',
      'Comece no nível Fácil e avance conforme se sentir mais confortável.',
    ],
  },
]
