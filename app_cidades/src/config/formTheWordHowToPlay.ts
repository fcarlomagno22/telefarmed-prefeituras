export type FormTheWordHowToSection = {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export const FORM_THE_WORD_INTRO = {
  title: 'O que é Forme a palavra?',
  summary:
    'Você recebe letras embaralhadas e uma dica. Toque nas peças na ordem certa para montar a palavra correta.',
  rulesBrief:
    'Quando a palavra tiver acento, a sílaba tônica aparece junta entre as letras embaralhadas.',
}

export const FORM_THE_WORD_HOW_TO_PLAY_SECTIONS: FormTheWordHowToSection[] = [
  {
    id: 'objective',
    title: 'Objetivo do jogo',
    paragraphs: [
      'Leia a dica, observe as letras embaralhadas e forme a palavra correta tocando cada peça.',
      'Cada palavra é um desafio rápido de vocabulário, ortografia e atenção.',
    ],
  },
  {
    id: 'rules',
    title: 'Regras principais',
    paragraphs: ['Durante a partida, lembre destes pontos:'],
    bullets: [
      'Toque nas letras embaralhadas para preencher a resposta na ordem escolhida.',
      'Palavras com acento mostram a sílaba tônica como um bloco único.',
      'Use Apagar para desfazer a última letra colocada.',
      'Use Revelar para ver a próxima peça correta ou Revelar tudo para completar.',
    ],
  },
  {
    id: 'how-to-play',
    title: 'Como jogar aqui no app',
    paragraphs: ['Siga estes passos durante a partida:'],
    bullets: [
      'Leia a dica exibida acima das letras.',
      'Toque nas peças embaralhadas para montar a palavra.',
      'Quando todas as peças estiverem na resposta, o jogo confere automaticamente.',
      'Se errar, as peças voltam e você pode tentar de novo.',
    ],
  },
  {
    id: 'tips',
    title: 'Dicas para começar',
    paragraphs: [
      'Procure identificar prefixos, sufixos e sílabas comuns antes de montar a palavra inteira.',
      'Comece no nível Fácil e avance conforme se sentir mais confortável.',
    ],
  },
]
