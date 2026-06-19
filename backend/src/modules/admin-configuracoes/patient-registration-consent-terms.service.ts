import {
  PATIENT_REGISTRATION_CONSENT_TERM_IDS,
  PATIENT_REGISTRATION_CONSENT_TERM_KEYS,
  type PatientRegistrationConsentTermKey,
} from '../../lib/patientRegistrationConsentTerms.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { ConfiguracoesError } from './errors.js'
import type { PatientRegistrationConsentTermDto, PatientRegistrationConsentTermsDto } from './types.js'

type LegalDocumentRow = {
  id: string
  titulo: string
  conteudo: string
  versao: string
  rotulo_atualizacao: string
}

function mapTermRow(row: LegalDocumentRow): PatientRegistrationConsentTermDto {
  return {
    id: row.id,
    title: row.titulo,
    content: row.conteudo,
    version: row.versao,
    updatedAtLabel: row.rotulo_atualizacao,
  }
}

export async function getPatientRegistrationConsentTerms(): Promise<PatientRegistrationConsentTermsDto> {
  const documentIds = Object.values(PATIENT_REGISTRATION_CONSENT_TERM_IDS)

  const { data, error } = await supabaseAdmin
    .from('config_documentos_legais')
    .select('id, titulo, conteudo, versao, rotulo_atualizacao')
    .in('id', documentIds)
    .eq('publicado', true)

  if (error) throw error

  const byId = new Map(
    ((data ?? []) as LegalDocumentRow[]).map((row) => [row.id, mapTermRow(row)]),
  )

  const terms = {} as PatientRegistrationConsentTermsDto['terms']

  for (const key of PATIENT_REGISTRATION_CONSENT_TERM_KEYS) {
    const documentId = PATIENT_REGISTRATION_CONSENT_TERM_IDS[key]
    const term = byId.get(documentId)
    if (!term) {
      throw new ConfiguracoesError(
        `Termo de cadastro não encontrado: ${documentId}`,
        'NOT_FOUND',
        404,
      )
    }
    terms[key as PatientRegistrationConsentTermKey] = term
  }

  return { terms }
}
