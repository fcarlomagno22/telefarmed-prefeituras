function env(key: string, fallback: string): string {
  const value = import.meta.env[key]
  return typeof value === 'string' && value.trim() !== '' ? value : fallback
}

export const brand = {
  primaryColor: env('VITE_BRAND_COLOR', '#ff6b00'),
  logoUrl: env('VITE_LOGO_URL', '/logo_4.png'),
  backgroundImageUrl: env('VITE_BACKGROUND_IMAGE_URL', '/fundo_login.png'),
  /** Fundo do login das UBTs whitelabel (clientes). Plataforma ubt.telefarmed.com.br mantém `backgroundImageUrl`. */
  ubtClientLoginBackgroundUrl: '/ubt_login_cl.png',
  profissionalBackgroundImageUrl: env(
    'VITE_PROFISSIONAL_BACKGROUND_IMAGE_URL',
    '/login_prof.png',
  ),
  prefeituraBackgroundImageUrl: env(
    'VITE_PREFEITURA_BACKGROUND_IMAGE_URL',
    '/fundo_login_pref.png',
  ),
  adminBackgroundImageUrl: env(
    'VITE_ADMIN_BACKGROUND_IMAGE_URL',
    '/fundo_painel_admin.png',
  ),
  appName: env('VITE_APP_NAME', 'Telefarmed'),
  faviconUrl: env('VITE_FAVICON_URL', '/new_favicon.ico'),
  appTagline: env('VITE_APP_TAGLINE', 'Farmácia e Telemedicina'),
  headline: env(
    'VITE_HEADLINE',
    'Cuidado que te acompanha. Saúde que te conecta.',
  ),
  subheadline: env(
    'VITE_SUBHEADLINE',
    'Gestão inteligente para uma saúde pública mais próxima, humana e eficiente.',
  ),
  welcomeTitle: env(
    'VITE_WELCOME_TITLE',
    'Bem-vindo ao Painel Operacional da Unidade',
  ),
  welcomeSubtitle: env(
    'VITE_WELCOME_SUBTITLE',
    'Acesse com seu usuário para continuar',
  ),
  profissionalHeadline: env(
    'VITE_PROFISSIONAL_HEADLINE',
    'Seu plantão, sua fila, seu atendimento em um só lugar.',
  ),
  profissionalSubheadline: env(
    'VITE_PROFISSIONAL_SUBHEADLINE',
    'Agenda dos dias designados, chamada de pacientes e gestão da sua atuação profissional.',
  ),
  profissionalWelcomeTitle: env(
    'VITE_PROFISSIONAL_WELCOME_TITLE',
    'Painel do Profissional',
  ),
  profissionalWelcomeSubtitle: env(
    'VITE_PROFISSIONAL_WELCOME_SUBTITLE',
    'Acesse com seu CPF e senha cadastrados',
  ),
  profissionalDashboardUserName: env(
    'VITE_PROFISSIONAL_DASHBOARD_USER_NAME',
    'Profissional',
  ),
  profissionalOperatorName: env(
    'VITE_PROFISSIONAL_OPERATOR_NAME',
    'Dra. Ana Martins',
  ),
  profissionalOperatorRole: env(
    'VITE_PROFISSIONAL_OPERATOR_ROLE',
    'Médica · Clínica Médica',
  ),
  profissionalOperatorFooterLabel: env(
    'VITE_PROFISSIONAL_OPERATOR_FOOTER_LABEL',
    'Profissional logado',
  ),
  copyright: env(
    'VITE_COPYRIGHT',
    '© 2026 Telefarmed. Todos os direitos reservados.',
  ),
  dashboardUserName: env('VITE_DASHBOARD_USER_NAME', 'Juliana'),
  operatorName: env('VITE_OPERATOR_NAME', 'Juliana Silva'),
  operatorRole: env(
    'VITE_OPERATOR_ROLE',
    'Funcionário público · responsável pelo Terminal',
  ),
  operatorFooterLabel: env(
    'VITE_OPERATOR_FOOTER_LABEL',
    'Operador logado',
  ),
  prefeituraOperatorName: env(
    'VITE_PREFEITURA_OPERATOR_NAME',
    'Orlando Santos',
  ),
  prefeituraOperatorRole: env(
    'VITE_PREFEITURA_OPERATOR_ROLE',
    'Secretário de Saúde',
  ),
  prefeituraOperatorFooterLabel: env(
    'VITE_PREFEITURA_OPERATOR_FOOTER_LABEL',
    'Operador logado',
  ),
  adminOperatorName: env('VITE_ADMIN_OPERATOR_NAME', 'Equipe Telefarmed'),
  adminOperatorRole: env(
    'VITE_ADMIN_OPERATOR_ROLE',
    'Administrador da plataforma',
  ),
  adminOperatorFooterLabel: env(
    'VITE_ADMIN_OPERATOR_FOOTER_LABEL',
    'Operador logado',
  ),
  dashboardTitle: env(
    'VITE_DASHBOARD_TITLE',
    'Terminal de atendimento da unidade',
  ),
  dashboardSubtitle: env(
    'VITE_DASHBOARD_SUBTITLE',
    'Um paciente por vez neste computador',
  ),
  dashboardStationTitle: env(
    'VITE_DASHBOARD_STATION_TITLE',
    'Atendimento por telemedicina',
  ),
  dashboardStationIdleHint: env(
    'VITE_DASHBOARD_STATION_IDLE_HINT',
    'Chame o próximo paciente. Enquanto houver consulta ativa, este Terminal fica reservado para essa pessoa.',
  ),
  dashboardFlowImageUrl: env('VITE_DASHBOARD_FLOW_IMAGE_URL', '/fluxo.png'),
  dashboardDoctorsImageUrl: env(
    'VITE_DASHBOARD_DOCTORS_IMAGE_URL',
    '/medicos_online.png',
  ),
  dashboardAgeImageUrl: env('VITE_DASHBOARD_AGE_IMAGE_URL', '/age.png'),
  dashboardSpecialtyImageUrl: env(
    'VITE_DASHBOARD_SPECIALTY_IMAGE_URL',
    '/especialidade.png',
  ),
  dashboardWaitingRoomImageUrl: env(
    'VITE_DASHBOARD_WAITING_ROOM_IMAGE_URL',
    '/espera.png',
  ),
  dashboardRegistrationImageUrl: env(
    'VITE_DASHBOARD_REGISTRATION_IMAGE_URL',
    '/cadastro.png',
  ),
  dashboardContactsImageUrl: env(
    'VITE_DASHBOARD_CONTACTS_IMAGE_URL',
    '/contato.png',
  ),
  dashboardAddressImageUrl: env(
    'VITE_DASHBOARD_ADDRESS_IMAGE_URL',
    '/endereco.png',
  ),
  dashboardPhotoImageUrl: env(
    'VITE_DASHBOARD_PHOTO_IMAGE_URL',
    '/selfie.png',
  ),
  dashboardUsersAboutImageUrl: env(
    'VITE_DASHBOARD_USERS_ABOUT_IMAGE_URL',
    '/usuarios.png',
  ),
  dashboardAgendaImageUrl: env('VITE_DASHBOARD_AGENDA_IMAGE_URL', '/agenda.png'),
  dashboardConsultasImageUrl: env(
    'VITE_DASHBOARD_CONSULTAS_IMAGE_URL',
    '/consultas.png',
  ),
  dashboardRelatoriosImageUrl: env(
    'VITE_DASHBOARD_RELATORIOS_IMAGE_URL',
    '/relatorios.png',
  ),
  dashboardSuporteImageUrl: env('VITE_DASHBOARD_SUPORTE_IMAGE_URL', '/suporte.png'),
  dashboardCredentialsImageUrl: env(
    'VITE_DASHBOARD_CREDENTIALS_IMAGE_URL',
    '/acessos.png',
  ),
  dashboardPromoImageUrl: env('VITE_DASHBOARD_PROMO_IMAGE_URL', ''),
  dashboardPromoText: env(
    'VITE_DASHBOARD_PROMO_TEXT',
    'Telemedicina que conecta, cuidado que transforma. Atendimento humanizado e tecnologia a serviço da vida.',
  ),
  waitingRoomTagline: env(
    'VITE_WAITING_ROOM_TAGLINE',
    'CUIDANDO DE VOCÊ, ONDE VOCÊ ESTIVER.',
  ),
  waitingRoomVideoPosterUrl: env(
    'VITE_WAITING_ROOM_VIDEO_POSTER_URL',
    '/medicos_online.png',
  ),
  waitingRoomVideoUrl: env('VITE_WAITING_ROOM_VIDEO_URL', ''),
} as const

export const features = [
  {
    icon: 'users' as const,
    text: 'Atendimento humanizado com escuta e acolhimento',
  },
  {
    icon: 'monitor' as const,
    text: 'Tecnologia a serviço da saúde e da gestão pública',
  },
  {
    icon: 'clock' as const,
    text: 'Mais agilidade, mais acesso, mais cuidado para todos',
  },
  {
    icon: 'network' as const,
    text: 'Saúde pública conectada com você e com a comunidade',
  },
]

export const profissionalFeatures = [
  {
    icon: 'calendar' as const,
    text: 'Agenda e fila dos plantões em que você está designado',
  },
  {
    icon: 'stethoscope' as const,
    text: 'Teleconsulta com prontuário, receitas e pedidos de exame',
  },
  {
    icon: 'clipboard' as const,
    text: 'Atendimentos realizados e documentos emitidos por você',
  },
  {
    icon: 'receipt' as const,
    text: 'Recebimentos, notas fiscais e contrato de prestação',
  },
]

export function buildEntityCopyright(entityName: string): string {
  const year = new Date().getFullYear()
  const name = entityName.trim() || brand.appName
  return `© ${year} ${name}. Todos os direitos reservados.`
}
