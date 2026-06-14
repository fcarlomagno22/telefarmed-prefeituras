import { supabaseAdmin } from '../../db/supabase.js'
import { createAnexoSignedUrl } from './clinical-data.service.js'
import { mapMensagemToApi } from './formatters.js'
import type { ConsultaMensagemRow } from './types.js'
import type { ProfissionalMensagemApi } from './schemas.js'

export const MENSAGEM_SELECT =
  'id, remetente_tipo, conteudo, anexo_url, anexo_nome, anexo_storage_path, enviada_em'

export async function loadConsultaMensagemRows(consultaId: string): Promise<ConsultaMensagemRow[]> {
  const { data, error } = await supabaseAdmin
    .from('consulta_mensagens')
    .select(MENSAGEM_SELECT)
    .eq('consulta_id', consultaId)
    .order('enviada_em', { ascending: true })

  if (error) throw error
  return (data ?? []) as ConsultaMensagemRow[]
}

async function resolveMensagemAttachmentUrls(
  rows: ConsultaMensagemRow[],
): Promise<ConsultaMensagemRow[]> {
  return Promise.all(
    rows.map(async (row) => {
      const storagePath = row.anexo_storage_path?.trim()
      if (!storagePath) return row

      const signedUrl = await createAnexoSignedUrl(storagePath)
      if (!signedUrl) return row

      return { ...row, anexo_url: signedUrl }
    }),
  )
}

export async function listConsultaMensagensApi(consultaId: string): Promise<ProfissionalMensagemApi[]> {
  const rows = await loadConsultaMensagemRows(consultaId)
  const resolved = await resolveMensagemAttachmentUrls(rows)
  return resolved.map(mapMensagemToApi)
}
