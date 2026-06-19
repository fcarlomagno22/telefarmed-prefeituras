import type { ConsultationChatMessage } from '../../../components/attendance/consultationChatTypes'
import type { ConsultationDocumentItem } from '../../../components/attendance/ConsultationDocumentsPanel'
import type { DoctorRecordNote } from '../../../components/attendance/doctor/doctorRecordTypes'
import type { AttendanceSession } from '../../../data/attendanceSession'
import type { ExamCatalogItem } from '../../../data/doctorExamRequestMock'
import type {
  ProfissionalAttendanceRecord,
  ProfissionalAtendimentosFilters,
} from '../../../types/profissionalAtendimentos'
import type { AtestadoPdfData } from '../../../types/clinicalDocument'
import { apiFetch, ApiError } from '../http'
import type { ConsultaVideoTokenResponse } from '../consultaVideoToken'

export type { ConsultaVideoTokenResponse } from '../consultaVideoToken'

export class ProfissionalAtendimentosApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'ProfissionalAtendimentosApiError'
  }
}

export type ProfissionalFilaAtivaItemApi = {
  consultaId: string
  codigoAtendimento: string
  agendaConsultaId: string | null
  patientName: string
  patientAge: number
  patientCpf: string
  specialty: string
  ubtName: string
  triageReason: string
  status: string
  inWaitingRoom: boolean
  patientInConsultationRoom: boolean
  startedAtIso: string
}

export type ProfissionalConsultaSessao = {
  consultaId: string
  codigoAtendimento: string
  status: string
  patientName: string
  patientBirthDateIso: string
  patientAddress: string
  patientCity: string
  patientCpfMasked: string
  patientPhotoUrl: string
  patientAge: number
  patientGender: 'F' | 'M'
  specialty: string
  unitName: string
  doctorName: string
  doctorSpecialty: string
  doctorCrm: string
  doctorPhotoUrl: string
  startedAtIso: string
  triageSummary: string
  notasClinicas: string
  historicoProntuario: Array<{
    id: string
    date: string
    doctorName: string
    note: string
    specialty: string
  }>
  mensagens: Array<{
    id: string
    from: 'doctor' | 'patient' | 'system'
    time: string
    text: string
    attachmentUrl?: string
    attachmentName?: string
  }>
  issuedDocuments: Array<{
    id: string
    kind: string
    title: string
    meta: string
    fileName: string
    signedAtLabel?: string
    downloadUrl?: string
    codigoVerificacao?: string
  }>
  patientUploads: Array<{ id: string; name: string; url: string; mimeType: string }>
}

function mapApiError(error: unknown, fallbackMessage: string): ProfissionalAtendimentosApiError {
  if (error instanceof ApiError) {
    return new ProfissionalAtendimentosApiError(error.message, error.status, error.code)
  }
  return new ProfissionalAtendimentosApiError(fallbackMessage, 0)
}

export function isProfissionalAtendimentosApiError(
  error: unknown,
): error is ProfissionalAtendimentosApiError {
  return error instanceof ProfissionalAtendimentosApiError
}

export async function fetchProfissionalFilaAtiva(
  accessToken: string,
): Promise<ProfissionalFilaAtivaItemApi[]> {
  try {
    const data = await apiFetch<{ fila: ProfissionalFilaAtivaItemApi[] }>(
      '/profissional/atendimentos/fila-ativa',
      { accessToken },
    )
    return data.fila
  } catch (error) {
    throw mapApiError(error, 'Não foi possível carregar a fila ativa.')
  }
}

