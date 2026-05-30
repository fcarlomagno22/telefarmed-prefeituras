import { profissionalRoutes } from './profissionalRoutes'

/** Rota pública da landing de cadastro de profissionais. */
export const medicoCadastroLandingRoute = profissionalRoutes.cadastro

export const medicoCadastroLandingHeroImageUrl = '/lp_hero.png'

export const medicoCadastroLandingFooterImageUrl = '/lp_footer.png'

export const medicoCadastroLandingLgpdCertUrl = '/lgpd_certificado.png'

export const medicoCadastroLandingStats = [
  {
    icon: 'users' as const,
    value: '+2.000',
    description: 'profissionais ativos em todo o Brasil',
  },
  {
    icon: 'calendar' as const,
    value: '+15.000',
    description: 'plantões realizados com excelência',
  },
  {
    icon: 'smile' as const,
    value: '+1 milhão',
    description: 'de atendimentos realizados',
  },
  {
    icon: 'shield' as const,
    value: '100%',
    description: 'online, seguro e regulamentado',
  },
] as const

export const medicoCadastroLandingSteps = [
  {
    step: 1,
    icon: 'pencil' as const,
    title: 'Cadastro',
    description: 'Preencha seus dados em poucos minutos.',
  },
  {
    step: 2,
    icon: 'file' as const,
    title: 'Validação',
    description: 'Nossa equipe analisa suas informações.',
  },
  {
    step: 3,
    icon: 'calendarCheck' as const,
    title: 'Ativação',
    description: 'Você recebe acesso à plataforma.',
  },
  {
    step: 4,
    icon: 'dollar' as const,
    title: 'Plantões',
    description: 'Escolha os plantões e comece a atender.',
  },
] as const

export const BR_UF_OPTIONS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const
