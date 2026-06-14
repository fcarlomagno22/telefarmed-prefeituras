export const SUPORTE_ANEXOS_BUCKET = 'suporte-anexos'

export const MAX_SUPORTE_ANEXO_BYTES = 10 * 1024 * 1024

export const MAX_SUPORTE_ANEXOS_PER_MESSAGE = 5

export const MAX_SUPORTE_BODY_LENGTH = 2000

export const ALLOWED_SUPORTE_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
])

export const SUPPORT_TICKET_CATEGORIES = [
  'Teleatendimento',
  'Triagem e atendimento',
  'Agenda de consultas',
  'Consultas e histórico',
  'Cadastro de pacientes',
  'Usuários e permissões',
  'Relatórios',
  'Login e acesso',
  'Interface do sistema',
  'Outros',
] as const

export const STATUS_LABELS: Record<string, string> = {
  em_andamento: 'Em andamento',
  aguardando_resposta: 'Aguardando resposta',
  respondido: 'Respondido',
  encerrado: 'Encerrado',
}

export const PRIORITY_LABELS: Record<string, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}
