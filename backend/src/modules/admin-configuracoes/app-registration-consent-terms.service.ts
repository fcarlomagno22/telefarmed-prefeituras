import {
  APP_HEALTH_DATA_SECONDARY_DOCUMENT_ID,
  APP_LEGAL_ACCEPTANCE_DOCUMENT_IDS,
  APP_LEGAL_ACCEPTANCE_KEYS,
  type AppLegalAcceptanceKey,
} from '../../lib/patientRegistrationAppConsent.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { ConfiguracoesError } from './errors.js'
import type { PatientRegistrationConsentTermDto } from './types.js'

type LegalDocumentRow = {
  id: string
  titulo: string
  conteudo: string
  versao: string
  rotulo_atualizacao: string
}

export type AppRegistrationConsentTermDto = PatientRegistrationConsentTermDto & {
  acceptanceKey: AppLegalAcceptanceKey
  secondaryDocumentId?: string
}

export type AppRegistrationConsentTermsDto = {
  terms: Record<AppLegalAcceptanceKey, AppRegistrationConsentTermDto>
}

function mapTermRow(
  row: LegalDocumentRow,
  acceptanceKey: AppLegalAcceptanceKey,
  secondaryDocumentId?: string,
): AppRegistrationConsentTermDto {
  return {
    acceptanceKey,
    id: row.id,
    title: row.titulo,
    content: row.conteudo,
    version: row.versao,
    updatedAtLabel: row.rotulo_atualizacao,
    ...(secondaryDocumentId ? { secondaryDocumentId } : {}),
  }
}

function collectDocumentIds(): string[] {
  const ids = new Set<string>(Object.values(APP_LEGAL_ACCEPTANCE_DOCUMENT_IDS))
  ids.add(APP_HEALTH_DATA_SECONDARY_DOCUMENT_ID)
  return [...ids]
}

export async function getAppRegistrationConsentTerms(): Promise<AppRegistrationConsentTermsDto> {
  const documentIds = collectDocumentIds()

  const { data, error } = await supabaseAdmin
    .from('config_documentos_legais')
    .select('id, titulo, conteudo, versao, rotulo_atualizacao')
    .in('id', documentIds)
    .eq('publicado', true)

  if (error) throw error

  const byId = new Map(
    ((data ?? []) as LegalDocumentRow[]).map((row) => [row.id, row]),
  )

  const terms = {} as AppRegistrationConsentTermsDto['terms']

  for (const key of APP_LEGAL_ACCEPTANCE_KEYS) {
    const documentId = APP_LEGAL_ACCEPTANCE_DOCUMENT_IDS[key]
    const row = byId.get(documentId)
    if (!row) {
      throw new ConfiguracoesError(
        `Termo de cadastro do app não encontrado: ${documentId}`,
        'NOT_FOUND',
        404,
      )
    }

    terms[key] = mapTermRow(
      row,
      key,
      key === 'healthDataConsent' ? APP_HEALTH_DATA_SECONDARY_DOCUMENT_ID : undefined,
    )
  }

  return { terms }
}
