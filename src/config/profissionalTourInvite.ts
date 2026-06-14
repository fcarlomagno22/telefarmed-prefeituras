export type ProfissionalTourInviteMeta = {
  areaLabel: string
  title: string
  description: string
  highlights: string[]
}

export const profissionalTourInviteMeta = {
  agenda: {
    areaLabel: 'Agenda',
    title: 'Quer conhecer sua Agenda?',
    description:
      'Preparamos um tour guiado rápido para você ver plantões, calendário e fila de atendimento com tranquilidade.',
    highlights: [
      'Calendário e plantões do dia',
      'Como entrar no turno e atender',
      'Fila de pacientes em tempo real',
    ],
  },
  escala: {
    areaLabel: 'Escala',
    title: 'Quer conhecer a Escala?',
    description:
      'Mostramos em poucos passos como buscar plantões abertos, reservar turnos e acompanhar suas inscrições.',
    highlights: [
      'Filtros por data, cidade e valor',
      'Reserva de plantões disponíveis',
      'Acompanhamento das suas reservas',
    ],
  },
  atendimentos: {
    areaLabel: 'Atendimentos',
    title: 'Quer conhecer Atendimentos?',
    description:
      'O tour explica como revisar consultas realizadas, notas clínicas, documentos e o histórico de cada paciente.',
    highlights: [
      'Lista e filtros de consultas',
      'Detalhes e prontuário resumido',
      'Anexos e evolução do atendimento',
    ],
  },
  avaliacao: {
    areaLabel: 'Avaliação',
    title: 'Quer conhecer Avaliações?',
    description:
      'Veja como acompanhar notas e comentários dos pacientes, críticas e indicadores do seu desempenho.',
    highlights: [
      'Notas e comentários recentes',
      'Aba de críticas e alertas',
      'Gráficos do período',
    ],
  },
  financeiro: {
    areaLabel: 'Financeiro',
    title: 'Quer conhecer o Financeiro?',
    description:
      'Em poucos minutos mostramos competências, valores previstos, fechamento mensal e envio de nota fiscal.',
    highlights: [
      'Plantões por competência',
      'Fechamento e repasse via PIX',
      'Histórico de pagamentos',
    ],
  },
  suporte: {
    areaLabel: 'Suporte',
    title: 'Quer conhecer o Suporte?',
    description:
      'Aprenda a abrir chamados, acompanhar respostas e conversar com a equipe Telefarmed quando precisar de ajuda.',
    highlights: [
      'Abrir chamados por assunto',
      'Acompanhar status e prazos',
      'Histórico de conversas',
    ],
  },
} satisfies Record<string, ProfissionalTourInviteMeta>
