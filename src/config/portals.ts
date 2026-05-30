import { brand } from './brand'
import { profissionalRoutes } from './profissionalRoutes'
import { ubtRoutes } from './ubtRoutes'

export type PortalId = 'ubt' | 'prefeitura' | 'admin' | 'profissional'

export type PortalConfig = {
  id: PortalId
  loginPath: string
  transitionPath: string
  homePath: string
  welcomeTitle: string
  welcomeSubtitle: string
  transitionTitle: string
  transitionSubtitle: string
  transitionSteps: readonly string[]
}

export const portals: Record<PortalId, PortalConfig> = {
  ubt: {
    id: 'ubt',
    loginPath: ubtRoutes.login,
    transitionPath: ubtRoutes.entrando,
    homePath: ubtRoutes.agenda,
    welcomeTitle: brand.welcomeTitle,
    welcomeSubtitle: brand.welcomeSubtitle,
    transitionTitle: 'Entrando no painel operacional',
    transitionSubtitle:
      'Estamos preparando a sala de triagem da sua unidade. Só um instante.',
    transitionSteps: [
      'Validando credenciais',
      'Conectando à unidade de teleatendimento',
      'Carregando Terminal de triagem',
      'Preparando seu painel',
    ],
  },
  prefeitura: {
    id: 'prefeitura',
    loginPath: '/prefeitura/login',
    transitionPath: '/prefeitura/entrando',
    homePath: '/prefeitura/dashboard',
    welcomeTitle: 'Painel de Gestão Pública',
    welcomeSubtitle: 'Acesse com suas credenciais',
    transitionTitle: 'Entrando no painel municipal',
    transitionSubtitle:
      'Consolidando dados das unidades da rede. Só um instante.',
    transitionSteps: [
      'Validando credenciais',
      'Conectando à rede de UBT',
      'Carregando indicadores municipais',
      'Preparando seu painel',
    ],
  },
  admin: {
    id: 'admin',
    loginPath: '/admin/login',
    transitionPath: '/admin/entrando',
    homePath: '/admin/dashboard',
    welcomeTitle: 'Painel Admin',
    welcomeSubtitle: 'Gestão das prefeituras na plataforma',
    transitionTitle: 'Entrando no painel administrativo',
    transitionSubtitle:
      'Carregando o ambiente de gestão das prefeituras. Só um instante.',
    transitionSteps: [
      'Validando credenciais',
      'Conectando ao painel admin',
      'Carregando prefeituras vinculadas',
      'Preparando seu painel',
    ],
  },
  profissional: {
    id: 'profissional',
    loginPath: profissionalRoutes.login,
    transitionPath: profissionalRoutes.entrando,
    homePath: profissionalRoutes.agenda,
    welcomeTitle: brand.profissionalWelcomeTitle,
    welcomeSubtitle: brand.profissionalWelcomeSubtitle,
    transitionTitle: 'Entrando no painel profissional',
    transitionSubtitle:
      'Carregando sua agenda e fila de atendimento. Só um instante.',
    transitionSteps: [
      'Validando credenciais',
      'Carregando seus plantões designados',
      'Preparando fila de pacientes',
      'Preparando seu painel',
    ],
  },
}

export const rootPath = '/'
