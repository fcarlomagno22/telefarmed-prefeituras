import type { SupportMessageAttachment } from './types.js'

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatSuporteDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return dateTimeFormatter.format(date)
}

export function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop()?.trim() || 'anexo'
  return base.replace(/[^\w.\-()+\s]/g, '_').slice(0, 180) || 'anexo'
}

export function mimeToAnexoTipo(mimeType: string): 'pdf' | 'image' {
  return mimeType === 'application/pdf' ? 'pdf' : 'image'
}

type DbMessageRow = {
  id: string
  autor_tipo: 'operator' | 'support' | 'system'
  autor_nome: string
  corpo: string
  enviado_em: string
  editado_em: string | null
  excluido: boolean
  snapshot_exclusao: {
    body?: string
    editedAt?: string
    attachments?: SupportMessageAttachment[]
  } | null
}

type DbAnexoRow = {
  id: string
  mensagem_id: string | null
  nome_arquivo: string
  tipo: 'pdf' | 'image'
  mime_type: string
  tamanho_bytes: number
  storage_path: string
}

export function mapMessageRow(
  row: DbMessageRow,
  anexos: DbAnexoRow[],
  signedUrls: Map<string, string>,
): {
  id: string
  author: 'operator' | 'support'
  authorName: string
  body: string
  sentAt: string
  editedAt?: string
  deleted?: boolean
  deletedSnapshot?: {
    body: string
    editedAt?: string
    attachments?: SupportMessageAttachment[]
  }
  attachments?: SupportMessageAttachment[]
} {
  const attachments = anexos
    .filter((item) => item.mensagem_id === row.id)
    .map((item) => ({
      id: item.id,
      name: item.nome_arquivo,
      type: item.tipo,
      url: signedUrls.get(item.storage_path) ?? '',
      size: item.tamanho_bytes,
    }))

  const author: 'operator' | 'support' =
    row.autor_tipo === 'support' ? 'support' : 'operator'

  if (row.excluido) {
    const snapshot = row.snapshot_exclusao
    return {
      id: row.id,
      author,
      authorName: row.autor_nome,
      body: '[mensagem removida]',
      sentAt: formatSuporteDateTime(row.enviado_em),
      editedAt: row.editado_em ? formatSuporteDateTime(row.editado_em) : undefined,
      deleted: true,
      deletedSnapshot: snapshot
        ? {
            body: snapshot.body ?? '',
            editedAt: snapshot.editedAt,
            attachments: snapshot.attachments,
          }
        : undefined,
    }
  }

  return {
    id: row.id,
    author,
    authorName: row.autor_nome,
    body: row.corpo,
    sentAt: formatSuporteDateTime(row.enviado_em),
    editedAt: row.editado_em ? formatSuporteDateTime(row.editado_em) : undefined,
    attachments: attachments.length ? attachments : undefined,
  }
}

export function mapTicketListRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    number: String(row.numero_exibicao),
    subject: String(row.assunto),
    status: row.status as string,
    priority: row.prioridade as string,
    lastUpdate: formatSuporteDateTime(String(row.atualizado_em)),
    openedAt: formatSuporteDateTime(String(row.aberto_em)),
    category: String(row.categoria),
    messages: [],
    source: row.origem as 'ubt' | 'prefeitura' | 'profissional',
    municipalityName: String(row.municipio_nome ?? ''),
    ubtId: row.unidade_ubt_id ? String(row.unidade_ubt_id) : undefined,
    ubtName: row.unidade_ubt_nome ? String(row.unidade_ubt_nome) : undefined,
    openedByName: String(row.aberto_por_nome ?? ''),
    openedByRole: String(row.aberto_por_funcao ?? ''),
  }
}

export function mapTicketDetailRow(
  row: Record<string, unknown>,
  messages: ReturnType<typeof mapMessageRow>[],
) {
  return {
    ...mapTicketListRow(row),
    messages,
  }
}
