import type { PeaceWordsPhrasesDocument } from '../types/peaceWordsPhrases'

const PHRASE_DOCUMENTS: Record<string, PeaceWordsPhrasesDocument> = {
  frases_estou_ansioso: require('../../assets/biblia/frases_estou_ansioso.json'),
  frases_estou_com_medo: require('../../assets/biblia/frases_estou_com_medo.json'),
  frases_estou_preocupado: require('../../assets/biblia/frases_estou_preocupado.json'),
  frases_estou_em_panico: require('../../assets/biblia/frases_estou_em_panico.json'),
  frases_estou_inseguro: require('../../assets/biblia/frases_estou_inseguro.json'),
  frases_estou_com_a_mente_agitada: require('../../assets/biblia/frases_estou_com_a_mente_agitada.json'),
  frases_nao_consigo_dormir: require('../../assets/biblia/frases_nao_consigo_dormir.json'),
  frases_tenho_medo_do_futuro: require('../../assets/biblia/frases_tenho_medo_do_futuro.json'),
}

export function getPeaceWordsPhrasesDocument(fileKey: string) {
  return PHRASE_DOCUMENTS[fileKey] ?? null
}
