import {
  parseRepasseRule,
  type EscalaRepasseRule,
} from '../../modules/admin-escala/repasseRule.js'
import {
  resolveShiftTurnLabel,
  resolveSlotTimestampIso,
} from '../escalaDateTime.js'
import { PLANTAO_ACEITE_EMAIL_DEFAULTS } from './plantaoAceiteEmailConstants.js'
import type { PlantaoAceiteEmailVariables } from './plantaoAceiteEmailTemplate.js'

const APP_TIMEZONE = 'America/Sao_Paulo'

type SlotModalidade = 'tele' | 'hibrido' | 'presencial_ubt'

export type PlantaoAceiteEmailSlotInput = {
  especialidade: string
  data: string
  hora_inicio: string
  hora_fim: string
  modalidade: SlotModalidade
  unidade_nome?: string | null
  cidade?: string | null
  cidade_uf?: string | null
  endereco_completo?: string | null
  vagas_disponiveis: number
  valor_centavos: number
  repasse_regra: unknown
  publicado_em: string
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatTimeShort(time: string): string {
  const [hour = '00', minute = '00'] = time.split(':')
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
}

function formatDateBr(data: string): string {
  const instant = new Date(resolveSlotTimestampIso(data, '12:00:00'))
  return instant.toLocaleDateString('pt-BR', { timeZone: APP_TIMEZONE })
}

function formatWeekdayBr(data: string): string {
  const instant = new Date(resolveSlotTimestampIso(data, '12:00:00'))
  return instant.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: APP_TIMEZONE })
}

function formatPublishedAt(iso: string): string {
  const instant = new Date(iso)
  if (Number.isNaN(instant.getTime())) return iso
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: APP_TIMEZONE,
  }).format(instant)
}

function formatDurationLabel(data: string, horaInicio: string, horaFim: string): string {
  const startMs = new Date(resolveSlotTimestampIso(data, horaInicio)).getTime()
  let endMs = new Date(resolveSlotTimestampIso(data, horaFim)).getTime()
  if (endMs <= startMs) endMs += 24 * 60 * 60 * 1000

  const hours = Math.round(((endMs - startMs) / (1000 * 60 * 60)) * 10) / 10
  const label = Number.isInteger(hours) ? String(hours) : String(hours).replace('.', ',')
  return `${label}h de duração`
}

function formatModalityLabel(modalidade: SlotModalidade): string {
  switch (modalidade) {
    case 'tele':
      return 'Telemedicina'
    case 'hibrido':
      return 'Híbrido'
    case 'presencial_ubt':
      return 'Presencial na UBT'
    default:
      return 'Telemedicina'
  }
}

function formatLocalLabel(input: PlantaoAceiteEmailSlotInput): string | null {
  if (input.modalidade === 'tele') return null

  const unit = input.unidade_nome?.trim()
  const address = input.endereco_completo?.trim()
  const city = input.cidade?.trim()
  const uf = input.cidade_uf?.trim()
  const cityUf = city && uf ? `${city}/${uf}` : city || uf || null

  if (unit && address) return `${unit} · ${address}`
  if (unit && cityUf) return `${unit} · ${cityUf}`
  if (unit) return unit
  if (address) return address
  if (cityUf) return cityUf
  return input.modalidade === 'hibrido' ? 'Híbrido' : 'Presencial'
}

function formatRepasseRuleSummary(rule: EscalaRepasseRule): string {
  const minOnline = rule.criteriosPresenca.minPercentualOnline
  const tratamento =
    rule.criteriosPresenca.tratamentoInelegivel === 'proporcional_consultas'
      ? 'prop.'
      : 'análise'

  switch (rule.modalidade) {
    case 'plantao_fixo':
      return `Fixo · ≥${minOnline}% online · senão ${tratamento}`
    case 'por_consulta':
      return `Por consulta · ≥${minOnline}% online`
    case 'hibrido':
      return `Híbrido ${rule.percentualFixoHibrido ?? 0}% + consulta · ≥${minOnline}% online`
    default:
      return 'Repasse conforme regras do plantão'
  }
}

function formatValorResumo(rule: EscalaRepasseRule, amountCents: number): string {
  switch (rule.modalidade) {
    case 'plantao_fixo':
      return formatCurrency(
        amountCents > 0 && rule.valorPlantaoCentavos <= 0
          ? amountCents
          : rule.valorPlantaoCentavos,
      )
    case 'por_consulta':
      return `${formatCurrency(rule.valorConsultaCentavos)} / consulta`
    case 'hibrido': {
      const fixo = formatCurrency(rule.valorPlantaoCentavos)
      const consulta = formatCurrency(rule.valorConsultaCentavos)
      return `${fixo} + ${consulta} / consulta`
    }
    default:
      return formatCurrency(amountCents)
  }
}

export function buildPlantaoAceiteEmailVariablesFromSlot(
  slot: PlantaoAceiteEmailSlotInput,
  options: {
    link_aceite: string
    prazo_aceite?: string | null
    link_escala?: string
    nome_plataforma?: string
  },
): PlantaoAceiteEmailVariables {
  const turno = resolveShiftTurnLabel(slot.hora_inicio, slot.hora_fim)
  const repasseRule = parseRepasseRule(slot.repasse_regra, slot.valor_centavos)

  return {
    especialidade: slot.especialidade,
    data: formatDateBr(slot.data),
    dia_semana: formatWeekdayBr(slot.data),
    hora_inicio: formatTimeShort(slot.hora_inicio),
    hora_fim: formatTimeShort(slot.hora_fim),
    duracao: formatDurationLabel(slot.data, slot.hora_inicio, slot.hora_fim),
    turno,
    modalidade: formatModalityLabel(slot.modalidade),
    local: formatLocalLabel(slot),
    vagas_disponiveis: String(Math.max(0, slot.vagas_disponiveis)),
    valor_resumo: formatValorResumo(repasseRule, slot.valor_centavos),
    repasse_resumo: formatRepasseRuleSummary(repasseRule),
    link_aceite: options.link_aceite,
    link_escala: options.link_escala ?? PLANTAO_ACEITE_EMAIL_DEFAULTS.link_escala,
    prazo_aceite: options.prazo_aceite?.trim() || null,
    publicado_em: formatPublishedAt(slot.publicado_em),
    nome_plataforma: options.nome_plataforma ?? PLANTAO_ACEITE_EMAIL_DEFAULTS.nome_plataforma,
  }
}

export function buildPlantaoAceiteEmailSubject(variables: PlantaoAceiteEmailVariables): string {
  return `Novo plantão: ${variables.especialidade} — ${variables.data}`
}
