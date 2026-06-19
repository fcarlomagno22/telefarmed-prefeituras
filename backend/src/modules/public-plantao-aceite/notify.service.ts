import { supabaseAdmin } from '../../db/supabase.js'
import { appPublicUrls } from '../../config/appUrls.js'
import type { PlantaoAceiteEmailSlotInput } from '../../lib/email/plantaoAceiteEmailFormatters.js'
import {
  buildPlantaoAceiteDigestEmailSubject,
  buildPlantaoAceiteDigestEmailVariables,
} from '../../lib/email/plantaoAceiteDigestEmailFormatters.js'
import {
  buildPlantaoAceiteDigestEmailHtml,
  buildPlantaoAceiteDigestEmailText,
} from '../../lib/email/plantaoAceiteDigestEmailTemplate.js'
import { sendMail } from '../../lib/email/smtp.js'
import { isPublicAppUrlLocalOnly } from '../../lib/codigoVerificacaoDocumento.js'
import { resolveSlotTimestampIso } from '../../lib/escalaDateTime.js'
import { slotMatchesProfissionalScope } from '../profissional-escala/context.service.js'
import type { ProfissionalEscalaContext } from '../profissional-escala/types.js'
import {
  findDigestIdByProfissionalId,
  issueDigestConvite,
  markDigestNotificado,
} from './digest.service.js'

type OpenSlotNotifyRow = {
  id: string
  data: string
  hora_inicio: string
  hora_fim: string
  modalidade: PlantaoAceiteEmailSlotInput['modalidade']
  especialidade_id: string
  especialidade_nome: string
  unidade_nome: string | null
  cidade: string | null
  cidade_uf: string | null
  endereco_completo: string | null
  vagas: number
  valor_centavos: number
  repasse_regra: unknown
  publicado_em: string
  escopo_prefeitura: unknown
  vagas_disponiveis: number
}

type EligibleProfessional = {
  id: string
  nome: string
  email: string
}

async function loadOpenSlotsForNotify(slotIds: string[]): Promise<OpenSlotNotifyRow[]> {
  if (slotIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('escala_slots')
    .select(
      `
      id,
      data,
      hora_inicio,
      hora_fim,
      modalidade,
      especialidade_id,
      unidade_nome,
      cidade,
      cidade_uf,
      endereco_completo,
      vagas,
      valor_centavos,
      repasse_regra,
      publicado_em,
      escopo_prefeitura,
      status,
      modo_atribuicao,
      config_especialidades!inner ( nome )
    `,
    )
    .in('id', slotIds)
    .eq('status', 'publicada')
    .eq('modo_atribuicao', 'open')

  if (error) throw error

  const rows: OpenSlotNotifyRow[] = []

  for (const slot of data ?? []) {
    const espRaw = slot.config_especialidades as unknown
    const esp = Array.isArray(espRaw) ? espRaw[0] : espRaw

    const { count, error: countError } = await supabaseAdmin
      .from('escala_plantoes_confirmados')
      .select('id', { count: 'exact', head: true })
      .eq('slot_id', slot.id)
      .in('status', ['confirmado', 'realizado'])

    if (countError) throw countError

    const vagas = Number(slot.vagas ?? 0)
    const vagasDisponiveis = Math.max(0, vagas - Number(count ?? 0))
    if (vagasDisponiveis <= 0) continue

    rows.push({
      id: String(slot.id),
      data: String(slot.data),
      hora_inicio: String(slot.hora_inicio),
      hora_fim: String(slot.hora_fim),
      modalidade: slot.modalidade as OpenSlotNotifyRow['modalidade'],
      especialidade_id: String(slot.especialidade_id),
      especialidade_nome: String((esp as { nome?: string })?.nome ?? ''),
      unidade_nome: slot.unidade_nome ? String(slot.unidade_nome) : null,
      cidade: slot.cidade ? String(slot.cidade) : null,
      cidade_uf: slot.cidade_uf ? String(slot.cidade_uf) : null,
      endereco_completo: slot.endereco_completo ? String(slot.endereco_completo) : null,
      vagas,
      valor_centavos: Number(slot.valor_centavos ?? 0),
      repasse_regra: slot.repasse_regra,
      publicado_em: slot.publicado_em ? String(slot.publicado_em) : new Date().toISOString(),
      escopo_prefeitura: slot.escopo_prefeitura,
      vagas_disponiveis: vagasDisponiveis,
    })
  }

  return rows.sort((a, b) => {
    const startA = new Date(resolveSlotTimestampIso(a.data, a.hora_inicio)).getTime()
    const startB = new Date(resolveSlotTimestampIso(b.data, b.hora_inicio)).getTime()
    return startA - startB
  })
}

async function listEligibleProfessionals(
  slot: Pick<OpenSlotNotifyRow, 'especialidade_id' | 'escopo_prefeitura'>,
): Promise<EligibleProfessional[]> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id, nome, email, especialidade_id, alocacao, entidade_contratante_id')
    .eq('status', 'ativo')
    .eq('especialidade_id', slot.especialidade_id)
    .not('email', 'is', null)

  if (error) throw error

  const eligible: EligibleProfessional[] = []

  for (const row of data ?? []) {
    const email = row.email ? String(row.email).trim() : ''
    if (!email) continue

    const ctx: ProfissionalEscalaContext = {
      profissionalId: String(row.id),
      especialidadeId: row.especialidade_id ? String(row.especialidade_id) : null,
      alocacao: row.alocacao === 'por_contrato' ? 'por_contrato' : 'nacional',
      entidadeContratanteId: row.entidade_contratante_id
        ? String(row.entidade_contratante_id)
        : null,
    }

    if (
      slotMatchesProfissionalScope(
        {
          especialidade_id: slot.especialidade_id,
          escopo_prefeitura: slot.escopo_prefeitura,
        },
        ctx,
      )
    ) {
      eligible.push({
        id: String(row.id),
        nome: String(row.nome),
        email,
      })
    }
  }

  return eligible
}

