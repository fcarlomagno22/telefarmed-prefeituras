import { supabaseAdmin } from '../../db/supabase.js'
import { ConfiguracoesError } from './errors.js'
import type {
  CreateLegalDocumentInput,
  LegalCatalogDto,
  LegalDocumentDto,
  LegalDocumentPortal,
  UpdateLegalDocumentInput,
} from './types.js'

export const PRESET_LEGAL_DOCUMENT_IDS = [
  'termos_uso',
  'faq',
  'privacidade',
  'consentimento_informado',
  'lgpd',
] as const

const DOCUMENT_COLUMNS =
  'id, titulo, conteudo, versao, rotulo_atualizacao, publicado, portais, ordem'

const VALID_PORTALS = new Set<LegalDocumentPortal>(['admin', 'prefeitura', 'ubt', 'terminal'])

type LegalDocumentRow = {
  id: string
  titulo: string
  conteudo: string
  versao: string
  rotulo_atualizacao: string
  publicado: boolean
  portais: string[]
  ordem: number
}

function normalizePortals(portals: string[]): LegalDocumentPortal[] {
  const unique = [...new Set(portals)]
  for (const portal of unique) {
    if (!VALID_PORTALS.has(portal as LegalDocumentPortal)) {
      throw new ConfiguracoesError('Portal inválido.', 'INVALID_DATA', 400)
    }
  }
  return unique as LegalDocumentPortal[]
}

function mapLegalDocumentRow(row: LegalDocumentRow): LegalDocumentDto {
  return {
    id: row.id,
    title: row.titulo,
    content: row.conteudo,
    version: row.versao,
    updatedAtLabel: row.rotulo_atualizacao,
    published: row.publicado,
    portals: normalizePortals(row.portais ?? []),
    sortOrder: row.ordem,
  }
}

export async function getLegalCatalog(options?: {
  publishedOnly?: boolean
  portal?: LegalDocumentPortal
}): Promise<LegalCatalogDto> {
  let query = supabaseAdmin
    .from('config_documentos_legais')
    .select(DOCUMENT_COLUMNS)
    .order('ordem', { ascending: true })
    .order('titulo', { ascending: true })

  if (options?.publishedOnly) {
    query = query.eq('publicado', true)
  }

  if (options?.portal) {
    query = query.contains('portais', [options.portal])
  }

  const { data, error } = await query

  if (error) throw error

  return {
    documents: ((data ?? []) as LegalDocumentRow[]).map(mapLegalDocumentRow),
  }
}

export async function createLegalDocument(input: CreateLegalDocumentInput): Promise<LegalDocumentDto> {
  if ((PRESET_LEGAL_DOCUMENT_IDS as readonly string[]).includes(input.id)) {
    throw new ConfiguracoesError(
      'Não é possível recriar um documento legal padrão da plataforma.',
      'FORBIDDEN',
      403,
    )
  }

  const portals = normalizePortals(input.portals)

  const { count, error: countError } = await supabaseAdmin
    .from('config_documentos_legais')
    .select('id', { count: 'exact', head: true })

  if (countError) throw countError

  const { data, error } = await supabaseAdmin
    .from('config_documentos_legais')
    .insert({
      id: input.id,
      titulo: input.title,
      conteudo: input.content ?? '',
      versao: input.version,
      rotulo_atualizacao: input.updatedAtLabel,
      publicado: input.published ?? false,
      portais: portals,
      ordem: (count ?? 0) + 1,
    })
    .select(DOCUMENT_COLUMNS)
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ConfiguracoesError(
        'Já existe um documento legal com este ID.',
        'DUPLICATE_NAME',
        409,
      )
    }
    throw error
  }

  return mapLegalDocumentRow(data as LegalDocumentRow)
}

export async function updateLegalDocument(
  id: string,
  input: UpdateLegalDocumentInput,
): Promise<LegalDocumentDto> {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('config_documentos_legais')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (existingError) throw existingError
  if (!existing) {
    throw new ConfiguracoesError('Documento legal não encontrado.', 'NOT_FOUND', 404)
  }

  const portals = normalizePortals(input.portals)

  const { data, error } = await supabaseAdmin
    .from('config_documentos_legais')
    .update({
      titulo: input.title,
      conteudo: input.content,
      versao: input.version,
      rotulo_atualizacao: input.updatedAtLabel,
      portais: portals,
    })
    .eq('id', id)
    .select(DOCUMENT_COLUMNS)
    .single()

  if (error) throw error

  return mapLegalDocumentRow(data as LegalDocumentRow)
}

export async function setLegalDocumentPublished(
  id: string,
  published: boolean,
): Promise<LegalDocumentDto> {
  const { data, error } = await supabaseAdmin
    .from('config_documentos_legais')
    .update({ publicado: published })
    .eq('id', id)
    .select(DOCUMENT_COLUMNS)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ConfiguracoesError('Documento legal não encontrado.', 'NOT_FOUND', 404)
  }

  return mapLegalDocumentRow(data as LegalDocumentRow)
}

export async function deleteLegalDocument(id: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('config_documentos_legais')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ConfiguracoesError('Documento legal não encontrado.', 'NOT_FOUND', 404)
  }
}
