import type { BibleVerseRef, PeaceWordsCategory, PeaceWordsTopic } from '../types/bible'

const v = (abbrev: string, chapter: number, verse: number): BibleVerseRef => ({
  abbrev,
  chapter,
  verse,
})

export const PEACE_WORDS_CATEGORIES: PeaceWordsCategory[] = [
  {
    id: 'anxiety-fear',
    title: 'Ansiedade e medo',
    accent: '#7dd3fc',
    accentSoft: 'rgba(125, 211, 252, 0.14)',
    topics: [
      {
        id: 'estou-ansioso',
        label: 'Estou ansioso',
        phrasesFile: 'frases_estou_ansioso',
      },
      {
        id: 'estou-com-medo',
        label: 'Estou com medo',
        phrasesFile: 'frases_estou_com_medo',
      },
      {
        id: 'estou-preocupado',
        label: 'Estou preocupado',
        phrasesFile: 'frases_estou_preocupado',
      },
      {
        id: 'estou-em-panico',
        label: 'Estou em pânico',
        phrasesFile: 'frases_estou_em_panico',
      },
      {
        id: 'estou-inseguro',
        label: 'Estou inseguro',
        phrasesFile: 'frases_estou_inseguro',
      },
      {
        id: 'mente-agitada',
        label: 'Estou com a mente agitada',
        phrasesFile: 'frases_estou_com_a_mente_agitada',
      },
      {
        id: 'nao-consigo-dormir',
        label: 'Não consigo dormir',
        phrasesFile: 'frases_nao_consigo_dormir',
      },
      {
        id: 'medo-do-futuro',
        label: 'Tenho medo do futuro',
        phrasesFile: 'frases_tenho_medo_do_futuro',
      },
    ],
  },
  {
    id: 'sadness-loneliness',
    title: 'Tristeza e solidão',
    accent: '#c4b5fd',
    accentSoft: 'rgba(196, 181, 253, 0.14)',
    topics: [
      {
        id: 'estou-triste',
        label: 'Estou triste',
        verses: [v('sl', 34, 18), v('mt', 5, 4), v('sl', 30, 5), v('ap', 21, 4), v('sl', 42, 11)],
      },
      {
        id: 'estou-desanimado',
        label: 'Estou desanimado',
        verses: [v('sl', 42, 11), v('2co', 4, 16), v('gl', 6, 9), v('is', 40, 31), v('hb', 12, 3)],
      },
      {
        id: 'estou-angustiado',
        label: 'Estou angustiado',
        verses: [v('sl', 55, 22), v('mt', 11, 28), v('2co', 1, 3), v('sl', 61, 2), v('sl', 94, 19)],
      },
      {
        id: 'estou-sozinho',
        label: 'Estou sozinho',
        verses: [v('dt', 31, 6), v('js', 1, 9), v('hb', 13, 5), v('sl', 68, 6), v('is', 41, 10)],
      },
      {
        id: 'me-sinto-rejeitado',
        label: 'Estou me sentindo rejeitado',
        verses: [v('rm', 8, 31), v('is', 54, 10), v('sl', 27, 10), v('jo', 1, 12), v('ef', 1, 5)],
      },
      {
        id: 'sem-esperanca',
        label: 'Estou sem esperança',
        verses: [v('rm', 15, 13), v('lm', 3, 21), v('sl', 71, 14), v('jr', 29, 11), v('rm', 5, 5)],
      },
      {
        id: 'emocionalmente-cansado',
        label: 'Estou emocionalmente cansado',
        verses: [v('mt', 11, 28), v('is', 40, 29), v('gl', 6, 9), v('sl', 23, 2), v('2co', 4, 16)],
      },
      {
        id: 'nao-encontro-alegria',
        label: 'Não encontro alegria',
        verses: [v('ne', 8, 10), v('sl', 16, 11), v('jo', 15, 11), v('fp', 4, 4), v('sl', 30, 11)],
      },
    ],
  },
  {
    id: 'pain-loss',
    title: 'Dor e perdas',
    accent: '#fda4af',
    accentSoft: 'rgba(253, 164, 175, 0.14)',
    topics: [
      {
        id: 'estou-de-luto',
        label: 'Estou de luto',
        verses: [v('mt', 5, 4), v('sl', 34, 18), v('1ts', 4, 13), v('ap', 21, 4), v('sl', 23, 4)],
      },
      {
        id: 'perdi-alguem-que-amo',
        label: 'Perdi alguém que amo',
        verses: [v('sl', 23, 4), v('jo', 11, 25), v('is', 41, 10), v('sl', 116, 15), v('ap', 21, 4)],
      },
      {
        id: 'enfrentando-doenca',
        label: 'Estou enfrentando uma doença',
        verses: [v('sl', 41, 3), v('is', 53, 5), v('tg', 5, 14), v('3jo', 1, 2), v('sl', 103, 3)],
      },
      {
        id: 'alguem-que-amo-doente',
        label: 'Alguém que amo está doente',
        verses: [v('fp', 4, 6), v('sl', 103, 3), v('is', 53, 4), v('mt', 8, 17), v('sl', 41, 3)],
      },
      {
        id: 'estou-sofrendo',
        label: 'Estou sofrendo',
        verses: [v('rm', 8, 18), v('1pe', 4, 12), v('sl', 34, 19), v('2co', 1, 5), v('is', 43, 2)],
      },
      {
        id: 'grande-perda',
        label: 'Estou passando por uma grande perda',
        verses: [v('jl', 2, 25), v('jó', 1, 21), v('rm', 8, 28), v('is', 61, 3), v('sl', 34, 18)],
      },
      {
        id: 'planos-deram-errado',
        label: 'Meus planos deram errado',
        verses: [v('pv', 16, 9), v('jr', 29, 11), v('rm', 8, 28), v('sl', 37, 5), v('pv', 19, 21)],
      },
      {
        id: 'preciso-recomecar',
        label: 'Preciso recomeçar',
        verses: [v('is', 43, 19), v('lm', 3, 22), v('2co', 5, 17), v('jl', 2, 25), v('is', 61, 3)],
      },
    ],
  },
  {
    id: 'guilt-forgiveness',
    title: 'Culpa e perdão',
    accent: '#86efac',
    accentSoft: 'rgba(134, 239, 172, 0.14)',
    topics: [
      {
        id: 'me-sinto-culpado',
        label: 'Estou me sentindo culpado',
        verses: [v('1jo', 1, 9), v('sl', 103, 12), v('rm', 8, 1), v('is', 1, 18), v('sl', 32, 5)],
      },
      {
        id: 'estou-arrependido',
        label: 'Estou arrependido',
        verses: [v('atos', 3, 19), v('2co', 7, 10), v('lc', 15, 7), v('sl', 51, 17), v('1jo', 1, 9)],
      },
      {
        id: 'preciso-de-perdao',
        label: 'Preciso de perdão',
        verses: [v('sl', 32, 5), v('1jo', 1, 9), v('mt', 6, 14), v('lc', 23, 34), v('sl', 103, 10)],
      },
      {
        id: 'preciso-me-perdoar',
        label: 'Preciso me perdoar',
        verses: [v('rm', 8, 1), v('cl', 2, 13), v('ef', 1, 7), v('mq', 7, 19), v('sl', 103, 12)],
      },
      {
        id: 'preciso-perdoar-alguem',
        label: 'Preciso perdoar alguém',
        verses: [v('mt', 6, 14), v('ef', 4, 32), v('cl', 3, 13), v('mc', 11, 25), v('lc', 6, 37)],
      },
      {
        id: 'estou-magoado',
        label: 'Estou magoado',
        verses: [v('sl', 147, 3), v('mt', 11, 28), v('na', 1, 7), v('sl', 34, 18), v('sl', 55, 22)],
      },
      {
        id: 'fui-traido',
        label: 'Fui traído',
        verses: [v('sl', 55, 12), v('sl', 41, 9), v('rm', 12, 19), v('pv', 3, 5), v('sl', 27, 10)],
      },
      {
        id: 'fui-injusticado',
        label: 'Fui injustiçado',
        verses: [v('1pe', 2, 23), v('rm', 12, 19), v('sl', 37, 5), v('mt', 5, 11), v('sl', 7, 8)],
      },
    ],
  },
  {
    id: 'family-relationships',
    title: 'Família e relacionamentos',
    accent: '#fdba74',
    accentSoft: 'rgba(253, 186, 116, 0.14)',
    topics: [
      {
        id: 'problemas-na-familia',
        label: 'Estou com problemas na família',
        verses: [v('js', 24, 15), v('ef', 4, 2), v('cl', 3, 13), v('sl', 133, 1), v('pv', 17, 17)],
      },
      {
        id: 'relacionamento-em-crise',
        label: 'Meu relacionamento está em crise',
        verses: [v('1co', 13, 4), v('ef', 4, 32), v('1pe', 4, 8), v('cl', 3, 14), v('pv', 10, 12)],
      },
      {
        id: 'preocupado-com-filhos',
        label: 'Estou preocupado com meus filhos',
        verses: [v('pv', 22, 6), v('sl', 127, 3), v('is', 54, 13), v('3jo', 1, 4), v('pv', 23, 24)],
      },
      {
        id: 'enfrentando-conflitos',
        label: 'Estou enfrentando conflitos',
        verses: [v('mt', 5, 9), v('tg', 1, 19), v('pv', 15, 1), v('rm', 12, 18), v('ef', 4, 3)],
      },
      {
        id: 'raiva-de-alguem',
        label: 'Estou com raiva de alguém',
        verses: [v('ef', 4, 26), v('tg', 1, 19), v('pv', 15, 18), v('cl', 3, 8), v('rm', 12, 19)],
      },
      {
        id: 'preciso-ter-paciencia',
        label: 'Preciso ter paciência',
        verses: [v('gl', 5, 22), v('tg', 1, 3), v('rm', 12, 12), v('cl', 3, 12), v('pv', 14, 29)],
      },
      {
        id: 'controlar-minhas-palavras',
        label: 'Preciso controlar minhas palavras',
        verses: [v('tg', 1, 26), v('pv', 15, 4), v('ef', 4, 29), v('pv', 18, 21), v('tg', 3, 5)],
      },
      {
        id: 'restaurar-relacionamento',
        label: 'Quero restaurar um relacionamento',
        verses: [v('mt', 18, 21), v('2co', 5, 18), v('rm', 12, 18), v('cl', 3, 13), v('ef', 4, 32)],
      },
    ],
  },
  {
    id: 'strength-hope',
    title: 'Força e esperança',
    accent: '#fcd34d',
    accentSoft: 'rgba(252, 211, 77, 0.14)',
    topics: [
      {
        id: 'preciso-de-forca',
        label: 'Preciso de força',
        verses: [v('is', 40, 31), v('fp', 4, 13), v('2co', 12, 9), v('sl', 28, 7), v('ef', 6, 10)],
      },
      {
        id: 'preciso-de-coragem',
        label: 'Preciso de coragem',
        verses: [v('js', 1, 9), v('dt', 31, 6), v('2tm', 1, 7), v('sl', 27, 14), v('is', 41, 10)],
      },
      {
        id: 'preciso-de-esperanca',
        label: 'Preciso de esperança',
        verses: [v('rm', 15, 13), v('jr', 29, 11), v('rm', 5, 5), v('lm', 3, 21), v('sl', 42, 11)],
      },
      {
        id: 'preciso-de-paz',
        label: 'Preciso de paz',
        verses: [v('jo', 14, 27), v('fp', 4, 7), v('is', 26, 3), v('rm', 15, 13), v('sl', 29, 11)],
      },
      {
        id: 'preciso-de-consolo',
        label: 'Preciso de consolo',
        verses: [v('2co', 1, 3), v('mt', 5, 4), v('sl', 23, 4), v('is', 40, 1), v('sl', 34, 18)],
      },
      {
        id: 'preciso-descansar',
        label: 'Preciso descansar',
        verses: [v('mt', 11, 28), v('sl', 23, 2), v('hb', 4, 9), v('ex', 33, 14), v('sl', 4, 8)],
      },
      {
        id: 'preciso-seguir-em-frente',
        label: 'Preciso seguir em frente',
        verses: [v('fp', 3, 13), v('is', 43, 18), v('pv', 4, 25), v('2co', 5, 17), v('lc', 9, 62)],
      },
      {
        id: 'quero-confiar-em-deus',
        label: 'Quero confiar em Deus',
        verses: [v('pv', 3, 5), v('sl', 37, 5), v('is', 26, 4), v('rm', 8, 28), v('pv', 16, 3)],
      },
    ],
  },
  {
    id: 'decisions-purpose',
    title: 'Decisões e propósito',
    accent: '#5eead4',
    accentSoft: 'rgba(94, 234, 212, 0.14)',
    topics: [
      {
        id: 'estou-confuso',
        label: 'Estou confuso',
        verses: [v('tg', 1, 5), v('pv', 3, 5), v('1co', 14, 33), v('sl', 25, 4), v('is', 30, 21)],
      },
      {
        id: 'nao-sei-o-que-fazer',
        label: 'Não sei o que fazer',
        verses: [v('sl', 32, 8), v('pv', 16, 3), v('tg', 1, 5), v('is', 30, 21), v('pv', 3, 6)],
      },
      {
        id: 'preciso-tomar-decisao',
        label: 'Preciso tomar uma decisão',
        verses: [v('pv', 3, 5), v('tg', 1, 5), v('fp', 4, 6), v('sl', 37, 23), v('pv', 16, 3)],
      },
      {
        id: 'nao-sei-qual-caminho',
        label: 'Não sei qual caminho seguir',
        verses: [v('sl', 119, 105), v('pv', 3, 6), v('is', 30, 21), v('jr', 10, 23), v('pv', 4, 26)],
      },
      {
        id: 'me-sinto-perdido',
        label: 'Estou me sentindo perdido',
        verses: [v('lc', 19, 10), v('sl', 23, 3), v('is', 58, 11), v('jo', 14, 6), v('sl', 25, 16)],
      },
      {
        id: 'nao-encontro-sentido',
        label: 'Não encontro sentido na vida',
        verses: [v('ec', 3, 11), v('jr', 29, 11), v('rm', 8, 28), v('sl', 139, 16), v('ef', 2, 10)],
      },
      {
        id: 'descobrir-proposito',
        label: 'Quero descobrir meu propósito',
        verses: [v('ef', 2, 10), v('jr', 1, 5), v('rm', 12, 2), v('fp', 2, 13), v('sl', 138, 8)],
      },
      {
        id: 'preciso-de-sabedoria',
        label: 'Preciso de sabedoria',
        verses: [v('tg', 1, 5), v('pv', 2, 6), v('cl', 1, 9), v('pv', 4, 7), v('1rs', 3, 9)],
      },
    ],
  },
  {
    id: 'self-esteem-identity',
    title: 'Autoestima e identidade',
    accent: '#a5b4fc',
    accentSoft: 'rgba(165, 180, 252, 0.14)',
    topics: [
      {
        id: 'me-sinto-incapaz',
        label: 'Estou me sentindo incapaz',
        verses: [v('2co', 12, 9), v('fp', 4, 13), v('zc', 4, 6), v('ex', 4, 10), v('is', 41, 10)],
      },
      {
        id: 'nao-reconheco-valor',
        label: 'Não reconheço meu valor',
        verses: [v('sl', 139, 14), v('ef', 2, 10), v('1pe', 2, 9), v('rm', 8, 17), v('jo', 1, 12)],
      },
      {
        id: 'me-comparando',
        label: 'Estou me comparando',
        verses: [v('gl', 6, 4), v('2co', 10, 12), v('sl', 139, 14), v('1sm', 16, 7), v('fp', 2, 3)],
      },
      {
        id: 'vergonha-de-mim',
        label: 'Estou com vergonha de mim',
        verses: [v('rm', 8, 1), v('is', 61, 7), v('sl', 34, 5), v('1jo', 3, 1), v('sl', 103, 12)],
      },
      {
        id: 'medo-de-fracassar',
        label: 'Tenho medo de fracassar',
        verses: [v('js', 1, 9), v('fp', 4, 13), v('rm', 8, 37), v('pv', 24, 16), v('2co', 12, 9)],
      },
      {
        id: 'nao-sou-suficiente',
        label: 'Sinto que não sou suficiente',
        verses: [v('2co', 12, 9), v('ef', 2, 8), v('rm', 8, 31), v('is', 41, 10), v('sl', 139, 14)],
      },
      {
        id: 'aceitar-limitacoes',
        label: 'Preciso aceitar minhas limitações',
        verses: [v('2co', 12, 9), v('sl', 103, 14), v('fp', 4, 11), v('rm', 8, 26), v('2co', 4, 7)],
      },
      {
        id: 'acreditar-em-mim',
        label: 'Quero acreditar em mim novamente',
        verses: [v('fp', 4, 13), v('js', 1, 9), v('sl', 139, 14), v('is', 41, 10), v('ef', 2, 10)],
      },
    ],
  },
  {
    id: 'work-finances',
    title: 'Trabalho e vida financeira',
    accent: '#fb923c',
    accentSoft: 'rgba(251, 146, 60, 0.14)',
    topics: [
      {
        id: 'estou-desempregado',
        label: 'Estou desempregado',
        verses: [v('mt', 6, 26), v('fp', 4, 19), v('sl', 37, 25), v('mt', 6, 33), v('sl', 23, 1)],
      },
      {
        id: 'preocupado-com-dinheiro',
        label: 'Estou preocupado com dinheiro',
        verses: [v('mt', 6, 24), v('fp', 4, 19), v('hb', 13, 5), v('lc', 12, 15), v('sl', 37, 25)],
      },
      {
        id: 'estou-endividado',
        label: 'Estou endividado',
        verses: [v('pv', 22, 7), v('rm', 13, 8), v('sl', 37, 21), v('fp', 4, 19), v('pv', 3, 9)],
      },
      {
        id: 'problemas-no-trabalho',
        label: 'Estou com problemas no trabalho',
        verses: [v('cl', 3, 23), v('ec', 9, 10), v('pv', 16, 3), v('1co', 10, 31), v('cl', 3, 17)],
      },
      {
        id: 'estou-sobrecarregado',
        label: 'Estou sobrecarregado',
        verses: [v('mt', 11, 28), v('gl', 6, 9), v('sl', 55, 22), v('2ts', 3, 13), v('is', 40, 29)],
      },
      {
        id: 'medo-perder-emprego',
        label: 'Tenho medo de perder o emprego',
        verses: [v('mt', 6, 34), v('fp', 4, 6), v('sl', 37, 25), v('dt', 31, 8), v('hb', 13, 5)],
      },
      {
        id: 'preciso-de-provisao',
        label: 'Preciso de provisão',
        verses: [v('fp', 4, 19), v('mt', 6, 33), v('sl', 23, 1), v('ml', 3, 10), v('sl', 34, 10)],
      },
      {
        id: 'paciencia-para-esperar',
        label: 'Preciso ter paciência para esperar',
        verses: [v('is', 40, 31), v('hc', 2, 3), v('rm', 8, 25), v('tg', 5, 7), v('sl', 27, 14)],
      },
    ],
  },
  {
    id: 'spiritual-peace',
    title: 'Paz espiritual',
    accent: '#fde68a',
    accentSoft: 'rgba(253, 230, 138, 0.14)',
    topics: [
      {
        id: 'distante-de-deus',
        label: 'Estou distante de Deus',
        verses: [v('tg', 4, 8), v('is', 55, 6), v('jr', 29, 13), v('sl', 42, 1), v('sl', 63, 1)],
      },
      {
        id: 'fe-enfraquecida',
        label: 'Minha fé está enfraquecida',
        verses: [v('mc', 9, 24), v('hb', 11, 1), v('rm', 10, 17), v('jd', 1, 20), v('lc', 17, 5)],
      },
      {
        id: 'estou-com-duvidas',
        label: 'Estou com dúvidas',
        verses: [v('mc', 9, 24), v('tg', 1, 5), v('jo', 20, 27), v('pv', 3, 5), v('is', 1, 18)],
      },
      {
        id: 'deus-nao-me-ouve',
        label: 'Sinto que Deus não me ouve',
        verses: [v('sl', 34, 15), v('1jo', 5, 14), v('is', 59, 1), v('jr', 33, 3), v('sl', 66, 18)],
      },
      {
        id: 'sentir-presenca-de-deus',
        label: 'Preciso sentir a presença de Deus',
        verses: [v('sl', 16, 11), v('ex', 33, 14), v('mt', 28, 20), v('sl', 139, 7), v('sl', 46, 1)],
      },
      {
        id: 'fortalecer-fe',
        label: 'Quero fortalecer minha fé',
        verses: [v('rm', 10, 17), v('hb', 11, 6), v('jd', 1, 20), v('ef', 6, 16), v('lc', 17, 5)],
      },
      {
        id: 'quero-agradecer',
        label: 'Quero agradecer',
        verses: [v('1ts', 5, 18), v('sl', 100, 4), v('cl', 3, 15), v('fp', 4, 6), v('sl', 107, 1)],
      },
      {
        id: 'paz-em-deus',
        label: 'Quero encontrar paz em Deus',
        verses: [v('jo', 14, 27), v('fp', 4, 7), v('is', 26, 3), v('rm', 5, 1), v('sl', 29, 11)],
      },
    ],
  },
]

const topicIndex = new Map<string, { category: PeaceWordsCategory; topic: PeaceWordsTopic }>()

for (const category of PEACE_WORDS_CATEGORIES) {
  for (const topic of category.topics) {
    topicIndex.set(topic.id, { category, topic })
  }
}

export function getPeaceWordsTopicById(topicId: string) {
  return topicIndex.get(topicId) ?? null
}

export function listPeaceWordsTopics() {
  return PEACE_WORDS_CATEGORIES.flatMap((category) =>
    category.topics.map((topic) => ({ category, topic })),
  )
}
