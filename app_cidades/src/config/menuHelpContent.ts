export type MenuHelpTopic = {
  id: string
  question: string
  answer: string
}

export const MENU_HELP_TOPICS: MenuHelpTopic[] = [
  {
    id: 'appointments',
    question: 'Como agendar uma consulta?',
    answer:
      'Na home, toque em "Agendar consulta" ou acesse a aba de consultas. Escolha especialidade, data e horário disponíveis e confirme o agendamento.',
  },
  {
    id: 'metrics',
    question: 'Onde vejo minhas métricas de saúde?',
    answer:
      'Use a aba "Métricas" na barra inferior. Lá você acompanha passos, sono, alimentação e outros indicadores registrados no app.',
  },
  {
    id: 'routine',
    question: 'Como funciona a Minha Rotina?',
    answer:
      'Em "Vida saudável", abra "Minha Rotina" para montar hábitos diários. Marque tarefas concluídas e acompanhe seu progresso ao longo da semana.',
  },
  {
    id: 'mental-health',
    question: 'Como usar Saúde Mental?',
    answer:
      'Acesse Saúde Mental pela home. Faça check-ins, siga atividades sugeridas e, se precisar, use os contatos de emergência disponíveis no app.',
  },
  {
    id: 'run-walk',
    question: 'Como registrar corrida ou caminhada?',
    answer:
      'Abra Corrida e Caminhada, escolha a modalidade e inicie a atividade. O app usa GPS para registrar distância, tempo e velocidade.',
  },
  {
    id: 'account',
    question: 'Como atualizar meus dados?',
    answer:
      'Abra o menu lateral e toque em "Meu perfil" para ver nome, e-mail, telefone e CPF cadastrados. Para alterações, fale com o suporte.',
  },
  {
    id: 'notifications',
    question: 'Como gerenciar notificações?',
    answer:
      'No menu, acesse "Notificações" para ver avisos enviados pela plataforma. Toque para ler, marque como lida ou exclua quando não precisar mais.',
  },
  {
    id: 'support',
    question: 'Preciso de ajuda humana',
    answer:
      'No menu, toque em "Falar com suporte" para WhatsApp, e-mail ou telefone. Para bugs ou sugestões, use "Bug ou sugestão".',
  },
]
