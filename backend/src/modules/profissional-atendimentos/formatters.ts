import { readEnderecoField } from '../admin-pacientes/formatters.js'
import { calcAgeFromBirthDate } from '../../lib/patientAge.js'
import type {
  ConsultaAnexoRow,
  ConsultaMensagemRow,
  ConsultaOperacionalFullRow,
  ConsultaPrescricaoRow,
  ConsultaSolicitacaoExameRow,
  HistoricoProntuarioRow,
} from './types.js'
import type {
  ProfissionalAttendanceRecordApi,
  ProfissionalConsultaSessaoApi,
  ProfissionalIssuedDocumentApi,
  ProfissionalMensagemApi,
} from './schemas.js'

const ANEXO_SIGNED_URL_TTL_SECONDS = 60 * 60

export { ANEXO_SIGNED_URL_TTL_SECONDS }

export function maskCpfPartial(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`
}

export function mapDbStatusToUiStatus(status: string): 'concluido' | 'interrompido' {
  return status === 'interrompida' ? 'interrompido' : 'concluido'
}

export function mapUiStatusToDbStatus(status: 'concluido' | 'interrompido'): string {
  return status === 'interrompido' ? 'interrompida' : 'concluida'
}

export function mapSexoToGender(sexo: string): 'F' | 'M' {
  return sexo === 'feminino' ? 'F' : 'M'
}

export function resolveRecordSpecialtyKey(specialty: string): string {
  const normalized = specialty
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')

  if (normalized.includes('pediatr')) return 'pediatria'
  if (normalized.includes('nutri')) return 'nutricao'
  if (normalized.includes('psicolog')) return 'psicologia'
  if (normalized.includes('clinic') || normalized.includes('geral')) return 'clinica'
  return 'clinica'
}

export function formatDoctorCrm(row: {
  profissional_conselho_sigla?: string | null
  profissional_conselho_numero?: string | null
  profissional_conselho_uf?: string | null
}): string {
  const sigla = row.profissional_conselho_sigla?.trim()
  const numero = row.profissional_conselho_numero?.trim()
  const uf = row.profissional_conselho_uf?.trim()
  if (!sigla && !numero) return '—'
  const base = [sigla, numero].filter(Boolean).join(' ')
  return uf ? `${base}/${uf}` : base
}

export function formatDateTimeLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const datePart = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  const timePart = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
  return `${datePart} · ${timePart}`
}

export function formatBrazilianDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatMessageTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function formatPatientCity(endereco: Record<string, unknown> | null): string {
  const city = readEnderecoField(endereco, 'cidade')
  const uf = readEnderecoField(endereco, 'uf') || readEnderecoField(endereco, 'estado')
  if (city && uf) return `${city}, ${uf}`
  return city || '—'
}

export function computeDurationMinutes(row: ConsultaOperacionalFullRow): number {
  if (typeof row.duracao_minutos === 'number' && row.duracao_minutos >= 0) {
    return row.duracao_minutos
  }

  const start = row.iniciada_em ?? row.criado_em
  const end = row.finalizada_em
  if (!start || !end) return 0

  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return 0

  return Math.max(1, Math.round((endMs - startMs) / 60_000))
}

export function mapPrescricaoToDocument(row: ConsultaPrescricaoRow): ProfissionalIssuedDocumentApi {
  const signedAt = formatMessageTime(row.criado_em)
  return {
    id: `rx-${row.id}`,
    kind: 'receita',
    title: 'Receita médica',
    meta: row.medicamento_nome,
    fileName: 'receita-medica.pdf',
    signedAtLabel: signedAt,
  }
}

export function mapSolicitacaoExameToDocument(
  row: ConsultaSolicitacaoExameRow,
  examName: string,
): ProfissionalIssuedDocumentApi {
  const signedAt = formatMessageTime(row.criado_em)
  return {
    id: `ex-${row.id}`,
    kind: 'pedido_exame',
    title: 'Pedido de exames',
    meta: examName,
    fileName: 'pedido-exames.pdf',
    signedAtLabel: signedAt,
  }
}

export function mapAnexoToDocument(
  row: ConsultaAnexoRow,
  signedUrl = '',
): ProfissionalIssuedDocumentApi {
  const signedAt = formatMessageTime(row.criado_em)
  const kind = isValidAnexoKind(row.tipo) ? row.tipo : 'orientacao'
  const downloadUrl = signedUrl || row.arquivo_url || undefined
  return {
    id: `anexo-${row.id}`,
    kind,
    title: row.titulo,
    meta: row.arquivo_nome || 'Documento emitido',
    fileName: row.arquivo_nome || `${row.titulo}.pdf`,
    signedAtLabel: signedAt,
    downloadUrl: downloadUrl || undefined,
    codigoVerificacao: row.codigo_verificacao?.trim() || undefined,
  }
}

function isValidAnexoKind(
  value: string,
): value is ProfissionalIssuedDocumentApi['kind'] {
  return [
    'receita',
    'pedido_exame',
    'cardapio',
    'plano_alimentar',
    'orientacao',
    'atestado',
    'encaminhamento',
  ].includes(value)
}

export function mapAnexoToPatientUpload(
  row: ConsultaAnexoRow,
  signedUrl: string,
): ProfissionalAttendanceRecordApi['patientUploads'][number] {
  const lowerName = row.arquivo_nome.toLowerCase()
  const type = lowerName.endsWith('.pdf') ? 'pdf' : 'image'
  return {
    id: row.id,
    type,
    url: signedUrl || row.arquivo_url,
    name: row.arquivo_nome,
  }
}

export function mapMensagemToApi(row: ConsultaMensagemRow): ProfissionalMensagemApi {
  const from =
    row.remetente_tipo === 'profissional'
      ? 'doctor'
      : row.remetente_tipo === 'sistema'
        ? 'system'
        : 'patient'

  if (row.anexo_url?.trim()) {
    return {
      id: row.id,
      from,
      time: formatMessageTime(row.enviada_em),
      text: row.conteudo?.trim() || '',
      attachmentUrl: row.anexo_url,
      attachmentName: row.anexo_nome || 'anexo',
    }
  }

  return {
    id: row.id,
    from,
    time: formatMessageTime(row.enviada_em),
    text: row.conteudo?.trim() || '',
  }
}

export function buildRecordNotes(
  row: ConsultaOperacionalFullRow,
): ProfissionalAttendanceRecordApi['recordNotes'] {
  const note = row.notas_clinicas?.trim()
  if (!note) return []

  const reference = row.finalizada_em ?? row.iniciada_em ?? row.criado_em
  return [
    {
      id: `note-${row.id}`,
      specialty: resolveRecordSpecialtyKey(row.especialidade_nome),
      date: formatBrazilianDate(reference),
      doctorName: row.profissional_nome?.trim() || 'Profissional',
      note,
    },
  ]
}

export function mapHistoricoProntuario(
  rows: HistoricoProntuarioRow[],
): ProfissionalConsultaSessaoApi['historicoProntuario'] {
  return rows
    .filter((row) => row.notas_clinicas?.trim())
    .map((row) => ({
      id: row.id,
      date: formatBrazilianDate(row.finalizada_em ?? new Date().toISOString()),
      doctorName: row.profissional_nome?.trim() || 'Profissional',
      note: row.notas_clinicas.trim(),
      specialty: row.especialidade_nome,
    }))
}

export function mapOperacionalToAttendanceRecord(
  row: ConsultaOperacionalFullRow,
  issuedDocuments: ProfissionalIssuedDocumentApi[],
  patientUploads: ProfissionalAttendanceRecordApi['patientUploads'],
): ProfissionalAttendanceRecordApi {
  const reference = row.finalizada_em ?? row.iniciada_em ?? row.criado_em
  const birthIso = row.paciente_data_nascimento
    ? String(row.paciente_data_nascimento).slice(0, 10)
    : ''

  return {
    id: String(row.id),
    attendanceId: String(row.codigo_atendimento),
    dateTimeIso: reference,
    dateTimeLabel: formatDateTimeLabel(reference),
    patientName: String(row.paciente_nome ?? '—'),
    patientPhotoUrl: row.paciente_foto_url?.trim() || '',
    birthDateIso: birthIso,
    age: calcAgeFromBirthDate(row.paciente_data_nascimento),
    gender: mapSexoToGender(String(row.paciente_sexo ?? '')),
    specialty: String(row.especialidade_nome ?? '—'),
    durationMinutes: computeDurationMinutes(row),
    status: mapDbStatusToUiStatus(String(row.status)),
    triageSummary: row.triagem_resumo?.trim() || undefined,
    recordNotes: buildRecordNotes(row),
    issuedDocuments,
    patientUploads,
  }
}

export function parseIssuedDocumentId(documentId: string): {
  table: 'anexo' | 'prescricao' | 'solicitacao_exame'
  id: string
} | null {
  if (documentId.startsWith('anexo-')) {
    return { table: 'anexo', id: documentId.slice('anexo-'.length) }
  }
  if (documentId.startsWith('rx-')) {
    return { table: 'prescricao', id: documentId.slice('rx-'.length) }
  }
  if (documentId.startsWith('ex-')) {
    return { table: 'solicitacao_exame', id: documentId.slice('ex-'.length) }
  }
  return null
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, '_').slice(0, 180)
}

export function inferAttachmentType(fileName: string): 'pdf' | 'image' {
  return fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'
}

export function mergePatientUploadsFromMensagens(
  uploads: ProfissionalAttendanceRecordApi['patientUploads'],
  mensagens: ProfissionalMensagemApi[],
): ProfissionalAttendanceRecordApi['patientUploads'] {
  const merged = [...uploads]
  const seen = new Set(uploads.map((item) => item.url))

  for (const message of mensagens) {
    if (message.from !== 'patient' || !message.attachmentUrl?.trim()) continue
    const url = message.attachmentUrl.trim()
    if (seen.has(url)) continue
    seen.add(url)
    const name = message.attachmentName?.trim() || 'Anexo do chat'
    merged.push({
      id: `chat-${message.id}`,
      type: inferAttachmentType(name),
      url,
      name,
    })
  }

  return merged
}