function toEmailSlot(slot: OpenSlotNotifyRow): PlantaoAceiteEmailSlotInput {
  return {
    especialidade: slot.especialidade_nome,
    data: slot.data,
    hora_inicio: slot.hora_inicio,
    hora_fim: slot.hora_fim,
    modalidade: slot.modalidade,
    unidade_nome: slot.unidade_nome,
    cidade: slot.cidade,
    cidade_uf: slot.cidade_uf,
    endereco_completo: slot.endereco_completo,
    vagas_disponiveis: slot.vagas_disponiveis,
    valor_centavos: slot.valor_centavos,
    repasse_regra: slot.repasse_regra,
    publicado_em: slot.publicado_em,
  }
}

async function buildProfessionalSlotMap(
  slots: OpenSlotNotifyRow[],
): Promise<Map<string, { prof: EligibleProfessional; slots: OpenSlotNotifyRow[] }>> {
  const byEmail = new Map<string, { prof: EligibleProfessional; slots: OpenSlotNotifyRow[] }>()

  for (const slot of slots) {
    const professionals = await listEligibleProfessionals(slot)
    for (const prof of professionals) {
      const key = prof.email.toLowerCase()
      const existing = byEmail.get(key)
      if (existing) {
        if (!existing.slots.some((item) => item.id === slot.id)) {
          existing.slots.push(slot)
        }
        continue
      }
      byEmail.set(key, { prof, slots: [slot] })
    }
  }

  for (const entry of byEmail.values()) {
    entry.slots.sort((a, b) => {
      const startA = new Date(resolveSlotTimestampIso(a.data, a.hora_inicio)).getTime()
      const startB = new Date(resolveSlotTimestampIso(b.data, b.hora_inicio)).getTime()
      return startA - startB
    })
  }

  return byEmail
}

async function notifyProfessionalDigest(input: {
  prof: EligibleProfessional
  slots: OpenSlotNotifyRow[]
}): Promise<void> {
  const digestToken = await issueDigestConvite({
    profissionalId: input.prof.id,
    slotIds: input.slots.map((slot) => slot.id),
    slotsForExpiry: input.slots.map((slot) => ({
      data: slot.data,
      hora_inicio: slot.hora_inicio,
    })),
  })

  const linkVagas = appPublicUrls.plantaoAceiteDigestUrl(digestToken)
  if (isPublicAppUrlLocalOnly()) {
    console.warn(
      '[plantao-aceite-notify] PUBLIC_APP_URL aponta para localhost — links do e-mail não abrem no celular. ' +
        'Defina PUBLIC_APP_LAN_URL=http://SEU_IP:5173 no backend/.env (ex.: http://192.168.1.103:5173).',
    )
  }

  const variables = buildPlantaoAceiteDigestEmailVariables(
    input.slots.map(toEmailSlot),
    {
      link_vagas: linkVagas,
      link_escala: appPublicUrls.profissionalAgendaUrl(),
    },
  )

  const subject = buildPlantaoAceiteDigestEmailSubject(variables)
  const html = buildPlantaoAceiteDigestEmailHtml(variables)
  const text = buildPlantaoAceiteDigestEmailText(variables)

  await sendMail({
    to: input.prof.email,
    subject,
    html,
    text,
  })

  const digestId = await findDigestIdByProfissionalId(input.prof.id)
  if (digestId) {
    await markDigestNotificado(digestId)
  }
}

export async function notifyPublishedOpenPlantaoSlots(slotIds: string[]): Promise<void> {
  const slots = await loadOpenSlotsForNotify(slotIds)
  if (slots.length === 0) return

  const professionalMap = await buildProfessionalSlotMap(slots)

  for (const entry of professionalMap.values()) {
    try {
      await notifyProfessionalDigest(entry)
    } catch (error) {
      console.error(
        `[plantao-aceite-notify] falha ao notificar ${entry.prof.email}:`,
        error,
      )
    }
  }
}

export function enqueuePublishedOpenPlantaoNotifications(slotIds: string[]): void {
  void notifyPublishedOpenPlantaoSlots(slotIds).catch((error) => {
    console.error('[plantao-aceite-notify] falha ao processar notificações:', error)
  })
}
