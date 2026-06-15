import { supabaseAdmin } from '../../db/supabase.js'
import { buildPlantaoIcsContent, buildPlantaoIcsFilename } from '../../lib/plantaoIcs.js'
import { PublicPlantaoAceiteError } from './errors.js'
import { formatPlantaoAceitePublicoFromSlotRow } from './formatters.js'
import { resolveConviteByToken } from './convite.service.js'
import type { ProfissionalSlotDisponivelRow } from '../profissional-escala/types.js'

export async function buildPlantaoAceiteIcsDownload(input: {
  token: string
  plantaoId: string
}): Promise<{ content: string; filename: string }> {
  const convite = await resolveConviteByToken(input.token)

  const { data: plantao, error: plantaoError } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select('id, slot_id, status')
    .eq('id', input.plantaoId)
    .eq('slot_id', convite.slot_id)
    .in('status', ['confirmado', 'realizado'])
    .maybeSingle()

  if (plantaoError) throw plantaoError
  if (!plantao) {
    throw new PublicPlantaoAceiteError('Plantão não encontrado.', 'NOT_FOUND', 404)
  }

  const { data: slotView, error: slotError } = await supabaseAdmin
    .from('vw_profissional_escala_slots_disponiveis')
    .select('*')
    .eq('id', convite.slot_id)
    .maybeSingle()

  if (slotError) throw slotError

  let plantaoDto
  if (slotView) {
    plantaoDto = formatPlantaoAceitePublicoFromSlotRow(slotView as ProfissionalSlotDisponivelRow)
  } else {
    const { data: slot, error: fallbackError } = await supabaseAdmin
      .from('escala_slots')
      .select(
        `
        id,
        data,
        hora_inicio,
        hora_fim,
        modalidade,
        valor_centavos,
        repasse_regra,
        vagas,
        unidade_nome,
        cidade,
        cidade_uf,
        endereco_completo,
        notas,
        publicado_em,
        config_especialidades!inner ( nome )
      `,
      )
      .eq('id', convite.slot_id)
      .maybeSingle()

    if (fallbackError) throw fallbackError
    if (!slot) {
      throw new PublicPlantaoAceiteError('Plantão não encontrado.', 'NOT_FOUND', 404)
    }

    const espRaw = slot.config_especialidades as unknown
    const esp = Array.isArray(espRaw) ? espRaw[0] : espRaw

    const row: ProfissionalSlotDisponivelRow = {
      id: String(slot.id),
      data: String(slot.data),
      hora_inicio: String(slot.hora_inicio),
      hora_fim: String(slot.hora_fim),
      inicio_em: `${slot.data} ${slot.hora_inicio}`,
      fim_em: `${slot.data} ${slot.hora_fim}`,
      especialidade_id: '',
      especialidade_nome: String((esp as { nome?: string })?.nome ?? ''),
      modalidade: slot.modalidade as ProfissionalSlotDisponivelRow['modalidade'],
      valor_centavos: Number(slot.valor_centavos ?? 0),
      repasse_regra: slot.repasse_regra,
      vagas: Number(slot.vagas ?? 0),
      vagas_disponiveis: 0,
      unidade_nome: slot.unidade_nome ? String(slot.unidade_nome) : null,
      cidade: slot.cidade ? String(slot.cidade) : null,
      cidade_uf: slot.cidade_uf ? String(slot.cidade_uf) : null,
      endereco_completo: slot.endereco_completo ? String(slot.endereco_completo) : null,
      notas: slot.notas ? String(slot.notas) : null,
      escopo_prefeitura: null,
      escopo_ubt: null,
      publicado_em: slot.publicado_em ? String(slot.publicado_em) : null,
    }

    plantaoDto = formatPlantaoAceitePublicoFromSlotRow(row)
  }

  const content = buildPlantaoIcsContent({
    plantaoId: input.plantaoId,
    specialty: plantaoDto.specialty,
    startAt: plantaoDto.startAt,
    endAt: plantaoDto.endAt,
    modality: plantaoDto.modality,
    modalityLabel: plantaoDto.modalityLabel,
    unitName: plantaoDto.unitName,
    fullAddress: plantaoDto.fullAddress,
    city: plantaoDto.city,
    cityUf: plantaoDto.cityUf,
    notes: plantaoDto.notes,
  })

  return {
    content,
    filename: buildPlantaoIcsFilename(plantaoDto.specialty),
  }
}
