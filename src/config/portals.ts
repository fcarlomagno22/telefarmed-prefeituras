import { brand } from './brand'
import { profissionalRoutes } from './profissionalRoutes'
import { ubtRoutes } from './ubtRoutes'
import { adminRoutes } from './adminRoutes'
import { prefeituraRoutes } from './prefeituraRoutes'
import type { PortalId } from './portalHost'

export type { PortalId }

export type PortalConfig = {
  id: PortalId
  loginPath: string
  transitionPath: string
  homePath: string
  welcomeTitle: string
  welcomeSubtitle: string
  /** Card de login em host dedicado de UBT (whitelabel). */
  tenantWelcomeTitle?: string
  tenantWelcomeSubtitle?: string
  transitionTitle: string
  transitionSubtitle: string
  transitionSteps: readonly string[]
}

export const portals: Record<PortalId, PortalConfig> = {
  ubt: {
    id: 'ubt',
    get loginPath() {
      return ubtRoutes.login
    },
    get transitionPath() {
      return ubtRoutes.entrando
    },
    get homePath() {
      return ubtRoutes.agenda
    },
    welcomeTitle: brand.welcomeTitle,
    welcomeSubtitle: brand.welcomeSubtitle,
    /** Textos fixos no card de login das UBTs whitelabel (host do cliente). */
    tenantWelcomeTitle: 'Unidade de Teleatendimento',
    tenantWelcomeSubtitle: 'Faça o login com suas credenciais',
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
    get loginPath() {
      return prefeituraRoutes.login
    },
    get transitionPath() {
      return prefeituraRoutes.entrando
    },
    get homePath() {
      return prefeituraRoutes.dashboard
    },
    welcomeTitle: 'Painel de Gestão',
    welcomeSubtitle: 'Entre com suas credenciais de Administrador',
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
    get loginPath() {
      return adminRoutes.login
    },
    get transitionPath() {
      return adminRoutes.entrando
    },
    get homePath() {
      return adminRoutes.dashboard
    },
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
    get loginPath() {
      return profissionalRoutes.login
    },
    get transitionPath() {
      return profissionalRoutes.entrando
    },
    get homePath() {
      return profissionalRoutes.agenda
    },
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
