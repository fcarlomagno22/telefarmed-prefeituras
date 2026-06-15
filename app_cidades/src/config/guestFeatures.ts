export type GuestFeatureKey =
  | 'quick:schedule'
  | 'quick:nearby-units'
  | 'quick:post-consultation'
  | 'quick:prescriptions'
  | 'quick:my-appointments'
  | 'vida:my-metrics'
  | 'vida:run-walk'
  | 'vida:functional-training'
  | 'vida:eat-well'
  | 'vida:sleep-time'
  | 'vida:mental-health'
  | 'vida:active-mind'
  | 'vida:my-goals'
  | 'vida:my-routine'
  | 'tab:menu'
  | 'tab:my-metrics'
  | 'tab:home'
  | 'tab:agendar'
  | 'tab:pos-consulta'
  | 'promo:carousel'

export type GuestFeatureContent = {
  title: string
  description: string
  icon: string
}

const FEATURES: Record<GuestFeatureKey, GuestFeatureContent> = {
  'quick:schedule': {
    title: 'Agendar Consulta',
    description:
      'Marque consultas médicas pelo app, escolha horário e unidade sem filas. Disponível para moradores de cidades atendidas pelo Telefarmed Prefeituras.',
    icon: 'calendar-clock',
  },
  'quick:nearby-units': {
    title: 'Unidades Próximas',
    description:
      'Encontre UBS, hospitais e postos de saúde perto de você, com endereço, horários e rotas. Cadastre-se para acessar.',
    icon: 'map-marker-radius',
  },
  'quick:post-consultation': {
    title: 'Pós-consulta',
    description:
      'Acompanhe seus check-ins de 14 dias após a consulta, responda pelo app e veja sua evolução.',
    icon: 'clipboard-pulse-outline',
  },
  'quick:prescriptions': {
    title: 'Atestados e +',
    description:
      'Consulte receitas digitais, renovações e documentos de saúde com praticidade e segurança.',
    icon: 'pill',
  },
  'quick:my-appointments': {
    title: 'Minhas Consultas',
    description:
      'Veja consultas agendadas, histórico e lembretes personalizados. Entre na sua conta para desbloquear.',
    icon: 'stethoscope',
  },
  'vida:my-metrics': {
    title: 'Minhas Métricas',
    description:
      'Monitore peso, pressão, sono e outros indicadores ao longo do tempo com gráficos claros e metas personalizadas.',
    icon: 'ruler',
  },
  'vida:run-walk': {
    title: 'Corrida e Caminhada',
    description:
      'Registre atividades, acompanhe distância e calorias, e mantenha sua rotina de movimento ativa.',
    icon: 'run-fast',
  },
  'vida:functional-training': {
    title: 'Treino Funcional',
    description:
      'Exercícios de força, mobilidade e condicionamento com rotinas guiadas para fortalecer o corpo no dia a dia.',
    icon: 'kettlebell',
  },
  'vida:eat-well': {
    title: 'Comer Bem',
    description:
      'Dicas de alimentação saudável, planos simples e acompanhamento para cuidar do corpo no dia a dia.',
    icon: 'food-apple-outline',
  },
  'vida:sleep-time': {
    title: 'Hora de dormir',
    description:
      'Melhore a qualidade do sono com lembretes, metas de descanso e insights sobre seus hábitos noturnos.',
    icon: 'sleep',
  },
  'vida:mental-health': {
    title: 'Saúde Mental',
    description:
      'Conteúdos e ferramentas para equilíbrio emocional, autocuidado e bem-estar psicológico.',
    icon: 'brain',
  },
  'vida:active-mind': {
    title: 'Ativa Mente',
    description:
      'Exercícios cognitivos leves para manter a mente ativa, focada e saudável ao longo da semana.',
    icon: 'puzzle',
  },
  'vida:my-goals': {
    title: 'Meus objetivos',
    description:
      'Defina metas de saúde, acompanhe progresso e celebre conquistas com o apoio do Telefarmed.',
    icon: 'target',
  },
  'vida:my-routine': {
    title: 'Minha Rotina',
    description:
      'Organize hábitos diários — medicamentos, exercícios e consultas — em uma rotina que funciona para você.',
    icon: 'calendar-sync-outline',
  },
  'tab:menu': {
    title: 'Menu',
    description:
      'Acesse perfil, configurações, documentos e atalhos extras do app. Disponível após entrar na sua conta.',
    icon: 'menu',
  },
  'tab:my-metrics': {
    title: 'Minhas métricas',
    description:
      'Acompanhe peso, pressão, glicose, hidratação e outros indicadores de saúde em um só lugar.',
    icon: 'ruler',
  },
  'tab:home': {
    title: 'Home',
    description:
      'Sua central de saúde digital: atalhos, novidades e acompanhamento personalizado na sua prefeitura parceira.',
    icon: 'home',
  },
  'tab:agendar': {
    title: 'Agendar consulta',
    description:
      'Agende consultas médicas de forma rápida, escolha especialidade e unidade mais conveniente para você.',
    icon: 'calendar',
  },
  'tab:pos-consulta': {
    title: 'Pós-consulta',
    description:
      'Receba 7 check-ins em 14 dias após cada consulta realizada. Responda pelo app e acompanhe sua evolução.',
    icon: 'clipboard-text-outline',
  },
  'promo:carousel': {
    title: 'Novidades e campanhas',
    description:
      'Fique por dentro de ações de saúde, campanhas de vacinação e benefícios exclusivos nas cidades atendidas pelo Telefarmed.',
    icon: 'image-multiple',
  },
}

export function getGuestFeatureContent(key: GuestFeatureKey): GuestFeatureContent {
  return FEATURES[key]
}

export type GuestWelcomeMessage = {
  headline: string
  body: string
}

export function getGuestWelcomeMessages(): GuestWelcomeMessage[] {
  return [
    {
      headline: 'Saúde digital na palma da mão',
      body: 'O Telefarmed Prefeituras conecta você à rede de saúde da sua cidade, sem filas e com praticidade.',
    },
    {
      headline: 'Consultas, receitas e acompanhamento',
      body: 'Agende atendimentos, acesse documentos e cuide da sua saúde em um só app.',
    },
    {
      headline: 'Para cidades atendidas pelo Telefarmed',
      body: 'Benefícios exclusivos da parceria entre prefeituras parceiras e o Telefarmed para você e sua família.',
    },
    {
      headline: 'Seu bem-estar, todos os dias',
      body: 'Métricas, hábitos saudáveis e orientações personalizadas — entre ou cadastre-se para começar.',
    },
    {
      headline: 'Mais cuidado, menos burocracia',
      body: 'Tudo organizado: consultas, pós-atendimento, receitas e rotina de saúde em um lugar só.',
    },
  ]
}