export async function iniciarProfissionalConsultaFromQueue(
  accessToken: string,
  body: {
    agendaConsultaId?: string | null
    consultaId?: string
    plantaoId?: string
  },
): Promise<{ consultaId: string; codigoAtendimento: string; status: string }> {
  try {
    return await apiFetch<{ consultaId: string; codigoAtendimento: string; status: string }>(
      '/profissional/atendimentos/iniciar',
      {
        method: 'POST',
        accessToken,
        json: {
          ...(body.agendaConsultaId ? { agendaConsultaId: body.agendaConsultaId } : {}),
          ...(body.consultaId ? { consultaId: body.consultaId } : {}),
          ...(body.plantaoId ? { plantaoId: body.plantaoId } : {}),
        },
      },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível iniciar o atendimento.')
  }
}

export async function fetchProfissionalAtendimentosList(
  accessToken: string,
  filters: ProfissionalAtendimentosFilters,
  page: number,
  pageSize: number,
) {
  try {
    const params = new URLSearchParams({
      generalSearch: filters.generalSearch,
      specialty: filters.specialty,
      status: filters.status,
      periodStart: filters.periodStart,
      periodEnd: filters.periodEnd,
      page: String(page),
      pageSize: String(pageSize),
    })

    return await apiFetch<{
      records: ProfissionalAttendanceRecord[]
      pagination: {
        page: number
        pageSize: number
        total: number
        totalPages: number
      }
    }>(`/profissional/atendimentos?${params.toString()}`, { accessToken })
  } catch (error) {
    throw mapApiError(error, 'Não foi possível carregar os atendimentos.')
  }
}

export async function fetchProfissionalAtendimentoDetail(accessToken: string, id: string) {
  try {
    const data = await apiFetch<{
      record: ProfissionalAttendanceRecord
      mensagens: Array<{
        id: string
        from: 'doctor' | 'patient' | 'system'
        time: string
        text: string
        attachmentUrl?: string
        attachmentName?: string
      }>
      historicoProntuario: ProfissionalConsultaSessao['historicoProntuario']
    }>(`/profissional/atendimentos/${id}`, { accessToken })
    return data
  } catch (error) {
    throw mapApiError(error, 'Atendimento não encontrado.')
  }
}

export async function fetchProfissionalConsultaSessao(
  accessToken: string,
  codigo: string,
): Promise<ProfissionalConsultaSessao> {
  try {
    const data = await apiFetch<{ sessao: ProfissionalConsultaSessao }>(
      `/profissional/atendimentos/sessao/${encodeURIComponent(codigo)}`,
      { accessToken },
    )
    return data.sessao
  } catch (error) {
    throw mapApiError(error, 'Não foi possível carregar o atendimento.')
  }
}

export async function iniciarProfissionalConsultaPorCodigo(
  accessToken: string,
  codigo: string,
): Promise<ProfissionalConsultaSessao> {
  try {
    const data = await apiFetch<{ sessao: ProfissionalConsultaSessao }>(
      `/profissional/atendimentos/sessao/${encodeURIComponent(codigo)}/iniciar`,
      { method: 'POST', accessToken },
    )
    return data.sessao
  } catch (error) {
    throw mapApiError(error, 'Não foi possível iniciar o atendimento.')
  }
}

export async function fetchProfissionalConsultaVideoToken(
  accessToken: string,
  codigo: string,
): Promise<ConsultaVideoTokenResponse> {
  try {
    return await apiFetch<ConsultaVideoTokenResponse>(
      `/profissional/atendimentos/${encodeURIComponent(codigo)}/video-token`,
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível conectar à teleconsulta.')
  }
}

export async function enviarProfissionalMensagem(
  accessToken: string,
  consultaId: string,
  conteudo: string,
): Promise<void> {
  try {
    await apiFetch(`/profissional/atendimentos/${consultaId}/mensagens`, {
      method: 'POST',
      accessToken,
      json: { conteudo },
    })
  } catch (error) {
    throw mapApiError(error, 'Não foi possível enviar a mensagem.')
  }
}

export async function fetchProfissionalMensagens(
  accessToken: string,
  consultaId: string,
): Promise<ProfissionalConsultaSessao['mensagens']> {
  try {
    const data = await apiFetch<{ mensagens: ProfissionalConsultaSessao['mensagens'] }>(
      `/profissional/atendimentos/${consultaId}/mensagens`,
      { accessToken },
    )
    return data.mensagens
  } catch (error) {
    throw mapApiError(error, 'Não foi possível carregar as mensagens.')
  }
}

export async function uploadProfissionalMensagemAnexo(
  accessToken: string,
  consultaId: string,
  file: File,
  conteudo?: string,
): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  if (conteudo?.trim()) {
    form.append('conteudo', conteudo.trim())
  }

  try {
    await apiFetch(`/profissional/atendimentos/${consultaId}/mensagens/upload`, {
      method: 'POST',
      accessToken,
      body: form,
    })
  } catch (error) {
    throw mapApiError(error, 'Não foi possível enviar o anexo.')
  }
}

export async function salvarProfissionalNotaProntuario(
  accessToken: string,
  consultaId: string,
  nota: string,
) {
  try {
    return await apiFetch<{ notasClinicas: string }>(
      `/profissional/atendimentos/${consultaId}/notas`,
      {
        method: 'PATCH',
        accessToken,
        json: { nota },
      },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível salvar a anotação.')
  }
}

export async function emitirProfissionalReceita(
  accessToken: string,
  consultaId: string,
  body: {
    medicamentos: Array<{
      medicamentoNome: string
      dosagem?: string
      via?: string
      frequencia?: string
      duracao?: string
      observacoes?: string
    }>
    observacoesGerais?: string
  },
) {
  try {
    return await apiFetch<{ documento: ProfissionalConsultaSessao['issuedDocuments'][number] }>(
      `/profissional/atendimentos/${consultaId}/prescricoes/emitir`,
      { method: 'POST', accessToken, json: body },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível emitir a receita.')
  }
}

export async function emitirProfissionalPedidoExame(
  accessToken: string,
  consultaId: string,
  body: {
    exames: Array<{ exameId?: string; name: string; observacoes?: string }>
    indicacaoClinica?: string
    urgent?: boolean
  },
) {
  try {
    return await apiFetch<{ documento: ProfissionalConsultaSessao['issuedDocuments'][number] }>(
      `/profissional/atendimentos/${consultaId}/solicitacoes-exame/emitir`,
      { method: 'POST', accessToken, json: body },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível emitir o pedido de exame.')
  }
}

export async function emitirProfissionalAtestado(
  accessToken: string,
  consultaId: string,
  body: AtestadoPdfData,
) {
  try {
    return await apiFetch<{ documento: ProfissionalConsultaSessao['issuedDocuments'][number] }>(
      `/profissional/atendimentos/${consultaId}/atestados/emitir`,
      { method: 'POST', accessToken, json: body },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível emitir o atestado.')
  }
}

export async function emitirProfissionalEncaminhamento(
  accessToken: string,
  consultaId: string,
  body: {
    specialtyLabel: string
    tipoSolicitacao:
      | 'consulta_especializada'
      | 'retorno'
      | 'procedimento'
      | 'avaliacao_cirurgica'
      | 'segunda_opiniao'
    prioridade: 'eletivo' | 'prioritario' | 'urgente'
    motivoEncaminhamento: string
    historiaClinica: string
    exameFisico: string
    hipoteseDiagnostica: string
    cid?: string
    cidDescricao?: string
    tratamentosEMedicacoes: string
    examesRealizados?: string
    observacoes?: string
  },
) {
  try {
    return await apiFetch<{ documento: ProfissionalConsultaSessao['issuedDocuments'][number] }>(
      `/profissional/atendimentos/${consultaId}/encaminhamentos/emitir`,
      { method: 'POST', accessToken, json: body },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível emitir o encaminhamento.')
  }
}

export async function emitirProfissionalRelatorio(
  accessToken: string,
  consultaId: string,
  body: {
    finalidade:
      | 'referencia'
      | 'resumo_atendimento'
      | 'contrarreferencia'
      | 'parecer'
      | 'administrativo'
    destinatario?: string
    motivoRelatorio: string
    queixaPrincipal: string
    historiaDoencaAtual: string
    antecedentesRelevantes?: string
    medicacoesEmUso?: string
    exameFisico: string
    examesComplementares?: string
    hipoteseDiagnostica: string
    cid?: string
    cidDescricao?: string
    condutaAdotada: string
    tratamentoEOrientacoes?: string
    evolucaoPrognostico?: string
    conclusaoParecer: string
    recomendacoes?: string
    observacoes?: string
  },
) {
  try {
    return await apiFetch<{ documento: ProfissionalConsultaSessao['issuedDocuments'][number] }>(
      `/profissional/atendimentos/${consultaId}/relatorios/emitir`,
      { method: 'POST', accessToken, json: body },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível emitir o relatório médico.')
  }
}

export async function emitirProfissionalLaudo(
  accessToken: string,
  consultaId: string,
  body: {
    tipoLaudo:
      | 'exame_complementar'
      | 'condicao_clinica'
      | 'procedimento'
      | 'aptidao_inaptidao'
      | 'pericia_administrativa'
    destinatario?: string
    objetoLaudo: string
    solicitacaoOrigem?: string
    descricaoAchados: string
    correlacaoClinica: string
    discussaoInterpretacao?: string
    conclusaoLaudo: string
    cid?: string
    cidDescricao?: string
    recomendacoes?: string
    limitacoesExame?: string
    observacoes?: string
  },
) {
  try {
    return await apiFetch<{ documento: ProfissionalConsultaSessao['issuedDocuments'][number] }>(
      `/profissional/atendimentos/${consultaId}/laudos/emitir`,
      { method: 'POST', accessToken, json: body },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível emitir o laudo médico.')
  }
}

export async function emitirProfissionalAvaliacaoPresencial(
  accessToken: string,
  consultaId: string,
  body: {
    tipoAvaliacao:
      | 'retorno_presencial'
      | 'avaliacao_especializada'
      | 'reavaliacao_clinica'
      | 'procedimento_presencial'
      | 'urgencia_presencial'
    prioridade: 'eletivo' | 'prioritario' | 'urgente'
    servicoDestino: string
    motivoAvaliacao: string
    justificativaPresencial: string
    historiaClinica: string
    exameFisicoRemoto: string
    hipoteseDiagnostica: string
    cid?: string
    cidDescricao?: string
    examesRealizados?: string
    condutaAdotada?: string
    expectativaAvaliacao: string
    observacoes?: string
  },
) {
  try {
    return await apiFetch<{ documento: ProfissionalConsultaSessao['issuedDocuments'][number] }>(
      `/profissional/atendimentos/${consultaId}/avaliacoes-presenciais/emitir`,
      { method: 'POST', accessToken, json: body },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível emitir a avaliação presencial.')
  }
}

export async function emitirProfissionalInternacao(
  accessToken: string,
  consultaId: string,
  body: {
    tipoInternacao:
      | 'clinica'
      | 'cirurgica'
      | 'obstetrica'
      | 'pediatrica'
      | 'psiquiatrica'
      | 'uti'
    caraterInternacao: 'eletiva' | 'urgencia' | 'emergencia'
    unidadeDestino: string
    motivoInternacao: string
    justificativaClinica: string
    historiaClinica: string
    exameFisico: string
    hipoteseDiagnostica: string
    cid?: string
    cidDescricao?: string
    examesComplementares?: string
    tratamentosEMedicacoes: string
    condutaAdotada?: string
    procedimentoPrincipalPrevisto?: string
    tempoEstimadoInternacao?: string
    observacoes?: string
  },
) {
  try {
    return await apiFetch<{ documento: ProfissionalConsultaSessao['issuedDocuments'][number] }>(
      `/profissional/atendimentos/${consultaId}/internacoes/emitir`,
      { method: 'POST', accessToken, json: body },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível emitir a solicitação de internação.')
  }
}

export async function fetchProfissionalDocumentoDownloadUrl(
  accessToken: string,
  consultaId: string,
  documentId: string,
) {
  try {
    const data = await apiFetch<{ url: string }>(
      `/profissional/atendimentos/${consultaId}/documentos/${encodeURIComponent(documentId)}/download`,
      { accessToken },
    )
    return data.url
  } catch (error) {
    throw mapApiError(error, 'Não foi possível baixar o documento.')
  }
}

export async function registrarProfissionalPrescricao(
  accessToken: string,
  consultaId: string,
  body: {
    medicamentoNome: string
    dosagem?: string
    via?: string
    frequencia?: string
    duracao?: string
    observacoes?: string
  },
): Promise<void> {
  try {
    await apiFetch(`/profissional/atendimentos/${consultaId}/prescricoes`, {
      method: 'POST',
      accessToken,
      json: body,
    })
  } catch (error) {
    throw mapApiError(error, 'Não foi possível registrar a prescrição.')
  }
}

export async function registrarProfissionalSolicitacaoExame(
  accessToken: string,
  consultaId: string,
  exameId: string,
  observacoes?: string,
): Promise<void> {
  try {
    await apiFetch(`/profissional/atendimentos/${consultaId}/solicitacoes-exame`, {
      method: 'POST',
      accessToken,
      json: { exameId, observacoes },
    })
  } catch (error) {
    throw mapApiError(error, 'Não foi possível registrar o pedido de exame.')
  }
}

export async function registrarProfissionalAnexoDocumento(
  accessToken: string,
  consultaId: string,
  body: { tipo: string; titulo: string; arquivoNome?: string },
) {
  try {
    return await apiFetch<{ documento: ProfissionalConsultaSessao['issuedDocuments'][number] }>(
      `/profissional/atendimentos/${consultaId}/anexos`,
      {
        method: 'POST',
        accessToken,
        json: body,
      },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível registrar o documento.')
  }
}

export async function uploadProfissionalAnexo(
  accessToken: string,
  consultaId: string,
  file: File,
  meta?: { titulo?: string; tipo?: string },
) {
  const form = new FormData()
  form.append('file', file)
  if (meta?.titulo?.trim()) {
    form.append('titulo', meta.titulo.trim())
  }
  if (meta?.tipo?.trim()) {
    form.append('tipo', meta.tipo.trim())
  }

  try {
    const data = await apiFetch<{ anexo: { id: string; name: string; url: string; mimeType: string } }>(
      `/profissional/atendimentos/${consultaId}/anexos/upload`,
      {
        method: 'POST',
        accessToken,
        body: form,
      },
    )
    return data.anexo
  } catch (error) {
    throw mapApiError(error, 'Não foi possível enviar o anexo.')
  }
}

export async function removerProfissionalAnexo(
  accessToken: string,
  consultaId: string,
  anexoId: string,
): Promise<void> {
  try {
    await apiFetch(`/profissional/atendimentos/${consultaId}/anexos/${encodeURIComponent(anexoId)}`, {
      method: 'DELETE',
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error, 'Não foi possível remover o documento.')
  }
}

export async function finalizarProfissionalAtendimento(
  accessToken: string,
  consultaId: string,
  body: { notasClinicas?: string; interrompido?: boolean },
): Promise<void> {
  try {
    await apiFetch(`/profissional/atendimentos/${consultaId}/finalizar`, {
      method: 'POST',
      accessToken,
      json: body,
    })
  } catch (error) {
    throw mapApiError(error, 'Não foi possível finalizar a consulta.')
  }
}

export async function fetchPublicExamCatalog(accessToken: string): Promise<ExamCatalogItem[]> {
  try {
    const data = await apiFetch<{ catalog: ExamCatalogItem[] }>(
      '/profissional/atendimentos/catalogo/exames',
      { accessToken },
    )
    return data.catalog
  } catch (error) {
    throw mapApiError(error, 'Não foi possível carregar o catálogo de exames.')
  }
}

const DEFAULT_DOCTOR_PHOTO =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80'
const DEFAULT_PATIENT_PHOTO =
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80'

export function mapProfissionalSessaoToAttendanceSession(
  sessao: ProfissionalConsultaSessao,
): AttendanceSession {
  return {
    id: sessao.codigoAtendimento,
    patientName: sessao.patientName,
    patientBirthDateIso: sessao.patientBirthDateIso,
    patientAddress: sessao.patientAddress || sessao.patientCity,
    patientCity: sessao.patientCity,
    patientCpfMasked: sessao.patientCpfMasked,
    patientPhotoUrl: sessao.patientPhotoUrl || DEFAULT_PATIENT_PHOTO,
    doctorName: sessao.doctorName,
    doctorSpecialty: sessao.doctorSpecialty,
    doctorCrm: sessao.doctorCrm,
    doctorPhotoUrl: sessao.doctorPhotoUrl || DEFAULT_DOCTOR_PHOTO,
    doctorVideoPosterUrl: sessao.doctorPhotoUrl || DEFAULT_DOCTOR_PHOTO,
    unitName: sessao.unitName,
    insuranceLabel: 'SUS - Público',
    appointmentDateLabel: new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(sessao.startedAtIso)),
    appointmentTimeLabel: new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(sessao.startedAtIso)),
    startedAtIso: sessao.startedAtIso,
    quickNotes: sessao.triageSummary,
    specialty: sessao.specialty,
    consultationDocuments: sessao.issuedDocuments.map(mapIssuedDocument),
  }
}

export function mapIssuedDocument(
  doc: ProfissionalConsultaSessao['issuedDocuments'][number],
): ConsultationDocumentItem {
  const isPrescription = doc.kind === 'receita'
  const isExam = doc.kind === 'pedido_exame'
  const isAtestado = doc.kind === 'atestado'
  const signedPrefix = isPrescription ? 'Assinada' : 'Assinado'
  const meta =
    doc.signedAtLabel && doc.downloadUrl
      ? `PDF • ${signedPrefix} às ${doc.signedAtLabel}`
      : doc.meta || 'Documento emitido'

  return {
    id: doc.id,
    title: doc.title,
    meta,
    downloadUrl: doc.downloadUrl,
    downloadLabel: isPrescription
      ? 'Baixar receita médica'
      : isExam
        ? 'Baixar pedido de exames'
        : isAtestado
          ? 'Baixar atestado médico'
          : 'Baixar documento',
    iconClass: isPrescription
      ? 'bg-red-50 text-red-500'
      : isExam
        ? 'bg-sky-50 text-sky-600'
        : isAtestado
          ? 'bg-amber-50 text-amber-600'
          : 'bg-gray-50 text-gray-500',
  }
}

export function mapProfissionalMensagensToChat(
  messages: Array<{
    id: string
    from: 'doctor' | 'patient' | 'system'
    time: string
    text: string
    attachmentUrl?: string
    attachmentName?: string
  }>,
): ConsultationChatMessage[] {
  return messages
    .filter((message) => message.from !== 'system' || message.text.trim() || message.attachmentUrl)
    .map((message) => ({
      id: message.id,
      from: message.from === 'doctor' ? 'doctor' : 'patient',
      time: message.time,
      text: message.text?.trim() || undefined,
      attachments:
        message.attachmentUrl && message.attachmentName
          ? [
              {
                id: `${message.id}-att`,
                type: message.attachmentName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
                url: message.attachmentUrl,
                name: message.attachmentName,
              },
            ]
          : undefined,
    }))
}

export function mapHistoricoToRecordNotes(
  historico: ProfissionalConsultaSessao['historicoProntuario'],
): DoctorRecordNote[] {
  return historico.map((item) => ({
    id: item.id,
    specialty: resolveDoctorRecordSpecialtyKey(item.specialty),
    date: item.date,
    doctorName: item.doctorName,
    note: item.note,
  }))
}

function resolveDoctorRecordSpecialtyKey(specialty: string): DoctorRecordNote['specialty'] {
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

export function formatPatientAgeGender(sessao: ProfissionalConsultaSessao): string {
  const gender = sessao.patientGender === 'F' ? 'Feminino' : 'Masculino'
  return `${sessao.patientAge} anos • ${gender}`
}
