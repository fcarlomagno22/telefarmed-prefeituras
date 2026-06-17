import { MaterialCommunityIcons } from '@expo/vector-icons'
import type { ActionIconPalette } from '../theme/actionIconColors'
import type { SleepSoundId } from '../types/sleepTime'

export type SleepSoundConfig = {
  id: SleepSoundId
  title: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  palette: ActionIconPalette
  explanation: string
  source: number
}

export const SLEEP_SOUNDS: SleepSoundConfig[] = [
  {
    id: 'roof-rain',
    title: 'Chuva no telhado',
    icon: 'home-flood',
    source: require('../../assets/sono/chuva_telhado.mp3'),
    palette: {
      iconGradient: ['#93c5fd', '#3b82f6', '#1d4ed8'],
      shadowColor: 'rgba(59, 130, 246, 0.4)',
    },
    explanation:
      'O som constante e rítmico da chuva no telhado ajuda a reduzir a atividade cerebral, criando um ambiente monótono que facilita o relaxamento e o sono.',
  },
  {
    id: 'distant-rain',
    title: 'Chuva distante',
    icon: 'weather-rainy',
    source: require('../../assets/sono/chuva_distante.mp3'),
    palette: {
      iconGradient: ['#a5b4fc', '#6366f1', '#4338ca'],
      shadowColor: 'rgba(99, 102, 241, 0.4)',
    },
    explanation:
      'O ruído branco da chuva distante mascarar sons externos e cria um ambiente sonoro uniforme que ajuda o cérebro a entrar em estado de relaxamento profundo.',
  },
  {
    id: 'wind',
    title: 'Vento',
    icon: 'weather-windy',
    source: require('../../assets/sono/vento_ar.mp3'),
    palette: {
      iconGradient: ['#bae6fd', '#38bdf8', '#0284c7'],
      shadowColor: 'rgba(56, 189, 248, 0.38)',
    },
    explanation:
      'O som suave e contínuo do vento ajuda a reduzir a ansiedade e a frequência cardíaca, preparando o corpo para o descanso.',
  },
  {
    id: 'distant-sea',
    title: 'Mar distante',
    icon: 'waves',
    source: require('../../assets/sono/mar_distante.mp3'),
    palette: {
      iconGradient: ['#67e8f9', '#06b6d4', '#0891b2'],
      shadowColor: 'rgba(6, 182, 212, 0.38)',
    },
    explanation:
      'O ritmo constante das ondas do mar ativa o sistema nervoso parassimpático, responsável pelo relaxamento, reduzindo o estresse e facilitando o sono.',
  },
  {
    id: 'running-water',
    title: 'Água corrente',
    icon: 'water',
    source: require('../../assets/sono/agua_corrente.mp3'),
    palette: {
      iconGradient: ['#7dd3fc', '#0ea5e9', '#0369a1'],
      shadowColor: 'rgba(14, 165, 233, 0.38)',
    },
    explanation:
      'O som contínuo da água corrente cria um ruído de fundo que bloqueia distrações e ajuda a mente a se desligar, promovendo um sono mais profundo.',
  },
  {
    id: 'campfire',
    title: 'Fogueira leve',
    icon: 'fire',
    source: require('../../assets/sono/fogueira_leve.mp3'),
    palette: {
      iconGradient: ['#fdba74', '#f97316', '#c2410c'],
      shadowColor: 'rgba(249, 115, 22, 0.4)',
    },
    explanation:
      'O crepitar suave da fogueira produz frequências baixas que acalmam o sistema nervoso, reduzindo a ansiedade e preparando o corpo para dormir.',
  },
  {
    id: 'shower',
    title: 'Chuveiro',
    icon: 'shower-head',
    source: require('../../assets/sono/chuveiro.mp3'),
    palette: {
      iconGradient: ['#c4b5fd', '#8b5cf6', '#6d28d9'],
      shadowColor: 'rgba(139, 92, 246, 0.38)',
    },
    explanation:
      'O som constante da água do chuveiro funciona como ruído branco, mascarando sons externos e criando um ambiente sonoro uniforme que facilita o relaxamento.',
  },
  {
    id: 'brown-noise',
    title: 'Brown noise',
    icon: 'waveform',
    source: require('../../assets/sono/brown_noise.mp3'),
    palette: {
      iconGradient: ['#c9a66b', '#8b5e34', '#3d2314'],
      shadowColor: 'rgba(139, 94, 52, 0.45)',
    },
    explanation:
      'O brown noise possui mais energia em frequências baixas, criando um som profundo e envolvente que ajuda a reduzir a atividade mental e promover o sono.',
  },
]

export function getSleepSoundById(id: SleepSoundId): SleepSoundConfig | undefined {
  return SLEEP_SOUNDS.find((sound) => sound.id === id)
}
