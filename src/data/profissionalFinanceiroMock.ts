import { PROFISSIONAL_LOGGED_DOCTOR_ID } from '../config/profissionalConfig'
import { PROFISSIONAL_TELEMEDICINE_LABEL } from '../config/profissionalConfig'
import type {
  ProfissionalBillingShift,
  ProfissionalCompetenceClosure,
  ProfissionalPrestadorEmpresa,
} from '../types/profissionalFinanceiro'
import { formatProfissionalEscalaShiftId } from '../utils/profissional/formatProfissionalEscalaShiftId'

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

function supplementalShift(
  sourceId: string,
  competenceKey: string,
  day: number,
  turnLabel: 'Manhã' | 'Tarde' | 'Noite',
  startHour: number,
  endHour: number,
  status: ProfissionalBillingShift['status'],
  amountCents: number,
  attendedCount: number,
): ProfissionalBillingShift {
  const [year, month] = competenceKey.split('-').map(Number)
  const startAt = isoLocal(year, month, day, startHour)
  const endAt = isoLocal(year, month, day, endHour)
  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  return {
    id: `bill-sup-${sourceId}`,
    escalaShiftId: formatProfissionalEscalaShiftId(sourceId),
    competenceKey,
    dateKey,
    turnLabel,
    startAt,
    endAt,
    modalityLabel: PROFISSIONAL_TELEMEDICINE_LABEL,
    status,
    amountCents: status === 'cancelado' ? 0 : amountCents,
    attendedCount,
  }
}

/** Plantões extras para histórico e competências anteriores (médico logado). */
export const profissionalFinanceiroSupplementalShifts: {
  doctorId: string
  shift: ProfissionalBillingShift
}[] = [
  // Março/2026 — fechado e pago
  {
    doctorId: PROFISSIONAL_LOGGED_DOCTOR_ID,
    shift: supplementalShift('mar-1', '2026-03', 4, 'Manhã', 8, 14, 'realizado', 1_200_00, 11),
  },
  {
    doctorId: PROFISSIONAL_LOGGED_DOCTOR_ID,
    shift: supplementalShift('mar-2', '2026-03', 11, 'Tarde', 14, 20, 'realizado', 1_200_00, 9),
  },
  {
    doctorId: PROFISSIONAL_LOGGED_DOCTOR_ID,
    shift: supplementalShift('mar-3', '2026-03', 18, 'Manhã', 8, 14, 'realizado', 1_200_00, 0),
  },
  {
    doctorId: PROFISSIONAL_LOGGED_DOCTOR_ID,
    shift: supplementalShift('mar-4', '2026-03', 25, 'Tarde', 14, 20, 'realizado', 1_200_00, 12),
  },
  // Abril/2026 — fechado, em análise
  {
    doctorId: PROFISSIONAL_LOGGED_DOCTOR_ID,
    shift: supplementalShift('abr-1', '2026-04', 3, 'Manhã', 8, 14, 'realizado', 1_200_00, 10),
  },
  {
    doctorId: PROFISSIONAL_LOGGED_DOCTOR_ID,
    shift: supplementalShift('abr-2', '2026-04', 10, 'Tarde', 14, 20, 'realizado', 1_200_00, 8),
  },
  {
    doctorId: PROFISSIONAL_LOGGED_DOCTOR_ID,
    shift: supplementalShift('abr-3', '2026-04', 17, 'Manhã', 8, 14, 'realizado', 1_200_00, 7),
  },
  {
    doctorId: PROFISSIONAL_LOGGED_DOCTOR_ID,
    shift: supplementalShift('abr-4', '2026-04', 24, 'Tarde', 14, 20, 'realizado', 1_200_00, 0),
  },
  // Maio/2026 — plantões anteriores no mês (além da escala)
  {
    doctorId: PROFISSIONAL_LOGGED_DOCTOR_ID,
    shift: supplementalShift('mai-1', '2026-05', 6, 'Manhã', 8, 14, 'realizado', 1_200_00, 9),
  },
  {
    doctorId: PROFISSIONAL_LOGGED_DOCTOR_ID,
    shift: supplementalShift('mai-2', '2026-05', 13, 'Tarde', 14, 20, 'realizado', 1_200_00, 11),
  },
  {
    doctorId: PROFISSIONAL_LOGGED_DOCTOR_ID,
    shift: supplementalShift('mai-3', '2026-05', 20, 'Manhã', 8, 14, 'realizado', 1_200_00, 0),
  },
]

/** Empresa prestadora vinculada ao cadastro do profissional logado. */
export const profissionalPrestadorEmpresa: ProfissionalPrestadorEmpresa = {
  id: 'prest-1',
  razaoSocial: 'Fernanda Costa Serviços Médicos Ltda',
  nomeFantasia: 'FCM Telemedicina',
  cnpj: '28.456.789/0001-42',
  pixKeyType: 'cnpj',
  pixKeys: {
    cnpj: '28.456.789/0001-42',
    telefone: '(11) 98765-4321',
    email: 'financeiro@fcmtelmedicina.com.br',
    aleatoria: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  },
}

export const profissionalFinanceiroClosuresInitial: ProfissionalCompetenceClosure[] = [
  {
    competenceKey: '2026-03',
    status: 'pago',
    submittedAt: '2026-04-05T14:20:00',
    approvedAt: '2026-04-08T09:00:00',
    paidAt: '2026-04-12T11:30:00',
    invoiceFileName: 'NF-2026-03-FCM.pdf',
    invoiceNumber: '000124',
    pixKeyUsed: profissionalPrestadorEmpresa.pixKeys.cnpj,
  },
  {
    competenceKey: '2026-04',
    status: 'em_analise',
    submittedAt: '2026-05-06T16:45:00',
    invoiceFileName: 'NF-2026-04-FCM.pdf',
    invoiceNumber: '000138',
    pixKeyUsed: profissionalPrestadorEmpresa.pixKeys.cnpj,
  },
  {
    competenceKey: '2026-05',
    status: 'aberto',
  },
]

export const profissionalFinanceiroAvailableCompetences = [
  '2026-03',
  '2026-04',
  '2026-05',
] as const
