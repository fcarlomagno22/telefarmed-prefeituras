import type { PlantaoAceitePublico } from '../types/plantaoAceitePublico'
import {
  applyRepasseModalidadeChange,
  createDefaultRepasseRule,
  formatRepasseRuleSummary,
} from '../utils/adminEscala/repasseRule'
import { formatProfissionalCurrency } from '../utils/profissional/formatProfissionalCurrency'

const repasseHibrido = applyRepasseModalidadeChange(
  'hibrido',
  createDefaultRepasseRule(1_350_00),
  1_350_00,
)

function isoLocal(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`
}

function formatPublishedAtLabel(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso))
}

function formatValorResumo(plantao: Pick<PlantaoAceitePublico, 'amountCents' | 'repasseRule'>): string {
  const { repasseRule, amountCents } = plantao
  switch (repasseRule.modalidade) {
    case 'plantao_fixo':
      return formatProfissionalCurrency(repasseRule.valorPlantaoCentavos || amountCents)
    case 'por_consulta':
      return `${formatProfissionalCurrency(repasseRule.valorConsultaCentavos)} / consulta`
    case 'hibrido':
      return `${formatProfissionalCurrency(repasseRule.valorPlantaoCentavos)} + ${formatProfissionalCurrency(repasseRule.valorConsultaCentavos)} / consulta`
    default:
      return formatProfissionalCurrency(amountCents)
  }
}

export const plantaoAceitePublicoDemo: PlantaoAceitePublico = {
  slotId: 'esc-demo-aceite',
  specialty: 'Clínica Médica',
  startAt: isoLocal(2026, 6, 18, 8),
  endAt: isoLocal(2026, 6, 18, 14),
  turnLabel: 'Manhã',
  modality: 'presencial',
  modalityLabel: 'Presencial na UBT',
  unitName: 'UBT Saúde Central',
  city: 'São Paulo',
  cityUf: 'SP',
  fullAddress: 'Av. Paulista, 1578 — Bela Vista, São Paulo/SP',
  vacancies: 2,
  amountCents: 1_350_00,
  repasseRule: repasseHibrido,
  notes: 'Plantão com demanda prevista na rede municipal. Chegar com 15 minutos de antecedência.',
  publishedAt: '2026-06-14T19:32:00',
  publishedAtLabel: formatPublishedAtLabel('2026-06-14T19:32:00'),
  prazoAceiteLabel: '17/06/2026 às 23:59',
  status: 'disponivel',
  canApplyAsReserve: false,
  reserveQueueCount: 0,
}

export const plantaoAceitePublicoDemoEsgotado: PlantaoAceitePublico = {
  ...plantaoAceitePublicoDemo,
  vacancies: 0,
  status: 'vagas_esgotadas',
  canApplyAsReserve: true,
  reserveQueueCount: 1,
}

export function getPlantaoAceiteDemoValorResumo(): string {
  return formatValorResumo(plantaoAceitePublicoDemo)
}

export function getPlantaoAceiteDemoRepasseResumo(): string {
  return formatRepasseRuleSummary(plantaoAceitePublicoDemo.repasseRule)
}
