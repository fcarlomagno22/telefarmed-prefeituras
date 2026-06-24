export type PeaceWordsPhraseVerse = {
  verse: number
  text: string
}

export type PeaceWordsPhrase = {
  id: string
  livro: string
  abreviacao: string
  capitulo: number
  versiculo_inicial: number
  versiculo_final: number
  referencia: string
  texto: string
  versiculos: PeaceWordsPhraseVerse[]
}

export type PeaceWordsPhrasesDocument = {
  nome: string
  total: number
  frases: PeaceWordsPhrase[]
}
