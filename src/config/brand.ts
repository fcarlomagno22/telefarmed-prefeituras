function env(key: string, fallback: string): string {
  const value = import.meta.env[key]
  return typeof value === 'string' && value.trim() !== '' ? value : fallback
}

export const brand = {
  primaryColor: env('VITE_BRAND_COLOR', '#ff6b00'),
  logoUrl: env('VITE_LOGO_URL', '/logo_4.png'),
  backgroundImageUrl: env('VITE_BACKGROUND_IMAGE_URL', '/fundo_login.png'),
  appName: env('VITE_APP_NAME', 'Telefarmed'),
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
  copyright: env(
    'VITE_COPYRIGHT',
    '© 2026 Telefarmed. Todos os direitos reservados.',
  ),
  dashboardUserName: env('VITE_DASHBOARD_USER_NAME', 'Juliana'),
  operatorName: env('VITE_OPERATOR_NAME', 'Juliana Silva'),
  operatorRole: env(
    'VITE_OPERATOR_ROLE',
    'Funcionário público · responsável pelo posto',
  ),
  operatorFooterLabel: env(
    'VITE_OPERATOR_FOOTER_LABEL',
    'Operador logado',
  ),
  dashboardTitle: env(
    'VITE_DASHBOARD_TITLE',
    'Posto de atendimento da unidade',
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
    'Chame o próximo paciente. Enquanto houver consulta ativa, este posto fica reservado para essa pessoa.',
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
  dashboardPromoImageUrl: env('VITE_DASHBOARD_PROMO_IMAGE_URL', ''),
  dashboardPromoText: env(
    'VITE_DASHBOARD_PROMO_TEXT',
    'Telemedicina que conecta, cuidado que transforma. Atendimento humanizado e tecnologia a serviço da vida.',
  ),
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
