export type LogicSequenceHowToSection = {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export const LOGIC_SEQUENCE_INTRO = {
  title: 'O que é Sequência lógica?',
  summary:
    'Observe o padrão da sequência e escolha o próximo item entre as opções. Pode ser número, forma ou símbolo.',
  rulesBrief:
    'Toque na opção que completa a sequência. Ao responder, o jogo confere automaticamente.',
}

export const LOGIC_SEQUENCE_HOW_TO_PLAY_SECTIONS: LogicSequenceHowToSection[] = [
  {
    id: 'objective',
    title: 'Objetivo do jogo',
    paragraphs: [
      'Analise a sequência exibida, identifique a regra do padrão e escolha o item que vem em seguida.',
      'Cada acerto leva você automaticamente para a próxima sequência.',
    ],
  },
  {
    id: 'rules',
    title: 'Regras principais',
    paragraphs: ['Durante a partida, lembre destes pontos:'],
    bullets: [
      'A sequência pode usar números, formas ou símbolos.',
      'O ponto de interrogação indica o item que falta descobrir.',
      'Toque em uma das quatro opções para responder.',
      'Se errar, você pode tentar novamente com outra opção.',
    ],
  },
  {
    id: 'how-to-play',
    title: 'Como jogar aqui no app',
    paragraphs: ['Siga estes passos durante a partida:'],
    bullets: [
      'Leia o enunciado e observe todos os itens da sequência.',
      'Escolha a opção que completa o padrão.',
      'A conferência acontece automaticamente após a escolha.',
      'Continue resolvendo até decidir encerrar a sessão.',
    ],
  },
  {
    id: 'tips',
    title: 'Dicas para começar',
    paragraphs: [
      'Procure repetições, ciclos, progressões ou alternâncias antes de decidir.',
      'Comece no nível Fácil e avance conforme se sentir confortável.',
    ],
  },
]
